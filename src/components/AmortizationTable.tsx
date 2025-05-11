// src/components/AmortizationTable.tsx
import React, { useEffect, useRef } from 'react'; 
import styled from 'styled-components';
import { AmortizationEntry, Loan } from '../types'; 
import { useAppDispatch, useAppState } from '../contexts/AppContext'; // Import useAppState
import { formatCurrency, formatDateReadable } from '../utils/formatting'; // Import formatters

const TableContainer = styled.div`
  margin-top: 10px; 
  max-height: 500px; 
  overflow-y: auto;
  overflow-x: auto; 
  border: 1px solid #ddd;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;

  th, td {
    border: 1px solid #ddd;
    padding: 6px 8px; 
    text-align: right;
    vertical-align: top; 
  }

  th {
    background-color: #f2f2f2;
    position: sticky;
    top: 0;
    z-index: 1;
    white-space: nowrap; 
  }

  td:nth-child(1), td:nth-child(2) { 
    text-align: left;
    white-space: nowrap;
  }
  
  tr.highlight-prepayment { background-color: #e6ffed; }
  tr.highlight-roi { background-color: #fff3cd; }
  tr.highlight-emi { background-color: #f3e7ff; }
  tr.highlight-disbursement { background-color: #d1ecf1; }
  
  tr.pre-emi-period { 
    color: #555; 
  }
  tr.pre-emi-period td.interest-cell::before { 
    content: "* "; 
    color: #555;
  }

  tr.highlight-current-month td { 
      border-top: 2px solid red; 
      border-bottom: 2px solid red;
   } 
`;

const ActionButton = styled.button`
  padding: 5px 8px; 
  font-size: 0.85em; 
  min-height: 28px; 
  margin-right: 4px;
  margin-bottom: 4px; 
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

const SmallDeleteButton = styled.button`
    background: none;
    border: none;
    color: #dc3545; 
    cursor: pointer;
    font-size: 1.1em; 
    padding: 2px 5px; 
    min-width: 28px; 
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle; 
    line-height: 1; 
     &:hover {
        color: #a71d2a; 
     }
`;

const EventItem = styled.div`
    font-size: 0.85em;
    margin-bottom: 3px;
    white-space: nowrap; 
