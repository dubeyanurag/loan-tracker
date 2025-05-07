// src/components/LoanList.tsx
import React from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { Loan } from '../types';
import styled from 'styled-components';
import { calculateTotalDisbursed } from '../utils/loanCalculations'; // Import helper

const ListContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

// Use $isSelected for transient prop
const LoanItem = styled.div<{$isSelected: boolean}>` 
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.$isSelected ? '#e0efff' : '#f9f9f9'}; 
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$isSelected ? '#cce0ff' : '#efefef'}; 
  }

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DeleteButton = styled.button`
  padding: 5px 10px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;

  &:hover {
    background-color: #c82333;
  }
`;


const LoanList: React.FC = () => {
  const { loans, selectedLoanId } = useAppState();
  const dispatch = useAppDispatch();

  const handleSelectLoan = (loanId: string) => {
    dispatch({ type: 'SELECT_LOAN', payload: loanId });
  };

  const handleDeleteLoan = (e: React.MouseEvent, loanId: string) => {
    e.stopPropagation(); // Prevent selection when deleting
    if (window.confirm('Are you sure you want to delete this loan?')) {
      dispatch({ type: 'DELETE_LOAN', payload: loanId });
    }
  };

  if (loans.length === 0) {
    return <p>No loans added yet. Use the form above to add a new loan.</p>;
  }

  return (
    <ListContainer>
      <h3>Your Loans</h3>
      {loans.map((loan: Loan) => (
        <LoanItem
          key={loan.id}
          onClick={() => handleSelectLoan(loan.id)}
          $isSelected={loan.id === selectedLoanId} // Pass transient prop with $
        >
          {/* Calculate total disbursed for display */}
          <span>{loan.name} (Total Disbursed: ₹{calculateTotalDisbursed(loan.details.disbursements).toLocaleString()})</span>
          <DeleteButton onClick={(e) => handleDeleteLoan(e, loan.id)}>Delete</DeleteButton>
        </LoanItem>
      ))}
    </ListContainer>
  );
};

export default LoanList;
