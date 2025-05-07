// src/components/LoanDetailsDisplay.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Loan, AmortizationEntry } from '../types';
import { calculateEMI, calculateTotalInterestAndPayment } from '../utils/loanCalculations';
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; // Import schedule generator
import PreEmiPaymentForm from './PaymentForm'; // Updated import name
// import DynamicAdjustmentsForm from './DynamicAdjustmentsForm'; // Remove import
import PrepaymentSimulator from './PrepaymentSimulator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; // Import LoanChart

const DetailsContainer = styled.div`
  display: flex; /* Add flex display */
  flex-direction: column; /* Stack children vertically */
  gap: 20px; /* Add some gap between child components */
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
  const { details } = loan; // details is LoanDetails, loan is the full Loan object

  // Calculate EMI and other summary figures
  // For now, this uses original loan details. Later, it will need to consider
  // interest rate changes, prepayments, etc., to show current effective EMI.
  const initialEMI = useMemo(() => {
    return calculateEMI(
      details.principal,
      details.originalInterestRate,
      details.originalTenureMonths
    );
  }, [details]);

  const summary = useMemo(() => {
    if (initialEMI > 0) {
      return calculateTotalInterestAndPayment(
        details.principal,
        initialEMI,
        details.originalTenureMonths
      );
    }
    return { totalInterest: 0, totalPayment: 0 };
  }, [details, initialEMI]);

  const amortizationSchedule: AmortizationEntry[] = useMemo(() => {
    return generateAmortizationSchedule(loan);
  }, [loan]); // Regenerate if the full loan object changes

  return (
    <DetailsContainer>
       <h3>{loan.name} - Summary</h3>
       <DetailItem><strong>Principal:</strong> ₹{details.principal.toLocaleString()}</DetailItem>
       <DetailItem><strong>Annual Interest Rate:</strong> {details.originalInterestRate}%</DetailItem>
       <DetailItem><strong>Tenure:</strong> {details.originalTenureMonths / 12} years ({details.originalTenureMonths} months)</DetailItem>
       <DetailItem><strong>Start Date:</strong> {new Date(details.startDate).toLocaleDateString()}</DetailItem>
       
       <hr style={{ margin: '15px 0', borderColor: '#eee' }} />

       <DetailItem><strong>Calculated Initial EMI:</strong> ₹{initialEMI.toLocaleString()}</DetailItem>
       <DetailItem><strong>Total Interest Payable (Initial):</strong> ₹{summary.totalInterest.toLocaleString()}</DetailItem>
       <DetailItem><strong>Total Amount Payable (Initial):</strong> ₹{summary.totalPayment.toLocaleString()}</DetailItem>

       <h4>Payment History</h4>
      {loan.paymentHistory.length > 0 ? (
        <ul>
          {loan.paymentHistory.map(p => <li key={p.id}>{p.date}: ₹{p.amount} ({p.type})</li>)}
        </ul>
      ) : <p>No payments recorded yet.</p>}

      <h4>Interest Rate Changes</h4>
      ...

      <h4>Pre-EMI Payments</h4>
      {loan.preEMIInterestPayments.length > 0 ? (
        <ul>
          {loan.preEMIInterestPayments.map(p => <li key={p.id}>{new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} {p.remarks && `(${p.remarks})`}</li>)}
        </ul>
      ) : <p>No Pre-EMI interest payments recorded.</p>}

      <h4>Payment History (EMIs & Prepayments)</h4>
      {loan.paymentHistory.length > 0 ? (
        <ul>
          {loan.paymentHistory.map(p => (
            <li key={p.id}>
              {new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} ({p.type})
              - P: ₹{p.principalPaid.toLocaleString()}, I: ₹{p.interestPaid.toLocaleString()}
              {p.remarks && ` (${p.remarks})`}
            </li>
          ))}
        </ul>
      ) : <p>No EMI or Prepayment transactions recorded yet.</p>}

      <h4>Interest Rate Changes</h4>
      {loan.interestRateChanges.length > 0 ? (
        <ul>
          {loan.interestRateChanges.map(c => (
            <li key={c.id}>
              {new Date(c.date).toLocaleDateString()}: New Rate {c.newRate}%
              {c.adjustmentPreference && ` (Pref: ${c.adjustmentPreference})`}
              {c.newEMIIfApplicable && ` (New EMI: ₹${c.newEMIIfApplicable.toLocaleString()})`}
            </li>
          ))}
        </ul>
      ) : <p>No interest rate changes recorded.</p>}

      <h4>Custom EMI Changes</h4>
      {loan.customEMIChanges.length > 0 ? (
        <ul>
          {loan.customEMIChanges.map(c => (
            <li key={c.id}>
              {new Date(c.date).toLocaleDateString()}: New EMI ₹{c.newEMI.toLocaleString()}
              {c.remarks && ` (${c.remarks})`}
            </li>
          ))}
        </ul>
       ) : <p>No custom EMI changes recorded.</p>}
       
       <PreEmiPaymentForm /> {/* Updated component usage */}
       {/* <DynamicAdjustmentsForm /> */} {/* Remove usage */}
       <PrepaymentSimulator />
      <LoanSummaries schedule={amortizationSchedule} />
      <LoanChart schedule={amortizationSchedule} /> {/* Add the chart component */}
      <AmortizationTable schedule={amortizationSchedule} loan={loan} /> {/* Pass loan prop */}
    </DetailsContainer>
  );
};

export default LoanDetailsDisplay;
