// src/components/AmortizationTable.tsx
import React from 'react';
import styled from 'styled-components';
import { AmortizationEntry } from '../types';

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

interface AmortizationTableProps {
  schedule: AmortizationEntry[];
}

const AmortizationTable: React.FC<AmortizationTableProps> = ({ schedule }) => {
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
          </tr>
        </thead>
        <tbody>
          {schedule.map((entry) => (
            <tr key={entry.monthNumber}>
              <td>{entry.monthNumber}</td>
              <td>{new Date(entry.paymentDate).toLocaleDateString()}</td>
              <td>{entry.openingBalance.toLocaleString()}</td>
              <td>{entry.emi.toLocaleString()}</td>
              <td>{entry.principalPaid.toLocaleString()}</td>
              <td>{entry.interestPaid.toLocaleString()}</td>
              <td>{entry.closingBalance.toLocaleString()}</td>
              <td>{entry.remarks}</td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </TableContainer>
  );
};

export default AmortizationTable;
