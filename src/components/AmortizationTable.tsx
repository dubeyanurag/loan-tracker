// src/components/AmortizationTable.tsx
import React, { useEffect, useRef } from 'react'; // Import useEffect, useRef
import styled from 'styled-components';
import { AmortizationEntry, Loan } from '../types'; 
import { useAppDispatch } from '../contexts/AppContext'; 

const TableContainer = styled.div`
  margin-top: 20px;
  max-height: 500px; 
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

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  loan: Loan; 
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, loan }) => {
  const dispatch = useAppDispatch();
  const currentRowRef = useRef<HTMLTableRowElement | null>(null); 
  const tableContainerRef = useRef<HTMLDivElement | null>(null); 
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null); // Declare tableBodyRef

  // Get current month/year for highlighting and scrolling
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Effect to scroll to current month row
  useEffect(() => {
    if (currentRowRef.current && tableContainerRef.current) {
        // Calculate offset to center the row if possible
        const containerHeight = tableContainerRef.current.clientHeight;
        const rowTop = currentRowRef.current.offsetTop;
        const rowHeight = currentRowRef.current.clientHeight;
        const scrollTo = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        tableContainerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [schedule]); // Run when schedule changes (might need refinement if schedule updates frequently without month change)


  // --- Action Handlers ---
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
              id: '', 
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

  if (!schedule || schedule.length === 0) {
    return <p>Amortization schedule not available or loan fully paid.</p>;
  }

  return (
    <div style={{marginTop: '20px'}}> {/* Wrap heading and table */}
      <h4>Full Amortization Schedule</h4>
      <TableContainer ref={tableContainerRef}> {/* Add ref to scrollable container */}
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
        <tbody ref={tableBodyRef}> {/* Optional: ref on tbody */}
          {schedule.map((entry) => {
            const entryDate = new Date(entry.paymentDate); 
            
            let highlightClass = '';
            if (entry.disbursements) highlightClass = 'highlight-disbursement';
            if (entry.prepayments) highlightClass = 'highlight-prepayment'; 
            if (entry.roiChanges) highlightClass = 'highlight-roi'; 
            if (entry.emiChanges) highlightClass = 'highlight-emi'; 

            const isCurrentMonth = entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
            const rowClass = `${highlightClass} ${isCurrentMonth ? 'highlight-current-month' : ''}`.trim();

            return (
              // Add ref conditionally to the current month row
              <tr 
                key={entry.monthNumber} 
                className={rowClass || undefined} 
                ref={isCurrentMonth ? currentRowRef : null} 
              > 
                <td>{entry.monthNumber}</td>
                <td>{entryDate.toLocaleDateString()}</td>
                <td>{entry.openingBalance.toLocaleString()}</td>
                <td>{entry.emi.toLocaleString()}</td>
                <td>{entry.principalPaid.toLocaleString()}</td>
                <td>{entry.interestPaid.toLocaleString()}</td>
                <td>{entry.closingBalance.toLocaleString()}</td>
                {/* Event/Delete Cell Removed */}
                <td> {/* Actions Cell */}
                  <ActionButton onClick={() => handleAddPrepayment(entry)} title={`Log a prepayment for ${entryDate.toLocaleDateString()}`}>Prepay</ActionButton>
                  <ActionButton onClick={() => handleSetROI(entry)} title={`Log an ROI change effective ${entryDate.toLocaleDateString()}`}>Set ROI</ActionButton>
                  <ActionButton onClick={() => handleSetEMI(entry)} title={`Log a custom EMI effective ${entryDate.toLocaleDateString()}`}>Set EMI</ActionButton>
                </td>
              </tr>
            );
          })}
          </tbody>
        </StyledTable>
      </TableContainer>
    </div>
  );
};

export default AmortizationTable;