`;


interface AmortizationTableProps {
  schedule: AmortizationEntry[];
  loan: Loan; 
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
  const { currency } = useAppState(); // Get currency
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
        
        tableContainerRef.current.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' }); 
    }
  }, [schedule]); 


  const handleAddPrepayment = (entry: AmortizationEntry) => {
    const entryDateISO = entry.paymentDate; 
    const amountStr = window.prompt(`Enter prepayment amount (for ${formatDateReadable(entryDateISO)} or specify date below):`);
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        const effectiveDateStr = window.prompt(`Enter effective date for this prepayment (YYYY-MM-DD), or leave for ${formatDateReadable(entryDateISO)}:`, entryDateISO);
        const paymentDate = effectiveDateStr || entryDateISO;

        const preferencePrompt = window.prompt(`Prepayment of ${formatCurrency(amount, currency)} on ${formatDateReadable(paymentDate)}. Choose effect:\n1: Reduce Tenure (Keep EMI Same - default)\n2: Reduce EMI (Keep Original Tenure)`, "1");
        let adjustmentPreference: 'adjustTenure' | 'adjustEMI' = 'adjustTenure';
        if (preferencePrompt === '2') {
            adjustmentPreference = 'adjustEMI';
        } else if (preferencePrompt !== '1') {
            alert('Invalid choice. Defaulting to "Reduce Tenure".');
        }

        dispatch({
          type: 'ADD_PAYMENT',
          payload: {
            loanId: loan.id,
            payment: {
              date: paymentDate, 
              amount: amount,
              type: 'Prepayment',
              remarks: 'In-table Prepayment',
              adjustmentPreference: adjustmentPreference, 
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
    const entryDateISO = entry.paymentDate;
    const rateStr = window.prompt(`Current date context: ${formatDateReadable(entryDateISO)}. Enter new Annual ROI (%):`);
    if (rateStr) {
      const newRate = parseFloat(rateStr);
      if (!isNaN(newRate) && newRate >= 0) { 
        const effectiveDateStr = window.prompt(`Enter effective date for ROI ${newRate}% (YYYY-MM-DD):`, entryDateISO);
        const changeDate = effectiveDateStr || entryDateISO;

        const preferencePrompt = window.prompt(`New ROI is ${newRate}% from ${formatDateReadable(changeDate)}. Choose effect:\n1: Reduce Tenure (Keep EMI Same)\n2: Reduce EMI (Keep Tenure Same)`, "1");
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
              date: changeDate, 
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
     const entryDateISO = entry.paymentDate;
     const emiStr = window.prompt(`Current date context: ${formatDateReadable(entryDateISO)}. Enter new Custom EMI:`);
     if (emiStr) {
       const newEMI = parseFloat(emiStr);
       if (!isNaN(newEMI) && newEMI > 0) {
         const effectiveDateStr = window.prompt(`Enter effective date for new EMI ${formatCurrency(newEMI, currency)} (YYYY-MM-DD):`, entryDateISO);
         const changeDate = effectiveDateStr || entryDateISO;

         dispatch({
           type: 'ADD_CUSTOM_EMI_CHANGE',
           payload: {
             loanId: loan.id,
             change: {
               date: changeDate, 
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

  if (!schedule || schedule.length === 0) {
    return <p>Amortization schedule not available or loan fully paid.</p>;
  }

  return (
    <div style={{marginTop: '20px'}}> 
      <h4>
        Full Amortization Schedule 
        {loan.details.startedWithPreEMI && <em style={{fontSize: '0.8em', fontWeight: 'normal', marginLeft: '5px'}}> (* Pre-EMI Interest)</em>}
      </h4>
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
            <th>Events / Actions</th> 
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
            let rowClass = `${highlightClass} ${isCurrentMonth ? 'highlight-current-month' : ''}`.trim();
            if (entry.isPreEMIPeriod) {
                rowClass = `${rowClass} pre-emi-period`.trim();
            }

            return (
              <tr 
                key={entry.monthNumber} 
                className={rowClass || undefined} 
                ref={isCurrentMonth ? currentRowRef : null} 
              > 
                <td>{entry.monthNumber}</td>
                <td>{formatDateReadable(entry.paymentDate)}</td>
                <td>{formatCurrency(entry.openingBalance, currency)}</td>
                <td>{formatCurrency(entry.emi, currency)}</td>
                <td>{formatCurrency(entry.principalPaid, currency)}</td>
                <td className={entry.isPreEMIPeriod ? "interest-cell" : ""}>{formatCurrency(entry.interestPaid, currency)}</td>
                <td>{formatCurrency(entry.closingBalance, currency)}</td>
                <td> 
                    {entry.disbursements?.map(d => (
                        <EventItem key={d.id}>
                            Disburse: {formatCurrency(d.amount, currency)}
                            <SmallDeleteButton onClick={() => onDeleteDisbursement(d.id)} title="Delete Disbursement">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    {entry.prepayments?.map(p => (
                        <EventItem key={p.id}>
                            Prepay: {formatCurrency(p.amount, currency)} {p.adjustmentPreference === 'adjustEMI' ? '(EMI Adj.)' : ''}
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
                            EMI: {formatCurrency(c.newEMI, currency)}
                            <SmallDeleteButton onClick={() => onDeleteCustomEMIChange(c.id)} title="Delete Custom EMI Change">&#x274C;</SmallDeleteButton>
                        </EventItem>
                    ))}
                    <div style={{marginTop: '5px'}}> 
                        <ActionButton onClick={() => handleAddPrepayment(entry)} title={`Log a prepayment for ${formatDateReadable(entry.paymentDate)}`}>💰 Prepay</ActionButton>
                        <ActionButton onClick={() => handleSetROI(entry)} title={`Log an ROI change effective ${formatDateReadable(entry.paymentDate)}`}>📈 Set ROI</ActionButton>
                        <ActionButton onClick={() => handleSetEMI(entry)} title={`Log a custom EMI effective ${formatDateReadable(entry.paymentDate)}`}>⚙️ Set EMI</ActionButton>
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
