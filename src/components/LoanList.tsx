// src/components/LoanList.tsx
import React from 'react'; // Removed useMemo
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { Loan } from '../types'; 
import styled from 'styled-components'; 
// Removed calculateTotalDisbursed, generateAmortizationSchedule, generateSummaryToDate
// Removed css import as LoanItem styled component is moved
import LoanListItem from './LoanListItem'; // Import the new component

const ListContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

// LoanItem and DeleteButton styled components are now in LoanListItem.tsx

const LoanList: React.FC = () => {
  const { loans, selectedLoanId } = useAppState();
  const dispatch = useAppDispatch();

  const handleSelectLoan = (loanId: string) => {
    dispatch({ type: 'SELECT_LOAN', payload: loanId });
  };

  // handleDeleteLoan is now handled within LoanListItem

  if (loans.length === 0) {
    return <p>No loans added yet. Use the form above to add a new loan.</p>;
  }

  return (
    <ListContainer>
      <h3>Your Loans</h3>
      {loans.map((loan: Loan) => (
        <LoanListItem
          key={loan.id}
          loan={loan}
              isSelected={loan.id === selectedLoanId}
              onSelectLoan={handleSelectLoan}
              // onDeleteLoan prop removed
            />
          ))}
    </ListContainer>
  );
};

export default LoanList;
