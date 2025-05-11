// src/components/LoanListItem.tsx
import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { Loan } from '../types';
import { useAppDispatch, useAppState } from '../contexts/AppContext'; // Import useAppState
import { calculateTotalDisbursed } from '../utils/loanCalculations';
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator';
import { formatCurrency } from '../utils/formatting'; // Import formatCurrency

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
     &:hover {
        background-color: #e9ecef; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
     }
  `}
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const StyledButton = styled.button` 
  padding: 0.4rem 0.8rem; 
  font-size: 0.85rem; 
  min-height: 30px; 
  display: inline-flex; 
  align-items: center;
  justify-content: center;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const EditButtonStyled = styled(StyledButton)`
  background-color: #ffc107; 
  color: #212529;
  &:hover {
    background-color: #e0a800; 
  }
`;

const DeleteButtonStyled = styled(StyledButton)` 
  background-color: #dc3545; 
  &:hover {
    background-color: #c82333; 
  }
`;

interface LoanListItemProps {
  loan: Loan;
  isSelected: boolean;
  onSelectLoan: (loanId: string) => void;
}

const LoanListItem: React.FC<LoanListItemProps> = ({ loan, isSelected, onSelectLoan }) => {
  const dispatch = useAppDispatch();
  const { currency } = useAppState(); // Get currency
  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan]);
  const summaryToDate = useMemo(() => generateSummaryToDate(schedule, loan.details, 3), [schedule, loan.details]);
  const isClosed = summaryToDate ? summaryToDate.currentOutstandingBalance <= 0.01 : false;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    dispatch({ type: 'START_EDIT_LOAN', payload: loan.id });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (window.confirm(`Are you sure you want to delete loan "${loan.name}"?`)) {
      dispatch({ type: 'DELETE_LOAN', payload: loan.id });
    }
  };

  return (
    <LoanItem
      onClick={() => onSelectLoan(loan.id)}
      $isSelected={isSelected}
      $isClosed={isClosed}
    >
      <span>
        {loan.name} 
        (Total Disbursed: {formatCurrency(calculateTotalDisbursed(loan.details.disbursements), currency)})
        {isClosed && <em style={{marginLeft: '10px', color: '#555'}}>(Closed)</em>} 
      </span>
      <ActionButtonsContainer>
        <EditButtonStyled onClick={handleEdit} title="Edit loan details">
          ✏️ Edit
        </EditButtonStyled>
        <DeleteButtonStyled onClick={handleDelete} title="Delete loan">
          🗑️ Delete
        </DeleteButtonStyled>
      </ActionButtonsContainer>
    </LoanItem>
  );
};

export default LoanListItem;
