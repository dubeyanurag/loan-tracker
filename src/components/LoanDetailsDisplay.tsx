// src/components/LoanDetailsDisplay.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Loan, AmortizationEntry } from '../types';
import { calculateEMI, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
import PreEmiPaymentForm from './PaymentForm'; 
import AddDisbursementForm from './AddDisbursementForm'; // Import the new form
import PrepaymentSimulator from './PrepaymentSimulator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 

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
  h4 {
    margin-bottom: 5px;
    margin-top: 15px;
    color: #444;
  }
  ul {
    margin-top: 5px;
    padding-left: 20px;
    font-size: 0.9em;
    color: #666;
  }
  li {
    margin-bottom: 4px;
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

interface LoanDetailsDisplayProps {
  loan: Loan;
}

const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
  const { details } = loan; 

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

       {/* Conditionally render history sections */}
        {details.disbursements.length > 0 && ( // Always show disbursements if they exist
             <>
               <h4>Disbursements</h4>
               <ul>
                 {details.disbursements.map(d => <li key={d.id}>{new Date(d.date).toLocaleDateString()}: ₹{d.amount.toLocaleString()} {d.remarks && `(${d.remarks})`}</li>)}
               </ul>
             </>
        )}

       {loan.preEMIInterestPayments.length > 0 && (
         <>
           <h4>Pre-EMI Payments</h4>
           <ul>
             {loan.preEMIInterestPayments.map(p => <li key={p.id}>{new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} {p.remarks && `(${p.remarks})`}</li>)}
           </ul>
         </>
       )}

       {loan.paymentHistory.length > 0 && (
         <>
           <h4>Payment History (EMIs & Prepayments)</h4>
           <ul>
             {loan.paymentHistory.map(p => (
               <li key={p.id}>
                 {new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} ({p.type})
                 {p.principalPaid !== undefined && p.interestPaid !== undefined && ` - P: ₹${p.principalPaid.toLocaleString()}, I: ₹${p.interestPaid.toLocaleString()}`}
                 {p.remarks && ` (${p.remarks})`}
               </li>
             ))}
           </ul>
         </>
       )}

       {loan.interestRateChanges.length > 0 && (
         <>
           <h4>Interest Rate Changes</h4>
           <ul>
             {loan.interestRateChanges.map(c => (
               <li key={c.id}>
                 {new Date(c.date).toLocaleDateString()}: New Rate {c.newRate}%
                 {c.adjustmentPreference && ` (Pref: ${c.adjustmentPreference})`}
                 {c.newEMIIfApplicable && ` (New EMI: ₹${c.newEMIIfApplicable.toLocaleString()})`}
               </li>
             ))}
           </ul>
         </>
       )}

       {loan.customEMIChanges.length > 0 && (
         <>
           <h4>Custom EMI Changes</h4>
           <ul>
             {loan.customEMIChanges.map(c => (
               <li key={c.id}>
                 {new Date(c.date).toLocaleDateString()}: New EMI ₹{c.newEMI.toLocaleString()}
                 {c.remarks && ` (${c.remarks})`}
               </li>
             ))}
           </ul>
         </>
       )}
       
       {/* Render forms and tools */}
       <PreEmiPaymentForm /> 
       <AddDisbursementForm /> {/* Add the new form */}
       <PrepaymentSimulator />
       <LoanSummaries schedule={amortizationSchedule} />
       <LoanChart schedule={amortizationSchedule} loan={loan} /> 
       <AmortizationTable schedule={amortizationSchedule} loan={loan} /> 
    </DetailsContainer>
  );
};

export default LoanDetailsDisplay;
