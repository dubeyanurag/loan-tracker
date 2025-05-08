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

  td:nth-child(1), td:nth-child(2) { /* Month, Date */
    text-align: left;
  }
  
  /* Row highlighting styles */
  tr.highlight-prepayment { background-color: #e6ffed; }
  tr.highlight-roi { background-color: #fff3cd; }
  tr.highlight-emi { background-color: #f3e7ff; }
  tr.highlight-disbursement { background-color: #d1ecf1; }
  tr.highlight-current-month td { 
      border-top: 2px solid red; 
      border-bottom: 2px solid red;
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

// Delete button style removed as it's no longer used here

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  loan: Loan; // Still needed for context if actions remain complex, but not for delete logic now
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, loan }) => {
  const dispatch = useAppDispatch();

  // --- Action Handlers (kept for adding events) ---
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
      if (!isNaN(newRate) && newRate >= 0) { 
        const preferencePrompt = window.prompt(`New ROI is ${newRate}%. Choose effect:\n1: Reduce Tenure (Keep EMI Same)\n2: Reduce EMI (Keep Tenure Same)`, "1");
        let adjustmentPreference: 'adjustTenure' | 'adjustEMI' = 'adjustTenure'; 
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
              id: '', 
              date: entry.paymentDate,
              newRate: newRate,
              adjustmentPreference: adjustmentPreference, 
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
               id: '', 
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
  // --- End Action Handlers ---

  // Delete Handler removed

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
            {/* <th>Event / Delete</th> */} {/* Removed Column */}
            <th>Actions</th> 
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry) => {
            const entryDate = new Date(entry.paymentDate); 
            
            // Determine highlight class based on indicators
            let highlightClass = '';
            if (entry.disbursements) highlightClass = 'highlight-disbursement';
            if (entry.prepayments) highlightClass = 'highlight-prepayment'; // Overrides disbursement if both happen
            if (entry.roiChanges) highlightClass = 'highlight-roi'; // Overrides others
            if (entry.emiChanges) highlightClass = 'highlight-emi'; // Overrides others

            // Check if this row is the current month
            const isCurrentMonth = entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
            const rowClass = `${highlightClass} ${isCurrentMonth ? 'highlight-current-month' : ''}`.trim();

            return (
              <tr key={entry.monthNumber} className={rowClass || undefined}> {/* Apply highlight classes */}
                <td>{entry.monthNumber}</td>
                <td>{entryDate.toLocaleDateString()}</td>
                <td>{entry.openingBalance.toLocaleString()}</td>
                <td>{entry.emi.toLocaleString()}</td>
                <td>{entry.principalPaid.toLocaleString()}</td>
                <td>{entry.interestPaid.toLocaleString()}</td>
                <td>{entry.closingBalance.toLocaleString()}</td>
                {/* Event/Delete Cell Removed */}
                <td> {/* Actions Cell */}
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
