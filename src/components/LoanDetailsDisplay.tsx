// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useCallback, useState } from 'react'; 
import styled from 'styled-components';
import { Loan, AmortizationEntry } from '../types'; 
import { calculateTotalDisbursed } from '../utils/loanCalculations';
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
import AddDisbursementForm from './AddDisbursementForm'; 
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 
import { useAppDispatch } from '../contexts/AppContext'; 
import EditLoanDetailsForm from './EditLoanDetailsForm'; 

// Main container for the layout
const DetailsLayoutContainer = styled.div`
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  margin-top: 10px;
  position: relative; // Needed for modal overlay
`;

// Container for the row holding Disbursement list and form
const DisbursementRow = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap; 
    gap: 20px; 
    margin-bottom: 20px; 
`;

// Container for the disbursement list
const DisbursementListContainer = styled.div`
  flex: 2; 
  min-width: 250px; 
`;

// Container for the Add Disbursement form
const AddDisbursementFormContainer = styled.div`
  flex: 1; 
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
    padding-left: 0; 
    font-size: 0.9em;
    color: #666;
    list-style: none; 

    li {
        margin-bottom: 4px;
        display: flex; 
        justify-content: space-between;
        align-items: center;
        padding: 4px 0; 
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

// Simple Modal Overlay Style
const ModalOverlay = styled.div`
    position: fixed; 
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
`;

// Button to trigger edit modal
const EditDetailsButton = styled(DeleteButton)` 
    background-color: #ffc107;
    color: #333;
    border-color: #ffc107;
     &:hover {
        background-color: #e0a800;
     }
`;


 interface LoanDetailsDisplayProps {
  loan: Loan;
}

 const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
   // Defensive check for loan and loan.details
   if (!loan || !loan.details) {
     return <p style={{ textAlign: 'center', color: '#777', marginTop: '30px' }}>Loan data is not available or incomplete.</p>;
   }
   const { details } = loan; 
   const dispatch = useAppDispatch(); 
   const [isEditing, setIsEditing] = useState(false); 

   const totalDisbursed = useMemo(() => calculateTotalDisbursed(details.disbursements), [details.disbursements]);

  const amortizationSchedule: AmortizationEntry[] = useMemo(() => {
     return generateAmortizationSchedule(loan);
   }, [loan]); 

   const currentValues = useMemo(() => {
       let effectiveRate = details.originalInterestRate;
       let effectiveEMI: number | string = 'N/A'; 

       if (amortizationSchedule.length > 0) {
           const lastEntry = amortizationSchedule[amortizationSchedule.length - 1];
           
           const lastRoiChange = [...(loan.interestRateChanges || [])]
               .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
               .find(change => new Date(change.date) <= new Date(lastEntry.paymentDate));
           if(lastRoiChange) effectiveRate = lastRoiChange.newRate;

           const now = new Date();
           const currentYear = now.getFullYear();
           const currentMonth = now.getMonth();
           const currentMonthEntry = amortizationSchedule.find((entry: AmortizationEntry) => { 
               const entryDate = new Date(entry.paymentDate);
               return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
           });

           if (currentMonthEntry && currentMonthEntry.openingBalance > 0) {
               effectiveEMI = currentMonthEntry.emi;
           } else if (lastEntry.closingBalance <= 0.01) {
               effectiveEMI = 0; 
           }
       }
       
       return {
           currentRate: effectiveRate,
           currentEMI: effectiveEMI,
       };
   }, [amortizationSchedule, details, loan.interestRateChanges, loan.customEMIChanges]); 
   
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
    
   return (
    <DetailsLayoutContainer> 
       <div> 
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <h3>Loan Summary</h3> 
                <EditDetailsButton onClick={() => setIsEditing(true)}>Edit Details</EditDetailsButton>
            </div>
            <DetailItem><strong>Total Disbursed:</strong> ₹{totalDisbursed.toLocaleString()}</DetailItem> 
            <DetailItem><strong>Original Rate:</strong> {details.originalInterestRate}%</DetailItem>
            <DetailItem><strong>Original Tenure:</strong> {(details.originalTenureMonths / 12).toFixed(1)} years ({details.originalTenureMonths} months)</DetailItem> 
            <DetailItem><strong>Loan Start Date:</strong> {new Date(details.startDate).toLocaleDateString()}</DetailItem>
            {details.startedWithPreEMI && details.emiStartDate && 
                <DetailItem><strong>Full EMI Start Date:</strong> {new Date(details.emiStartDate).toLocaleDateString()}</DetailItem>
            }
            {details.startedWithPreEMI && !details.emiStartDate && 
                <DetailItem><em>(Loan started with Pre-EMI period)</em></DetailItem>
            }
             {details.isTaxDeductible !== undefined && (
                 <DetailItem><strong>Tax Deductible:</strong> {details.isTaxDeductible ? 'Yes' : 'No'} 
                    {details.isTaxDeductible && ` (P Limit: ₹${(details.principalDeductionLimit ?? 150000).toLocaleString()}, I Limit: ₹${(details.interestDeductionLimit ?? 200000).toLocaleString()})`}
                 </DetailItem>
             )}
            <hr style={{ margin: '15px 0', borderColor: '#eee' }} /> 
            <DetailItem><strong>Current Rate (Est):</strong> {currentValues.currentRate}%</DetailItem>
            <DetailItem><strong>Current EMI (Est):</strong> {typeof currentValues.currentEMI === 'number' ? `₹${currentValues.currentEMI.toLocaleString()}` : currentValues.currentEMI}</DetailItem>
       </div>

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
       
       <LoanSummaries schedule={amortizationSchedule} loanDetails={details} /> 
       <LoanChart schedule={amortizationSchedule} loan={loan} /> 
       <AmortizationTable 
            schedule={amortizationSchedule} 
            loan={loan} 
            onDeleteDisbursement={handleDeleteDisbursement}
            onDeletePayment={handleDeletePayment}
            onDeleteROIChange={handleDeleteROIChange}
            onDeleteCustomEMIChange={handleDeleteCustomEMIChange}
       /> 

        {isEditing && (
            <ModalOverlay onClick={() => setIsEditing(false)}> 
                 <ModalContent onClick={e => e.stopPropagation()}> 
                     <EditLoanDetailsForm loan={loan} onClose={() => setIsEditing(false)} />
                 </ModalContent>
            </ModalOverlay>
        )}
    </DetailsLayoutContainer> 
  );
};

export default LoanDetailsDisplay;
