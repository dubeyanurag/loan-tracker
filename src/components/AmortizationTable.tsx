// src/components/AmortizationTable.tsx
import React, { useEffect, useRef } from 'react'; 
import styled from 'styled-components';
import { AmortizationEntry, Loan } from '../types'; 
import { useAppDispatch } from '../contexts/AppContext'; 

const TableContainer = styled.div`
  margin-top: 10px; /* Reduced margin */
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
    padding: 6px 8px; /* Slightly reduced padding */
    text-align: right;
    vertical-align: top; /* Align content top */
  }

  th {
    background-color: #f2f2f2;
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap; /* Prevent header wrapping */
  }

  td:nth-child(1), td:nth-child(2) { 
    text-align: left;
    white-space: nowrap;
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
  margin-bottom: 4px; /* Add bottom margin */
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

// Small delete button for events
const SmallDeleteButton = styled.button`
    background: none;
    border: none;
    color: #dc3545; /* Red */
    cursor: pointer;
    font-size: 1em; /* Adjust size relative to surrounding text */
    padding: 0 0 0 5px; /* Add padding to left */
    vertical-align: middle; /* Align with text */
    line-height: 1; /* Prevent extra spacing */
     &:hover {
        color: #a71d2a; /* Darker red */
     }
`;

const EventItem = styled.div`
    font-size: 0.85em;
    margin-bottom: 3px;
    white-space: nowrap; /* Prevent wrapping */
`;


interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  loan: Loan; 
  // Add delete handler props
  onDeleteDisbursement: (eventId: string) => void;
  onDeletePayment: (eventId: string) => void;
  onDeleteROIChange: (eventId: string) => void;
  onDeleteCustomEMIChange: (eventId: string) => void;
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ 
    schedule, 
    loan, 
    onDeleteDisbursement,
    onDeletePayment,
    onDeleteROIChange,
    onDeleteCustomEMIChange 
}) => {
  const dispatch = useAppDispatch();
  const currentRowRef = useRef<HTMLTableRowElement | null>(null); 
  const tableContainerRef = useRef<HTMLDivElement | null>(null); 
  const tableBodyRef = useRef<HTMLTableSectionElement | null>(null); 

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  useEffect(() => {
    if (currentRowRef.current && tableContainerRef.current) {
        const containerHeight = tableContainerRef.current.clientHeight;
        const rowTop = currentRowRef.current.offsetTop;
        const rowHeight = currentRowRef.current.clientHeight;
        const scrollTo = rowTop - (containerHeight / 2) + (rowHeight / 2);
        
        tableContainerRef.current.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' }); // Ensure scroll is not negative
    }
  }, [schedule]); 


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
              principalPaid: amount, 
              interestPaid: 0, 
              balanceAfterPayment: 0, 
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
    <div style={{marginTop: '20px'}}> 
      <h4>Full Amortization Schedule</h4>
      <TableContainer ref={tableContainerRef}> 
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
            <th>Events / Actions</th> {/* Added Column */}
          </tr>
        </thead>
        <tbody ref={tableBodyRef}> 
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
                <td> {/* Events / Actions Cell */}
                    {/* Display Events with Delete Buttons */}
                    {entry.disbursements?.map(d => (
                        <EventItem key={d.id}>
                            Disburse: ₹{d.amount.toLocaleString()}
                            <SmallDeleteButton onClick={() => onDeleteDisbursement(d.id)} title="Delete Disbursement">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    {entry.prepayments?.map(p => (
                        <EventItem key={p.id}>
                            Prepay: ₹{p.amount.toLocaleString()}
                            <SmallDeleteButton onClick={() => onDeletePayment(p.id)} title="Delete Prepayment">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    {entry.roiChanges?.map(c => (
                        <EventItem key={c.id}>
                            ROI: {c.newRate}% {c.preference && `(${c.preference})`}
                            <SmallDeleteButton onClick={() => onDeleteROIChange(c.id)} title="Delete ROI Change">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    {entry.emiChanges?.map(c => (
                        <EventItem key={c.id}>
                            EMI: ₹{c.newEMI.toLocaleString()}
                            <SmallDeleteButton onClick={() => onDeleteCustomEMIChange(c.id)} title="Delete Custom EMI Change">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    {/* Add Event Buttons */}
                    <div style={{marginTop: '5px'}}> {/* Add some space */}
                        <ActionButton onClick={() => handleAddPrepayment(entry)} title={`Log a prepayment for ${entryDate.toLocaleDateString()}`}>Prepay</ActionButton>
                        <ActionButton onClick={() => handleSetROI(entry)} title={`Log an ROI change effective ${entryDate.toLocaleDateString()}`}>Set ROI</ActionButton>
                        <ActionButton onClick={() => handleSetEMI(entry)} title={`Log a custom EMI effective ${entryDate.toLocaleDateString()}`}>Set EMI</ActionButton>
                    </div>
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
