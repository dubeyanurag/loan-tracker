// src/components/LoanList.tsx
import React, { useMemo } from 'react'; // Import useMemo
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { Loan } from '../types'; 
import styled, { css } from 'styled-components'; 
import { calculateTotalDisbursed } from '../utils/loanCalculations'; 
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator'; // Import summary generator

const ListContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

// Add $isClosed prop
const LoanItem = styled.div<{$isSelected: boolean; $isClosed: boolean}>` 
  padding: 0.75rem; /* Use rem */
  margin-bottom: 0.5rem; /* Use rem */
  border: 1px solid #ccc; /* Slightly darker border */
  border-radius: 4px;
  cursor: pointer;
  background-color: ${props => props.$isSelected ? '#d4eaff' : '#ffffff'}; /* White default, lighter blue selected */
  transition: background-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    background-color: ${props => props.$isSelected ? '#cce0ff' : '#f5f5f5'}; 
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  display: flex;
  justify-content: space-between;
  align-items: center;

  /* Styles for closed loans */
  ${props => props.$isClosed && css`
    opacity: 0.6;
    background-color: #e9ecef; /* Grey background */
    cursor: default; /* Indicate non-interactive */
     &:hover {
        background-color: #e9ecef; /* Don't change hover */
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
     }
  `}
`;

// Use base button style from index.css
const DeleteButton = styled.button` 
  padding: 0.25rem 0.5rem; /* Smaller padding */
  font-size: 0.8rem; /* Smaller font */
  background-color: #dc3545; /* Material Red */
  color: white;
  /* border: none; */ /* Base style */
  /* border-radius: 4px; */ /* Base style */
  /* cursor: pointer; */ /* Base style */
  
  &:hover {
    background-color: #c82333; /* Darker Red */
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
      {loans.map((loan: Loan) => {
        // Calculate status based on summary to date
        // Note: This still recalculates schedule/summary for every loan on list render
        const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan]);
        const summaryToDate = useMemo(() => generateSummaryToDate(schedule, loan.details, 3), [schedule, loan.details]); // Assume April FY start
        const isClosed = summaryToDate ? summaryToDate.currentOutstandingBalance <= 0.01 : false;

        return (
          <LoanItem
            key={loan.id}
            onClick={() => handleSelectLoan(loan.id)} // Allow selecting closed loans
            $isSelected={loan.id === selectedLoanId} 
            $isClosed={isClosed} 
          >
            <span>
                {loan.name} 
                (Total Disbursed: ₹{calculateTotalDisbursed(loan.details.disbursements).toLocaleString()})
                {isClosed && <em style={{marginLeft: '10px', color: '#555'}}>(Closed)</em>} 
            </span>
            <DeleteButton onClick={(e) => handleDeleteLoan(e, loan.id)}>Delete</DeleteButton>
          </LoanItem>
        );
      })}
    </ListContainer>
  );
};

export default LoanList;
