// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useCallback } from 'react'; // Add useCallback
import styled from 'styled-components';
import { Loan, AmortizationEntry, InterestRateChange, CustomEMIChange } from '../types'; // Import change types
import { calculateEMI, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
// import PreEmiPaymentForm from './PaymentForm'; // Removed import
import AddDisbursementForm from './AddDisbursementForm'; 
import PrepaymentSimulator from './PrepaymentSimulator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 
import { useAppDispatch } from '../contexts/AppContext'; // Import dispatch

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
    display: flex; // Use flex for aligning edit button
    justify-content: space-between;
    align-items: center;
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

// Simple Edit button style
const EditButton = styled.button`
  padding: 2px 5px;
  font-size: 0.8em;
  margin-left: 10px;
  cursor: pointer;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 3px;
   &:hover {
     background-color: #dee2e6;
   }
`;


interface LoanDetailsDisplayProps {
  loan: Loan;
}

const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
  const { details } = loan; 
  const dispatch = useAppDispatch();

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

  // --- Edit Handlers ---
  const handleEditROIChange = useCallback((changeToEdit: InterestRateChange) => {
    const newRateStr = window.prompt(`Edit Annual ROI (%) for ${new Date(changeToEdit.date).toLocaleDateString()}:`, String(changeToEdit.newRate));
    if (newRateStr === null) return; // User cancelled

    const newRate = parseFloat(newRateStr);
    if (isNaN(newRate) || newRate < 0) {
      alert('Invalid rate.');
      return;
    }

    const preferencePrompt = window.prompt(`New ROI is ${newRate}%. Choose effect:\n1: Reduce Tenure (Keep EMI Same)\n2: Reduce EMI (Keep Tenure Same)`, 
        changeToEdit.adjustmentPreference === 'adjustEMI' ? "2" : "1"); // Default to current pref
        
    // Ensure the type is strictly one of the two allowed for editing
    let newAdjustmentPreference: 'adjustTenure' | 'adjustEMI'; 
    if (preferencePrompt === '2') {
        newAdjustmentPreference = 'adjustEMI';
    } else { // Default to 'adjustTenure' if prompt is '1' or invalid
        newAdjustmentPreference = 'adjustTenure';
        if (preferencePrompt !== '1') {
             alert('Invalid choice. Defaulting to "Reduce Tenure".');
        }
    }
    
    const updatedLoan = {
        ...loan,
        interestRateChanges: loan.interestRateChanges.map(c =>
            c.id === changeToEdit.id
            // Update rate and the strictly typed preference. Remove newEMIIfApplicable if it existed.
            ? { ...c, newRate: newRate, adjustmentPreference: newAdjustmentPreference, newEMIIfApplicable: undefined } 
            : c
        )
    };
    dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });

  }, [dispatch, loan]);

  const handleEditCustomEMIChange = useCallback((changeToEdit: CustomEMIChange) => {
      const newEmiStr = window.prompt(`Edit Custom EMI (₹) for ${new Date(changeToEdit.date).toLocaleDateString()}:`, String(changeToEdit.newEMI));
      if (newEmiStr === null) return; // User cancelled

      const newEMI = parseFloat(newEmiStr);
      if (isNaN(newEMI) || newEMI <= 0) {
          alert('Invalid EMI amount.');
          return;
      }
      
      // Optionally edit remarks too? For now, just EMI.
      // const newRemarks = window.prompt("Edit Remarks (optional):", changeToEdit.remarks || "");

      const updatedLoan = {
          ...loan,
          customEMIChanges: loan.customEMIChanges.map(c => 
              c.id === changeToEdit.id 
              ? { ...c, newEMI: newEMI /*, remarks: newRemarks || undefined */ } 
              : c
          )
      };
      dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });

  }, [dispatch, loan]);
  // --- End Edit Handlers ---


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
        {details.disbursements.length > 0 && ( 
             <>
               <h4>Disbursements</h4>
               <ul>
                 {details.disbursements.map(d => <li key={d.id}>{new Date(d.date).toLocaleDateString()}: ₹{d.amount.toLocaleString()} {d.remarks && `(${d.remarks})`}</li>)}
               </ul>
             </>
        )}

       {/* Removed Pre-EMI Payments section */}

       {loan.paymentHistory.length > 0 && (
         <>
           <h4>Payment History (EMIs & Prepayments)</h4>
           <ul>
             {loan.paymentHistory.map(p => (
               <li key={p.id}>
                 <span>
                    {new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} ({p.type})
                    {p.principalPaid !== undefined && p.interestPaid !== undefined && ` - P: ₹${p.principalPaid.toLocaleString()}, I: ₹${p.interestPaid.toLocaleString()}`}
                    {p.remarks && ` (${p.remarks})`}
                 </span>
                 {/* Add Edit button for payments later if needed */}
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
                 <span>
                    {new Date(c.date).toLocaleDateString()}: New Rate {c.newRate}%
                    {c.adjustmentPreference && ` (Pref: ${c.adjustmentPreference})`}
                    {c.newEMIIfApplicable && ` (New EMI: ₹${c.newEMIIfApplicable.toLocaleString()})`}
                 </span>
                 <EditButton onClick={() => handleEditROIChange(c)}>Edit</EditButton>
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
                 <span>
                    {new Date(c.date).toLocaleDateString()}: New EMI ₹{c.newEMI.toLocaleString()}
                    {c.remarks && ` (${c.remarks})`}
                 </span>
                  <EditButton onClick={() => handleEditCustomEMIChange(c)}>Edit</EditButton>
               </li>
             ))}
           </ul>
         </>
       )}
       
       {/* Render forms and tools */}
       {/* <PreEmiPaymentForm /> */} {/* Removed usage */}
       <AddDisbursementForm /> 
       <PrepaymentSimulator />
       <LoanSummaries schedule={amortizationSchedule} />
       <LoanChart schedule={amortizationSchedule} loan={loan} /> 
       <AmortizationTable schedule={amortizationSchedule} loan={loan} /> 
    </DetailsContainer>
  );
};

export default LoanDetailsDisplay;
