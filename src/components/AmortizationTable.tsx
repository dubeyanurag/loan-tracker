// src/components/AmortizationTable.tsx
import React from 'react'; 
import styled from 'styled-components';
import { AmortizationEntry, Loan } from '../types'; 
import { useAppDispatch } from '../contexts/AppContext'; 

const TableContainer = styled.div`
  margin-top: 20px;
  max-height: 500px; /* Or any desired height */
  overflow-y: auto;
  border: 1px solid #ddd;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: right;
  }

  th {
    background-color: #f2f2f2;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td:nth-child(1), td:nth-child(2), td:nth-child(8) { /* Month, Date, Event */
    text-align: left;
  }
  td:nth-child(8) { /* Event column */
      font-size: 0.85em;
      font-style: italic;
      color: #555;
      min-width: 150px;
      & > div { /* Style for multiple events in one cell */
          margin-bottom: 3px;
          padding-bottom: 3px;
          border-bottom: 1px dotted #eee; 
          &:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
              border-bottom: none;
          }
      }
  }

  /* Row highlighting styles */
  tr.highlight-prepayment { background-color: #e6ffed; }
  tr.highlight-roi { background-color: #fff3cd; }
  tr.highlight-emi { background-color: #f3e7ff; }
  tr.highlight-disbursement { background-color: #d1ecf1; }
  tr.highlight-current-month td { 
      border-top: 2px solid red; 
      border-bottom: 2px solid red;
      /* Optional: Thicker left/right border too */
      /* border-left: 2px solid red; */
      /* border-right: 2px solid red; */
   } 

`;

// Style for action buttons
const ActionButton = styled.button`
  padding: 3px 6px;
  font-size: 0.8em;
  margin-right: 4px;
  cursor: pointer;
  border-radius: 3px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;

  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

// Style for delete button
const DeleteEventButton = styled(ActionButton)`
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
  margin-left: 5px; /* Add some space */

  &:hover:not(:disabled) {
    background-color: #f1b0b7;
  }
