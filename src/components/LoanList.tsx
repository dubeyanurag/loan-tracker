// src/components/LoanList.tsx
import React, { useState, useMemo } from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { Loan } from '../types'; // Removed AmortizationEntry
import styled from 'styled-components'; 
import LoanListItem from './LoanListItem';
import { generateAmortizationSchedule, generateSummaryToDate } from '../utils/amortizationCalculator'; // Added imports

const ListContainer = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

const SortControlsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
  flex-wrap: wrap;
`;

const SortLabel = styled.label`
  font-size: 0.9em;
  color: #555;
`;

const SortSelect = styled.select`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 0.9em;
`;

const SortButton = styled.button`
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
  font-size: 0.9em;
  &:hover {
    background-color: #e0e0e0;
  }
`;

type SortField = 'name' | 'startDate' | 'currentEMI' | 'outstandingPrincipal' | 'projectedEndDate';
type SortDirection = 'asc' | 'desc';

// Helper type for augmented loan data for sorting
interface AugmentedLoan extends Loan {
  calculatedCurrentEMI?: number;
  calculatedOutstandingPrincipal?: number;
  calculatedProjectedEndDate?: string; // Store as string for direct comparison or Date object
}

const LoanList: React.FC = () => {
  const { loans, selectedLoanId, fyStartMonth } = useAppState(); // Added fyStartMonth
  const dispatch = useAppDispatch();

  const [sortField, setSortField] = useState<SortField>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSelectLoan = (loanId: string) => {
    dispatch({ type: 'SELECT_LOAN', payload: loanId });
  };

  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value as SortField);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const sortedLoans = useMemo(() => {
    const augmentedLoans: AugmentedLoan[] = loans.map(loan => {
      const schedule = generateAmortizationSchedule(loan);
      let calculatedCurrentEMI: number | undefined = undefined;
      let calculatedOutstandingPrincipal: number | undefined = undefined;
      let calculatedProjectedEndDate: string | undefined = undefined;

      if (schedule.length > 0) {
        // Find first non-pre-EMI entry for a representative EMI
        const firstFullPaymentEntry = schedule.find(entry => !entry.isPreEMIPeriod && entry.emi > 0);
        calculatedCurrentEMI = firstFullPaymentEntry?.emi || schedule[0].emi; // Fallback to first EMI

        const summaryToDate = generateSummaryToDate(schedule, loan.details, fyStartMonth);
        calculatedOutstandingPrincipal = summaryToDate?.currentOutstandingBalance;
        
        if (schedule[schedule.length - 1].closingBalance <= 0.01) { // Check if loan is actually projected to end
            calculatedProjectedEndDate = schedule[schedule.length - 1].paymentDate;
        } else { // If loan doesn't end within schedule (e.g. error or very long pre-EMI)
            calculatedProjectedEndDate = '9999-12-31'; // Far future date for sorting
        }
      }
      return { 
        ...loan, 
        calculatedCurrentEMI, 
        calculatedOutstandingPrincipal,
        calculatedProjectedEndDate 
      };
    });

    augmentedLoans.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        case 'startDate':
          comparison = new Date(a.details.startDate).getTime() - new Date(b.details.startDate).getTime();
          break;
        case 'currentEMI':
          comparison = (a.calculatedCurrentEMI ?? 0) - (b.calculatedCurrentEMI ?? 0);
          break;
        case 'outstandingPrincipal':
          comparison = (a.calculatedOutstandingPrincipal ?? Infinity) - (b.calculatedOutstandingPrincipal ?? Infinity);
          break;
        case 'projectedEndDate':
          comparison = new Date(a.calculatedProjectedEndDate || '9999-12-31').getTime() - new Date(b.calculatedProjectedEndDate || '9999-12-31').getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return augmentedLoans;
  }, [loans, sortField, sortDirection, fyStartMonth]);


  if (loans.length === 0) {
    return null; 
  }

  return (
    <ListContainer>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
        <h3>Your Loans ({loans.length})</h3>
      </div>
      <SortControlsContainer>
        <SortLabel htmlFor="sort-field">Sort by:</SortLabel>
        <SortSelect id="sort-field" value={sortField} onChange={handleSortFieldChange}>
          <option value="startDate">Start Date</option>
          <option value="name">Loan Name</option>
          <option value="currentEMI">Current EMI</option>
          <option value="outstandingPrincipal">Outstanding Principal</option>
          <option value="projectedEndDate">Projected End Date</option>
        </SortSelect>
        <SortButton onClick={toggleSortDirection}>
          {sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
        </SortButton>
      </SortControlsContainer>
      
      {sortedLoans.map((loan: AugmentedLoan) => ( // Use AugmentedLoan type here
        <LoanListItem
          key={loan.id}
          loan={loan} // Pass the original loan object or augmented if LoanListItem needs calculated values
          isSelected={loan.id === selectedLoanId}
          onSelectLoan={handleSelectLoan}
        />
      ))}
    </ListContainer>
  );
};

export default LoanList;
