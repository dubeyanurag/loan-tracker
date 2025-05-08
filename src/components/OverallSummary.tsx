// src/components/OverallSummary.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';
import { generateAmortizationSchedule, generateAnnualSummaries, generateSummaryToDate } from '../utils/amortizationCalculator';
import { calculateEMI, calculateTotalDisbursed } from '../utils/loanCalculations';
import { Loan } from '../types'; // Removed unused LoanDetails, CurrentSummary

const SummaryContainer = styled.div`
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #007bff; /* Blue border */
  border-radius: 8px;
  background-color: #e7f3ff; /* Light blue background */
`;

const Title = styled.h3`
  margin-top: 0;
  color: #0056b3;
  border-bottom: 1px solid #b8d9f2;
  padding-bottom: 10px;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Responsive columns */
    gap: 15px;
`;

const SummaryItem = styled.div`
    font-size: 0.95em;
    strong {
        color: #333;
    }
`;

// Helper function to calculate current values for a single loan
const calculateCurrentValues = (loan: Loan) => {
    const amortizationSchedule = generateAmortizationSchedule(loan);
    if (amortizationSchedule.length === 0) {
        const totalDisbursed = calculateTotalDisbursed(loan.details.disbursements);
        const initialEMI = calculateEMI(totalDisbursed, loan.details.originalInterestRate, loan.details.originalTenureMonths);
        return { currentRate: loan.details.originalInterestRate, currentEMI: initialEMI };
    }
    const lastEntry = amortizationSchedule[amortizationSchedule.length - 1];
    let effectiveRate = loan.details.originalInterestRate;
    let effectiveEMI = calculateEMI(calculateTotalDisbursed(loan.details.disbursements), loan.details.originalInterestRate, loan.details.originalTenureMonths); // Fallback

    const lastRoiChange = [...(loan.interestRateChanges || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .find(change => new Date(change.date) <= new Date(lastEntry.paymentDate));
    if(lastRoiChange) effectiveRate = lastRoiChange.newRate;

    const lastEmiEvent = [...(loan.interestRateChanges || []), ...(loan.customEMIChanges || [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .find(change => new Date(change.date) <= new Date(lastEntry.paymentDate));
     if(lastEmiEvent) {
          if ('newRate' in lastEmiEvent && lastEmiEvent.adjustmentPreference === 'adjustEMI') {
              effectiveEMI = lastEntry.emi; 
          } else if ('newEMI' in lastEmiEvent) {
              effectiveEMI = lastEmiEvent.newEMI;
          } else if ('newRate' in lastEmiEvent && lastEmiEvent.adjustmentPreference === 'customEMI' && lastEmiEvent.newEMIIfApplicable) {
               effectiveEMI = lastEmiEvent.newEMIIfApplicable;
          } else {
              effectiveEMI = lastEntry.emi;
          }
     } else if (amortizationSchedule.length > 0) { 
          effectiveEMI = lastEntry.emi; 
     }

    return {
        currentRate: effectiveRate,
        currentEMI: effectiveEMI,
    };
};


const OverallSummary: React.FC = () => {
  const { loans } = useAppState();

  const overallData = useMemo(() => {
    let totalOutstanding = 0;
    let totalCurrentEMI = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalDeductiblePrincipal = 0;
    let totalDeductibleInterest = 0;

    loans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        // Assume default FY start for this overall summary (April)
        // Need annual summaries to calculate total deductible amounts to date
        const annualSummaries = generateAnnualSummaries(schedule, loan.details, 3); 
        const summaryToDate = generateSummaryToDate(schedule, loan.details, 3); 
        const currentVals = calculateCurrentValues(loan);

        if(summaryToDate) {
            totalOutstanding += summaryToDate.currentOutstandingBalance;
            totalPrincipalPaid += summaryToDate.totalPrincipalPaid;
            totalInterestPaid += summaryToDate.totalInterestPaid;
            totalDeductiblePrincipal += summaryToDate.totalDeductiblePrincipal;
            totalDeductibleInterest += summaryToDate.totalDeductibleInterest;
        }
        // Add current EMI only if loan is not fully paid (outstanding > 0)
        if (summaryToDate && summaryToDate.currentOutstandingBalance > 0) {
             totalCurrentEMI += currentVals.currentEMI;
        }
    });

    return {
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        totalCurrentEMI: parseFloat(totalCurrentEMI.toFixed(2)),
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        totalDeductiblePrincipal: parseFloat(totalDeductiblePrincipal.toFixed(2)),
        totalDeductibleInterest: parseFloat(totalDeductibleInterest.toFixed(2)),
        numberOfLoans: loans.length
    };
  }, [loans]);

  if (loans.length === 0) {
    return null; // Don't show summary if no loans exist
  }

  return (
    <SummaryContainer>
      <Title>Overall Loan Summary ({overallData.numberOfLoans} Loan{overallData.numberOfLoans !== 1 ? 's' : ''})</Title>
      <SummaryGrid>
        <SummaryItem><strong>Total Outstanding:</strong> ₹{overallData.totalOutstanding.toLocaleString()}</SummaryItem>
        <SummaryItem><strong>Total Current Monthly EMI:</strong> ₹{overallData.totalCurrentEMI.toLocaleString()}</SummaryItem>
        <SummaryItem><strong>Total Principal Paid (To Date):</strong> ₹{overallData.totalPrincipalPaid.toLocaleString()}</SummaryItem>
        <SummaryItem><strong>Total Interest Paid (To Date):</strong> ₹{overallData.totalInterestPaid.toLocaleString()}</SummaryItem>
        <SummaryItem><strong>Total Deductible Principal (To Date):</strong> ₹{overallData.totalDeductiblePrincipal.toLocaleString()}</SummaryItem>
        <SummaryItem><strong>Total Deductible Interest (To Date):</strong> ₹{overallData.totalDeductibleInterest.toLocaleString()}</SummaryItem>
      </SummaryGrid>
    </SummaryContainer>
  );
};

export default OverallSummary;