`;


interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  loan: Loan; // Pass the full loan object to check for adjustments
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, loan }) => {
  const dispatch = useAppDispatch();

  // Removed latestAdjustmentDate calculation as disabling logic is removed

  const handleAddPrepayment = (entry: AmortizationEntry) => {
    const amountStr = window.prompt(`Enter prepayment amount for ${new Date(entry.paymentDate).toLocaleDateString()}:`);
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        dispatch({
          type: 'ADD_PAYMENT',
          payload: {
            loanId: loan.id,
            payment: {
              id: '', // Will be set by reducer
              date: entry.paymentDate,
              amount: amount,
              type: 'Prepayment',
              principalPaid: amount, // Simplified
              interestPaid: 0, // Simplified
              balanceAfterPayment: 0, // Needs calculation
              remarks: 'In-table Prepayment',
            }
          }
        });
        alert('Prepayment logged. Schedule will recalculate.');
      } else {
        alert('Invalid amount.');
      }
     }
  };

  const handleSetROI = (entry: AmortizationEntry) => {
    const rateStr = window.prompt(`Enter new Annual ROI (%) effective ${new Date(entry.paymentDate).toLocaleDateString()}:`);
    if (rateStr) {
      const newRate = parseFloat(rateStr);
      if (!isNaN(newRate) && newRate >= 0) { // Allow 0% ROI
        const preferencePrompt = window.prompt(`New ROI is ${newRate}%. Choose effect:\n1: Reduce Tenure (Keep EMI Same)\n2: Reduce EMI (Keep Tenure Same)`, "1");
        let adjustmentPreference: 'adjustTenure' | 'adjustEMI' = 'adjustTenure'; // Default
        if (preferencePrompt === '2') {
            adjustmentPreference = 'adjustEMI';
        } else if (preferencePrompt !== '1') {
            alert('Invalid choice. Defaulting to "Reduce Tenure".');
        }

        dispatch({
          type: 'ADD_INTEREST_RATE_CHANGE',
          payload: {
            loanId: loan.id,
            change: {
              id: '', // Will be set by reducer
              date: entry.paymentDate,
              newRate: newRate,
              adjustmentPreference: adjustmentPreference, // Use user's choice
            }
          }
         });
         alert('ROI change logged. Schedule will recalculate.');
      } else {
         alert('Invalid rate.');
      }
     }
  };

  const handleSetEMI = (entry: AmortizationEntry) => {
     const emiStr = window.prompt(`Enter new Custom EMI effective ${new Date(entry.paymentDate).toLocaleDateString()}:`);
     if (emiStr) {
       const newEMI = parseFloat(emiStr);
       if (!isNaN(newEMI) && newEMI > 0) {
         dispatch({
           type: 'ADD_CUSTOM_EMI_CHANGE',
           payload: {
             loanId: loan.id,
             change: {
               id: '', // Will be set by reducer
               date: entry.paymentDate,
               newEMI: newEMI,
             }
           }
         });
         alert('Custom EMI change logged. Schedule will recalculate.');
       } else {
         alert('Invalid EMI amount.');
       }
     }
  };

  // --- Delete Handler ---
  const handleDeleteEvent = (eventId: string | undefined, eventType: string) => {
      if (!eventId) return; 

      if (!window.confirm(`Are you sure you want to delete this ${eventType} event? This will recalculate the schedule.`)) {
          return;
      }

      let updatedLoan = { ...loan };

      if (eventType === 'Prepayment') {
          updatedLoan.paymentHistory = loan.paymentHistory.filter(p => !(p.type === 'Prepayment' && p.id === eventId));
      } else if (eventType === 'ROI Change') {
          updatedLoan.interestRateChanges = loan.interestRateChanges.filter(c => c.id !== eventId);
      } else if (eventType === 'EMI Change') {
          updatedLoan.customEMIChanges = loan.customEMIChanges.filter(c => c.id !== eventId);
      } else if (eventType === 'Disbursement') {
           if (loan.details.disbursements.length <= 1 && loan.details.disbursements[0].id === eventId) {
               alert("Cannot delete the initial disbursement. Delete the loan instead.");
               return;
           }
          updatedLoan.details = {
              ...loan.details,
              disbursements: loan.details.disbursements.filter(d => d.id !== eventId)
          };
      } else {
          console.error("Unknown event type to delete:", eventType);
          return;
      }

      dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });
  };
  // --- End Delete Handler ---


  if (!schedule || schedule.length === 0) {
    return <p>Amortization schedule not available or loan fully paid.</p>;
  }

  // Get current month/year for highlighting
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (
    <TableContainer>
      <h4>Full Amortization Schedule</h4>
      <StyledTable>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Opening Balance</th>
            <th>EMI Paid</th>
            <th>Principal</th>
            <th>Interest</th>
            <th>Closing Balance</th>
            <th>Event / Delete</th> 
            <th>Actions</th> 
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry) => {
            const entryDate = new Date(entry.paymentDate); 
            
            // Determine highlight class and collect event details
            let eventHighlightClass = '';
            const eventsThisMonth: React.ReactNode[] = [];

            entry.disbursements?.forEach(e => {
                eventHighlightClass = 'highlight-disbursement'; 
                eventsThisMonth.push(
                    <div key={`disburse-${e.id}`}>
                        Disburse: {e.amount.toLocaleString()}
                        <DeleteEventButton onClick={() => handleDeleteEvent(e.id, 'Disbursement')} title="Delete this Disbursement event">
                           &#x274C;
                        </DeleteEventButton>
                    </div>
                );
            });
            entry.prepayments?.forEach(e => {
                eventHighlightClass = 'highlight-prepayment'; 
                eventsThisMonth.push(
                    <div key={`prepay-${e.id}`}>
                        Prepay: {e.amount.toLocaleString()}
                        <DeleteEventButton onClick={() => handleDeleteEvent(e.id, 'Prepayment')} title="Delete this Prepayment event">
                           &#x274C;
                        </DeleteEventButton>
                    </div>
                );
            });
             entry.roiChanges?.forEach(e => {
                eventHighlightClass = 'highlight-roi'; 
                eventsThisMonth.push(
                    <div key={`roi-${e.id}`}>
                        ROI: {e.newRate}% ({e.preference || 'N/A'})
                        <DeleteEventButton onClick={() => handleDeleteEvent(e.id, 'ROI Change')} title="Delete this ROI Change event">
                           &#x274C;
                        </DeleteEventButton>
                    </div>
                );
            });
             entry.emiChanges?.forEach(e => {
                eventHighlightClass = 'highlight-emi'; 
                eventsThisMonth.push(
                    <div key={`emi-${e.id}`}>
                        EMI: {e.newEMI.toLocaleString()}
                        <DeleteEventButton onClick={() => handleDeleteEvent(e.id, 'EMI Change')} title="Delete this EMI Change event">
                           &#x274C;
                        </DeleteEventButton>
                    </div>
                );
            });

            // Check if this row is the current month
            const isCurrentMonth = entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
            const rowClass = `${eventHighlightClass} ${isCurrentMonth ? 'highlight-current-month' : ''}`.trim();


            return (
              <tr key={entry.monthNumber} className={rowClass || undefined}> {/* Apply highlight classes */}
                <td>{entry.monthNumber}</td>
                <td>{entryDate.toLocaleDateString()}</td>
                <td>{entry.openingBalance.toLocaleString()}</td>
                <td>{entry.emi.toLocaleString()}</td>
                <td>{entry.principalPaid.toLocaleString()}</td>
                <td>{entry.interestPaid.toLocaleString()}</td>
                <td>{entry.closingBalance.toLocaleString()}</td>
                <td> {/* Event/Delete Cell */}
                    {eventsThisMonth.length > 0 ? eventsThisMonth : null}
                </td> 
                <td> {/* Actions Cell */}
                  {/* Buttons are now always enabled */}
                  <ActionButton onClick={() => handleAddPrepayment(entry)} title="Add Prepayment">Prepay</ActionButton>
                  <ActionButton onClick={() => handleSetROI(entry)} title="Set New ROI">Set ROI</ActionButton>
                  <ActionButton onClick={() => handleSetEMI(entry)} title="Set Custom EMI">Set EMI</ActionButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
};

export default AmortizationTable;
