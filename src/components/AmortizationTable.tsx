// src/components/AmortizationTable.tsx
import React, { useMemo } from 'react'; // Import useMemo
import styled from 'styled-components';
import { AmortizationEntry, Loan } from '../types'; // Import Loan type
import { useAppDispatch } from '../contexts/AppContext'; // Import dispatch

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

  td:nth-child(1), td:nth-child(2), td:nth-child(8) { /* Month, Date, Remarks */
    text-align: left;
  }
  td:nth-child(8) { /* Remarks */
    min-width: 200px;
    font-size: 0.9em;
    color: #555;
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
  loan: Loan; // Pass the full loan object to check for adjustments
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule, loan }) => {
  const dispatch = useAppDispatch();

  // Find the date of the latest structural adjustment (ROI or Custom EMI change)
  const latestAdjustmentDate = useMemo(() => {
    const roiDates = loan.interestRateChanges.map(c => new Date(c.date).getTime());
    const emiDates = loan.customEMIChanges.map(c => new Date(c.date).getTime());
    const allAdjustmentTimestamps = [...roiDates, ...emiDates];
    if (allAdjustmentTimestamps.length === 0) {
      return null; // No adjustments made yet
    }
    return new Date(Math.max(...allAdjustmentTimestamps));
  }, [loan.interestRateChanges, loan.customEMIChanges]);

  const handleAddPrepayment = (entry: AmortizationEntry) => {
    const amountStr = window.prompt(`Enter prepayment amount for ${new Date(entry.paymentDate).toLocaleDateString()}:`);
    if (amountStr) {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        // Dispatch ADD_PAYMENT with type 'Prepayment'
        // Note: Need to refine principal/interest calculation logic later
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
      if (!isNaN(newRate) && newRate > 0) {
         // TODO: Ask for adjustment preference (adjustTenure/adjustEMI/customEMI) via modal later
         dispatch({
           type: 'ADD_INTEREST_RATE_CHANGE',
           payload: {
             loanId: loan.id,
             change: {
               id: '', // Will be set by reducer
               date: entry.paymentDate,
               newRate: newRate,
               adjustmentPreference: 'adjustTenure', // Default for now
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


  if (!schedule || schedule.length === 0) {
    return <p>Amortization schedule not available or loan fully paid.</p>;
  }

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
            <th>Remarks</th>
            <th>Actions</th> {/* New Actions Column */}
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry) => {
            const entryDate = new Date(entry.paymentDate);
            // Disable actions if entry date is on or before the latest structural adjustment
            const isDisabled = latestAdjustmentDate ? entryDate <= latestAdjustmentDate : false;

            return (
              <tr key={entry.monthNumber}>
                <td>{entry.monthNumber}</td>
                <td>{entryDate.toLocaleDateString()}</td>
                <td>{entry.openingBalance.toLocaleString()}</td>
                <td>{entry.emi.toLocaleString()}</td>
                <td>{entry.principalPaid.toLocaleString()}</td>
                <td>{entry.interestPaid.toLocaleString()}</td>
                <td>{entry.closingBalance.toLocaleString()}</td>
                <td>{entry.remarks}</td>
                <td> {/* Actions Cell */}
                  <ActionButton onClick={() => handleAddPrepayment(entry)} disabled={isDisabled} title="Add Prepayment">Prepay</ActionButton>
                  <ActionButton onClick={() => handleSetROI(entry)} disabled={isDisabled} title="Set New ROI">Set ROI</ActionButton>
                  <ActionButton onClick={() => handleSetEMI(entry)} disabled={isDisabled} title="Set Custom EMI">Set EMI</ActionButton>
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
