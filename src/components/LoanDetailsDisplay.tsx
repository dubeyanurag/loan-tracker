// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useCallback } from 'react'; 
import styled from 'styled-components';
import { Loan, AmortizationEntry, InterestRateChange, CustomEMIChange } from '../types'; 
import { calculateEMI, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule } from '../utils/amortizationCalculator'; 
// import PreEmiPaymentForm from './PaymentForm'; // Removed import
import AddDisbursementForm from './AddDisbursementForm'; 
// import PrepaymentSimulator from './PrepaymentSimulator'; // Removed import
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries';
import LoanChart from './LoanChart'; 
import { useAppDispatch } from '../contexts/AppContext'; 

// Main container for the two-column layout
const DetailsLayoutContainer = styled.div`
  display: flex;
  flex-direction: row; /* Side-by-side columns */
  flex-wrap: wrap; /* Allow wrapping on small screens */
  gap: 20px; 
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  margin-top: 10px;
`;

// Container for the main content (summaries, chart, table)
const MainContentContainer = styled.div`
  flex: 3; /* Takes up more space */
  min-width: 300px; /* Ensure minimum width */
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

// Container for the sidebar forms (Add Disbursement)
const SidebarContainer = styled.div`
  flex: 1; /* Takes up less space */
  min-width: 250px; /* Ensure minimum width */
