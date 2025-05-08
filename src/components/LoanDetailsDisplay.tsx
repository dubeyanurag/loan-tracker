// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useCallback } from 'react'; 
import styled from 'styled-components';
import { Loan, AmortizationEntry } from '../types'; // Removed unused types
import { calculateEMI, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
import AddDisbursementForm from './AddDisbursementForm'; 
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 
import { useAppDispatch } from '../contexts/AppContext'; 

// Main container for the layout
const DetailsLayoutContainer = styled.div`
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  margin-top: 10px;
`;

// Container for the row holding Disbursement list and form
const DisbursementRow = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; /* Wrap form below list on small screens */
    gap: 20px; 
    margin-bottom: 20px; /* Add space below this row */
`;

// Container for the disbursement list
const DisbursementListContainer = styled.div`
  flex: 2; /* Takes up more space */
  min-width: 250px; 
`;

// Container for the Add Disbursement form
const AddDisbursementFormContainer = styled.div`
  flex: 1; /* Takes up less space */
  min-width: 250px; 
`;


const DetailItem = styled.p`
  margin: 8px 0;
  font-size: 1em;
  color: #555;
  strong {
    color: #333;
   }
 `;

 const DeleteButton = styled.button` 
  padding: 2px 5px;
  font-size: 0.8em;
  margin-left: 10px;
  cursor: pointer;
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 3px;
   &:hover {
     background-color: #f1b0b7;
   }
`;

// Styles for history lists
const HistoryList = styled.ul`
    margin-top: 5px;
    padding-left: 0; // Remove default padding
    font-size: 0.9em;
    color: #666;
    list-style: none; 

    li {
        margin-bottom: 4px;
        display: flex; 
        justify-content: space-between;
        align-items: center;
        padding: 4px 0; // Add some padding
        border-bottom: 1px dotted #eee;
        &:last-child {
            border-bottom: none;
        }
    }
`;
const HistoryHeading = styled.h4`
    margin-bottom: 5px;
    margin-top: 15px;
    color: #444;
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

   // --- Calculate Current/Effective Values (Approximations) ---
   const currentValues = useMemo(() => {
       if (amortizationSchedule.length === 0) {
           return { currentRate: details.originalInterestRate, currentEMI: initialEMI };
       }
       const lastEntry = amortizationSchedule[amortizationSchedule.length - 1];
       let effectiveRate = details.originalInterestRate;
       let effectiveEMI = initialEMI;

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
   }, [amortizationSchedule, details, initialEMI, loan.interestRateChanges, loan.customEMIChanges]);
   // --- End Calculate Current/Effective Values ---


    // --- Delete Handlers ---
    // Removed edit handlers as they are no longer used
    const createDeleteHandler = useCallback((eventType: 'Disbursement' | 'Payment' | 'ROI Change' | 'EMI Change') => (eventId: string) => {
        if (!window.confirm(`Are you sure you want to delete this ${eventType} event? This will recalculate the schedule.`)) {
            return;
        }
        let updatedLoan = { ...loan };

        try {
            if (eventType === 'Disbursement') {
                if (loan.details.disbursements.length <= 1 && loan.details.disbursements[0].id === eventId) {
                    alert("Cannot delete the initial disbursement. Delete the loan instead."); return;
                }
                updatedLoan.details = { ...loan.details, disbursements: loan.details.disbursements.filter(d => d.id !== eventId) };
            } else if (eventType === 'Payment') {
                updatedLoan.paymentHistory = loan.paymentHistory.filter(p => p.id !== eventId);
            } else if (eventType === 'ROI Change') {
                updatedLoan.interestRateChanges = loan.interestRateChanges.filter(c => c.id !== eventId);
            } else if (eventType === 'EMI Change') {
                updatedLoan.customEMIChanges = loan.customEMIChanges.filter(c => c.id !== eventId);
            } else {
                 console.error("Unknown event type to delete:", eventType); return;
            }
            dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });
        } catch (error) {
            console.error(`Error deleting ${eventType}:`, error);
            alert(`Failed to delete ${eventType}.`);
        }
    }, [dispatch, loan]);

    const handleDeleteDisbursement = createDeleteHandler('Disbursement');
    const handleDeletePayment = createDeleteHandler('Payment');
    const handleDeleteROIChange = createDeleteHandler('ROI Change');
    const handleDeleteCustomEMIChange = createDeleteHandler('EMI Change');
    // --- End Delete Handlers ---


   return (
    <DetailsLayoutContainer> {/* Ensure this is the correct container */}
       {/* Initial Summary Section (Full Width) */}
       <div> 
            <h3>{loan.name} - Summary</h3>
            <DetailItem><strong>Total Disbursed:</strong> ₹{totalDisbursed.toLocaleString()}</DetailItem> 
            <DetailItem><strong>Original Rate:</strong> {details.originalInterestRate}%</DetailItem>
            <DetailItem><strong>Current Rate (Est):</strong> {currentValues.currentRate}%</DetailItem>
            <DetailItem><strong>Original Tenure:</strong> {details.originalTenureMonths / 12} years ({details.originalTenureMonths} months)</DetailItem>
            <DetailItem><strong>Loan Start Date:</strong> {new Date(details.startDate).toLocaleDateString()}</DetailItem>
            {details.startedWithPreEMI && details.emiStartDate && 
                <DetailItem><strong>Full EMI Start Date:</strong> {new Date(details.emiStartDate).toLocaleDateString()}</DetailItem>
            }
            {details.startedWithPreEMI && !details.emiStartDate && 
                <DetailItem><em>(Loan started with Pre-EMI period)</em></DetailItem>
            }
            <hr style={{ margin: '15px 0', borderColor: '#eee' }} />
            <DetailItem><strong>Calculated Initial EMI (Est):</strong> ₹{initialEMI.toLocaleString()}</DetailItem>
            <DetailItem><strong>Current EMI (Est):</strong> ₹{currentValues.currentEMI.toLocaleString()}</DetailItem>
            <DetailItem><strong>Total Interest Payable (Initial Est):</strong> ₹{summary.totalInterest.toLocaleString()}</DetailItem>
            <DetailItem><strong>Total Amount Payable (Initial Est):</strong> ₹{summary.totalPayment.toLocaleString()}</DetailItem>
       </div>

        {/* Row for Disbursements List and Add Form */}
       <DisbursementRow>
            <DisbursementListContainer>
                {details.disbursements.length > 0 && ( 
                        <>
                        <HistoryHeading>Disbursements</HistoryHeading>
                        <HistoryList>
                            {details.disbursements.map((d, index) => (
                                <li key={d.id}>
                                    <span>{new Date(d.date).toLocaleDateString()}: ₹{d.amount.toLocaleString()} {d.remarks && `(${d.remarks})`}</span>
                                    {index > 0 && <DeleteButton onClick={() => handleDeleteDisbursement(d.id)}>&#x274C;</DeleteButton>}
                                </li>
                            ))}
                        </HistoryList>
                        </>
                )}
            </DisbursementListContainer>
            <AddDisbursementFormContainer>
                 <AddDisbursementForm /> 
            </AddDisbursementFormContainer>
       </DisbursementRow>

        {/* Other History Lists (Full Width) */}
       {loan.paymentHistory.length > 0 && (
         <div> 
           <HistoryHeading>Payment History (EMIs & Prepayments)</HistoryHeading>
           <HistoryList>
             {loan.paymentHistory.map(p => (
               <li key={p.id}>
                 <span>
                    {new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} ({p.type})
                    {p.principalPaid !== undefined && p.interestPaid !== undefined && ` - P: ₹${p.principalPaid.toLocaleString()}, I: ₹${p.interestPaid.toLocaleString()}`}
                    {p.remarks && ` (${p.remarks})`}
                 </span>
                 <DeleteButton onClick={() => handleDeletePayment(p.id)}>&#x274C;</DeleteButton>
               </li>
             ))}
           </HistoryList>
         </div>
       )}

       {loan.interestRateChanges.length > 0 && (
         <div> 
           <HistoryHeading>Interest Rate Changes</HistoryHeading>
           <HistoryList>
             {loan.interestRateChanges.map(c => (
               <li key={c.id}>
                 <span>
                    {new Date(c.date).toLocaleDateString()}: New Rate {c.newRate}%
                    {c.adjustmentPreference && ` (Pref: ${c.adjustmentPreference})`}
                    {c.newEMIIfApplicable && ` (New EMI: ₹${c.newEMIIfApplicable.toLocaleString()})`}
                 </span>
                 <DeleteButton onClick={() => handleDeleteROIChange(c.id)}>&#x274C;</DeleteButton>
               </li>
             ))}
           </HistoryList>
         </div>
       )}

       {loan.customEMIChanges.length > 0 && (
         <div> 
           <HistoryHeading>Custom EMI Changes</HistoryHeading>
           <HistoryList>
             {loan.customEMIChanges.map(c => (
               <li key={c.id}>
                 <span>
                    {new Date(c.date).toLocaleDateString()}: New EMI ₹{c.newEMI.toLocaleString()}
                    {c.remarks && ` (${c.remarks})`}
                 </span>
                  <DeleteButton onClick={() => handleDeleteCustomEMIChange(c.id)}>&#x274C;</DeleteButton>
               </li>
             ))}
           </HistoryList>
         </div>
       )}
       
       {/* Render remaining tools/summaries (Full Width) */}
       <LoanSummaries schedule={amortizationSchedule} />
       <LoanChart schedule={amortizationSchedule} loan={loan} /> 
       <AmortizationTable schedule={amortizationSchedule} loan={loan} /> 
    </DetailsLayoutContainer> 
  );
};

export default LoanDetailsDisplay;
