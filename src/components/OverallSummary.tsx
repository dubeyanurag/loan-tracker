// src/components/OverallSummary.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator'; 
import { formatCurrency } from '../utils/formatting'; // Import formatCurrency

const SummaryContainer = styled.div`
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid #007bff; 
  border-radius: 8px;
  background-color: #e7f3ff; 
`;

const Title = styled.h3`
  margin-top: 0;
  color: #0056b3;
  border-bottom: 1px solid #b8d9f2;
  padding-bottom: 10px;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
`;

const SummaryItem = styled.div`
    font-size: 0.95em;
    strong {
        color: #333;
    }
`;

const OverallSummary: React.FC = () => {
  const { loans, currency } = useAppState(); // Get currency from state

  const hasAnyPreEMILoan = useMemo(() => loans.some(loan => loan.details.startedWithPreEMI), [loans]);

  const overallData = useMemo(() => {
    let totalOutstanding = 0;
    let totalCurrentEMI = 0;
    let totalPrincipalPaid = 0;
    let totalRegularInterestPaid = 0;
    let totalPreEMIInterestPaid = 0;
    // Deductible fields are calculated but not displayed per previous request
    let cumulativeDeductiblePrincipal = 0; 
    let cumulativeDeductibleInterest = 0; 

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 

    loans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        if (schedule.length === 0) return; 

        const summaryToDate = generateSummaryToDate(schedule, loan.details, 3); 
        
        if(summaryToDate) {
            totalOutstanding += summaryToDate.currentOutstandingBalance;
            totalPrincipalPaid += summaryToDate.uncappedTotalPrincipalPaid; 
            totalRegularInterestPaid += summaryToDate.uncappedTotalInterestPaid; 
            totalPreEMIInterestPaid += summaryToDate.totalPreEMIInterestPaid; 
            
            cumulativeDeductiblePrincipal += summaryToDate.totalDeductiblePrincipal; 
            cumulativeDeductibleInterest += summaryToDate.totalDeductibleInterest; 

            if (summaryToDate.currentOutstandingBalance > 0) {
                let currentMonthEntry = null;
                 for(let i = 0; i < schedule.length; i++) {
                    const entryDate = new Date(schedule[i].paymentDate);
                    if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
                        currentMonthEntry = schedule[i];
                        break;
                    }
                 }
                 if (currentMonthEntry) {
                     totalCurrentEMI += currentMonthEntry.emi;
                 }
            }
        }
    });

    return {
        totalOutstanding: parseFloat(totalOutstanding.toFixed(2)),
        totalCurrentEMI: parseFloat(totalCurrentEMI.toFixed(2)),
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)), 
        totalRegularInterestPaid: parseFloat(totalRegularInterestPaid.toFixed(2)),   
        totalPreEMIInterestPaid: parseFloat(totalPreEMIInterestPaid.toFixed(2)),
        totalDeductiblePrincipal: parseFloat(cumulativeDeductiblePrincipal.toFixed(2)), // Still calculated
        totalDeductibleInterest: parseFloat(cumulativeDeductibleInterest.toFixed(2)), // Still calculated
        numberOfLoans: loans.length
    };
  }, [loans]);

  if (loans.length === 0) {
    return null; 
  }

  return (
    <SummaryContainer>
      <Title>Overall Loan Summary ({overallData.numberOfLoans} Loan{overallData.numberOfLoans !== 1 ? 's' : ''})</Title>
      <SummaryGrid>
        <SummaryItem><strong>Total Outstanding:</strong> {formatCurrency(overallData.totalOutstanding, currency)}</SummaryItem>
        <SummaryItem><strong>Total Current Monthly EMI:</strong> {formatCurrency(overallData.totalCurrentEMI, currency)}</SummaryItem>
        <SummaryItem><strong>Total Principal Paid (To Date):</strong> {formatCurrency(overallData.totalPrincipalPaid, currency)}</SummaryItem>
        {hasAnyPreEMILoan && <SummaryItem><strong>Total Pre-EMI Interest Paid (To Date):</strong> {formatCurrency(overallData.totalPreEMIInterestPaid, currency)}</SummaryItem>}
        <SummaryItem><strong>Total Regular Interest Paid (To Date):</strong> {formatCurrency(overallData.totalRegularInterestPaid, currency)}</SummaryItem>
        {/* Removed Total Deductible Principal and Interest (To Date) from display */}
      </SummaryGrid>
    </SummaryContainer>
  );
};

export default OverallSummary;