`;


const DetailItem = styled.p`
  margin: 8px 0;
  font-size: 1em;
  color: #555;
  strong {
    color: #333;
   }
 `;

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

// Styles for history lists (if we keep them)
const HistoryList = styled.ul`
    margin-top: 5px;
    padding-left: 20px;
    font-size: 0.9em;
    color: #666;
    list-style: none; /* Remove default bullets */

    li {
        margin-bottom: 4px;
        display: flex; 
        justify-content: space-between;
        align-items: center;
        padding-bottom: 4px;
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
       // Simplified - uses last schedule entry's details
       if (amortizationSchedule.length === 0) {
           return { currentRate: details.originalInterestRate, currentEMI: initialEMI };
       }
       const lastEntry = amortizationSchedule[amortizationSchedule.length - 1];
       let effectiveRate = details.originalInterestRate;
       let effectiveEMI = initialEMI;

       // Find last rate change impacting the schedule
       const lastRoiChange = [...(loan.interestRateChanges || [])]
           .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
           .find(change => new Date(change.date) <= new Date(lastEntry.paymentDate));
       if(lastRoiChange) effectiveRate = lastRoiChange.newRate;

        // Find last EMI change impacting the schedule
       const lastEmiEvent = [...(loan.interestRateChanges || []), ...(loan.customEMIChanges || [])]
           .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
           .find(change => new Date(change.date) <= new Date(lastEntry.paymentDate));
        if(lastEmiEvent) {
             if ('newRate' in lastEmiEvent && lastEmiEvent.adjustmentPreference === 'adjustEMI') {
                 // Use last calculated EMI from schedule as best estimate
                 effectiveEMI = lastEntry.emi; 
             } else if ('newEMI' in lastEmiEvent) {
                 effectiveEMI = lastEmiEvent.newEMI;
             } else if ('newRate' in lastEmiEvent && lastEmiEvent.adjustmentPreference === 'customEMI' && lastEmiEvent.newEMIIfApplicable) {
                  effectiveEMI = lastEmiEvent.newEMIIfApplicable;
             } else {
                 // If last event was ROI change with adjustTenure, use last schedule EMI
                 effectiveEMI = lastEntry.emi;
             }
        } else {
             effectiveEMI = lastEntry.emi; // Default to last actual EMI paid
        }

       return {
           currentRate: effectiveRate,
           currentEMI: effectiveEMI,
       };
   }, [amortizationSchedule, details, initialEMI, loan.interestRateChanges, loan.customEMIChanges]);
   // --- End Calculate Current/Effective Values ---


    // --- Edit Handlers ---
    const handleEditROIChange = useCallback((changeToEdit: InterestRateChange) => {
        const newRateStr = window.prompt(`Edit Annual ROI (%) for ${new Date(changeToEdit.date).toLocaleDateString()}:`, String(changeToEdit.newRate));
        if (newRateStr === null) return; 
        const newRate = parseFloat(newRateStr);
        if (isNaN(newRate) || newRate < 0) { alert('Invalid rate.'); return; }

        const preferencePrompt = window.prompt(`New ROI is ${newRate}%. Choose effect:\n1: Reduce Tenure (Keep EMI Same)\n2: Reduce EMI (Keep Tenure Same)`, changeToEdit.adjustmentPreference === 'adjustEMI' ? "2" : "1");
        let newAdjustmentPreference: 'adjustTenure' | 'adjustEMI' = 'adjustTenure'; 
        if (preferencePrompt === '2') { newAdjustmentPreference = 'adjustEMI'; } 
        else if (preferencePrompt !== '1') { alert('Invalid choice. Defaulting to "Reduce Tenure".'); }
        
        const updatedLoan = { ...loan, interestRateChanges: loan.interestRateChanges.map(c => c.id === changeToEdit.id ? { ...c, newRate: newRate, adjustmentPreference: newAdjustmentPreference, newEMIIfApplicable: undefined } : c ) };
        dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });
    }, [dispatch, loan]);

    const handleEditCustomEMIChange = useCallback((changeToEdit: CustomEMIChange) => {
        const newEmiStr = window.prompt(`Edit Custom EMI (₹) for ${new Date(changeToEdit.date).toLocaleDateString()}:`, String(changeToEdit.newEMI));
        if (newEmiStr === null) return; 
        const newEMI = parseFloat(newEmiStr);
        if (isNaN(newEMI) || newEMI <= 0) { alert('Invalid EMI amount.'); return; }
        
        const updatedLoan = { ...loan, customEMIChanges: loan.customEMIChanges.map(c => c.id === changeToEdit.id ? { ...c, newEMI: newEMI } : c ) };
        dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });
    }, [dispatch, loan]);
    // --- End Edit Handlers ---


   return (
    // Use the new layout container
    <DetailsLayoutContainer> 
        <MainContentContainer>
            <h3>{loan.name} - Summary</h3>
            <DetailItem><strong>Total Disbursed:</strong> ₹{totalDisbursed.toLocaleString()}</DetailItem> 
            <DetailItem><strong>Original Rate:</strong> {details.originalInterestRate}%</DetailItem>
            <DetailItem><strong>Current Rate:</strong> {currentValues.currentRate}%</DetailItem>
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
            <DetailItem><strong>Current EMI (Estimate):</strong> ₹{currentValues.currentEMI.toLocaleString()}</DetailItem>
            <DetailItem><strong>Total Interest Payable (Initial Estimate):</strong> ₹{summary.totalInterest.toLocaleString()}</DetailItem>
            <DetailItem><strong>Total Amount Payable (Initial Estimate):</strong> ₹{summary.totalPayment.toLocaleString()}</DetailItem>

            {/* History sections with Edit buttons */}
            {details.disbursements.length > 0 && ( 
                    <>
                    <HistoryHeading>Disbursements</HistoryHeading>
                    <HistoryList>
                        {details.disbursements.map(d => <li key={d.id}>{new Date(d.date).toLocaleDateString()}: ₹{d.amount.toLocaleString()} {d.remarks && `(${d.remarks})`}</li>)}
                    </HistoryList>
                    </>
            )}

            {loan.paymentHistory.length > 0 && (
                <>
                <HistoryHeading>Payment History (EMIs & Prepayments)</HistoryHeading>
                <HistoryList>
                    {loan.paymentHistory.map(p => (
                    <li key={p.id}>
                        <span>
                            {new Date(p.date).toLocaleDateString()}: ₹{p.amount.toLocaleString()} ({p.type})
                            {p.principalPaid !== undefined && p.interestPaid !== undefined && ` - P: ₹${p.principalPaid.toLocaleString()}, I: ₹${p.interestPaid.toLocaleString()}`}
                            {p.remarks && ` (${p.remarks})`}
                        </span>
                    </li>
                    ))}
                </HistoryList>
                </>
            )}

            {loan.interestRateChanges.length > 0 && (
                <>
                <HistoryHeading>Interest Rate Changes</HistoryHeading>
                <HistoryList>
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
                </HistoryList>
                </>
            )}

            {loan.customEMIChanges.length > 0 && (
                <>
                <HistoryHeading>Custom EMI Changes</HistoryHeading>
                <HistoryList>
                    {loan.customEMIChanges.map(c => (
                    <li key={c.id}>
                        <span>
                            {new Date(c.date).toLocaleDateString()}: New EMI ₹{c.newEMI.toLocaleString()}
                            {c.remarks && ` (${c.remarks})`}
                        </span>
                        <EditButton onClick={() => handleEditCustomEMIChange(c)}>Edit</EditButton>
                    </li>
                    ))}
                </HistoryList>
                </>
            )}
            
            {/* Tools moved to main content */}
            <LoanSummaries schedule={amortizationSchedule} />
            <LoanChart schedule={amortizationSchedule} loan={loan} /> 
            <AmortizationTable schedule={amortizationSchedule} loan={loan} /> 

        </MainContentContainer>

        <SidebarContainer>
             {/* Render forms in sidebar */}
             <AddDisbursementForm /> 
             {/* <PreEmiPaymentForm /> */} {/* Removed */}
             {/* <PrepaymentSimulator /> */} {/* Removed */}
        </SidebarContainer>
    </DetailsLayoutContainer>
  );
};

export default LoanDetailsDisplay;
