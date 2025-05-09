// src/components/LoanListItem.tsx
import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Loan } from '../types';
// Removed useAppState, useAppDispatch as props will be passed down
import { calculateTotalDisbursed } from '../utils/loanCalculations';
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator';

// Styled components for LoanItem and DeleteButton (copied from LoanList.tsx)
const LoanItem = styled.div<{$isSelected: boolean; $isClosed: boolean}>` 
  padding: 0.75rem; 
  margin-bottom: 0.5rem; 
  border: 1px solid #ccc; 
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.$isSelected ? '#d4eaff' : '#ffffff'}; 
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    background-color: ${props => props.$isSelected ? '#cce0ff' : '#f5f5f5'}; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  display: flex;
  justify-content: space-between;
  align-items: center;

  ${props => props.$isClosed && css`
    opacity: 0.6;
    background-color: #e9ecef; 
    /* cursor: default; */ /* Keep selectable as per last requirement */
     &:hover {
        background-color: #e9ecef; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
     }
  `}
`;

const DeleteButton = styled.button` 
  padding: 0.25rem 0.5rem; 
  font-size: 0.8rem; 
  background-color: #dc3545; 
  color: white;
  /* Base button styles from index.css will apply for border, radius, cursor */
  
  &:hover {
    background-color: #c82333; 
  }
`;

interface LoanListItemProps {
  loan: Loan;
  isSelected: boolean;
  onSelectLoan: (loanId: string) => void;
  onDeleteLoan: (event: React.MouseEvent, loanId: string) => void;
}

const LoanListItem: React.FC<LoanListItemProps> = ({ loan, isSelected, onSelectLoan, onDeleteLoan }) => {
  // Hooks are now at the top level of this component
  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan]);
  const summaryToDate = useMemo(() => generateSummaryToDate(schedule, loan.details, 3), [schedule, loan.details]);
  const isClosed = summaryToDate ? summaryToDate.currentOutstandingBalance <= 0.01 : false;

  return (
    <LoanItem
      // key prop is applied by the parent in the .map() function
      onClick={() => onSelectLoan(loan.id)}
      $isSelected={isSelected}
      $isClosed={isClosed}
    >
      <span>
        {loan.name} 
        (Total Disbursed: ₹{calculateTotalDisbursed(loan.details.disbursements).toLocaleString()})
        {isClosed && <em style={{marginLeft: '10px', color: '#555'}}>(Closed)</em>} 
      </span>
      <DeleteButton onClick={(e) => onDeleteLoan(e, loan.id)}>Delete</DeleteButton>
    </LoanItem>
  );
};

export default LoanListItem;
