// src/components/OverallSummary.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator'; 
// import { Loan } from '../types'; // Removed unused Loan import

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

// Removed calculateCurrentValues helper function

const OverallSummary: React.FC = () => {
  const { loans } = useAppState();

  const overallData = useMemo(() => {
    let totalOutstanding = 0;
    let totalCurrentEMI = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalDeductiblePrincipal = 0;
    let totalDeductibleInterest = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    loans.forEach(loan => {
        const schedule = generateAmortizationSchedule(loan);
        if (schedule.length === 0) return; 

        // Assume default FY start for this overall summary (April)
        const summaryToDate = generateSummaryToDate(schedule, loan.details, 3); 
        
        if(summaryToDate) {
            totalOutstanding += summaryToDate.currentOutstandingBalance;
            totalPrincipalPaid += summaryToDate.totalPrincipalPaid;
            totalInterestPaid += summaryToDate.totalInterestPaid;
            totalDeductiblePrincipal += summaryToDate.totalDeductiblePrincipal;
            totalDeductibleInterest += summaryToDate.totalDeductibleInterest;

            // --- Corrected Current EMI Calculation ---
            if (summaryToDate.currentOutstandingBalance > 0) {
                // Find the schedule entry for the current calendar month/year
                let currentMonthEntry = null;
                 for(let i = 0; i < schedule.length; i++) {
                    const entryDate = new Date(schedule[i].paymentDate);
                    if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
                        currentMonthEntry = schedule[i];
                        break;
                    }
                    // If current date is past the schedule end, use the last entry's EMI if balance > 0
                    if (i === schedule.length - 1 && schedule[i].closingBalance > 0) {
                         // This case might indicate an issue or a very long loan
                         // Using last EMI as fallback if current month not found but balance exists
                         // currentMonthEntry = schedule[i]; 
                    }
                 }

                 if (currentMonthEntry) {
                     totalCurrentEMI += currentMonthEntry.emi;
                 }
                 // If currentMonthEntry is null (e.g., loan starts in future), EMI is 0 for this loan's contribution
            }
            // --- End Corrected Current EMI Calculation ---
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
    return null; 
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
