// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useCallback } from 'react'; 
import styled from 'styled-components';
import { Loan, AmortizationEntry, InterestRateChange, CustomEMIChange } from '../types'; 
import { calculateEMI, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
// import PreEmiPaymentForm from './PaymentForm'; // Removed import
import AddDisbursementForm from './AddDisbursementForm'; 
import PrepaymentSimulator from './PrepaymentSimulator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 
import { useAppDispatch } from '../contexts/AppContext'; 

const DetailsContainer = styled.div`
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  margin-top: 10px;

  h3 {
    margin-top: 0;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  h4 { /* Keep styles for other headings if needed */
    margin-bottom: 5px;
    margin-top: 15px;
    color: #444;
  }
`;

const DetailItem = styled.p`
  margin: 8px 0;
  font-size: 1em;
  color: #555;
  strong {
    color: #333;
  }
`;

// Simple Edit button style (No longer needed here)
// const EditButton = styled.button` ... `;


interface LoanDetailsDisplayProps {
  loan: Loan;
}

const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
  const { details } = loan; 
  const dispatch = useAppDispatch(); // Keep dispatch if needed for future edits from table

  const totalDisbursed = useMemo(() => calculateTotalDisbursed(details.disbursements), [details.disbursements]);

  const initialEMI = useMemo(() => {
    if (details.disbursements.length > 0) {
         return calculateEMI(totalDisbursed, details.originalInterestRate, details.originalTenureMonths);
    }
    return 0;
  }, [details.disbursements, details.originalInterestRate, details.originalTenureMonths, totalDisbursed]);

  const summary = useMemo(() => {
    if (initialEMI > 0 && totalDisbursed > 0) {
      return calculateTotalInterestAndPayment(
        totalDisbursed, 
        initialEMI,
        details.originalTenureMonths
      );
    }
    return { totalInterest: 0, totalPayment: 0 };
  }, [totalDisbursed, initialEMI, details.originalTenureMonths]);

  const amortizationSchedule: AmortizationEntry[] = useMemo(() => {
    return generateAmortizationSchedule(loan);
  }, [loan]); 

  // Edit Handlers removed as they were tied to the deleted lists

  return (
    <DetailsContainer>
       <h3>{loan.name} - Summary</h3>
       <DetailItem><strong>Total Disbursed:</strong> ₹{totalDisbursed.toLocaleString()}</DetailItem> 
       <DetailItem><strong>Annual Interest Rate:</strong> {details.originalInterestRate}%</DetailItem>
       <DetailItem><strong>Original Tenure:</strong> {details.originalTenureMonths / 12} years ({details.originalTenureMonths} months)</DetailItem>
       <DetailItem><strong>Loan Start Date:</strong> {new Date(details.startDate).toLocaleDateString()}</DetailItem>
       {details.startedWithPreEMI && details.emiStartDate && 
         <DetailItem><strong>Full EMI Start Date:</strong> {new Date(details.emiStartDate).toLocaleDateString()}</DetailItem>
       }
       {details.startedWithPreEMI && !details.emiStartDate && 
         <DetailItem><em>(Loan started with Pre-EMI period - EMI Start Date not set)</em></DetailItem>
       }
       
       <hr style={{ margin: '15px 0', borderColor: '#eee' }} />

       <DetailItem><strong>Calculated Initial EMI (Estimate):</strong> ₹{initialEMI.toLocaleString()}</DetailItem>
       <DetailItem><strong>Total Interest Payable (Estimate):</strong> ₹{summary.totalInterest.toLocaleString()}</DetailItem>
       <DetailItem><strong>Total Amount Payable (Estimate):</strong> ₹{summary.totalPayment.toLocaleString()}</DetailItem>

       {/* History sections removed */}
       
       {/* Render forms and tools */}
       {/* <PreEmiPaymentForm /> */} {/* Removed */}
       <AddDisbursementForm /> 
       <PrepaymentSimulator />
       <LoanSummaries schedule={amortizationSchedule} />
       <LoanChart schedule={amortizationSchedule} loan={loan} /> 
       <AmortizationTable schedule={amortizationSchedule} loan={loan} /> 
    </DetailsContainer>
  );
};

export default LoanDetailsDisplay;
