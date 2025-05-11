// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Loan } from '../types'; // Removed unused AmortizationEntry, AnnualSummary, etc.
import { generateAmortizationSchedule } from '../utils/amortizationCalculator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries'; 
import { useAppDispatch } from '../contexts/AppContext'; // Import useAppDispatch

const DisplayContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

const ButtonContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StyledButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #45a049;
  }
`;

interface LoanDetailsDisplayProps {
  loan: Loan;
}

const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
  const dispatch = useAppDispatch(); // Get dispatch
  const [activeView, setActiveView] = useState<'schedule' | 'summaries'>('summaries');

  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan]);

  if (!loan) return <p>No loan selected.</p>;

  // Define delete handlers
  const handleDeleteDisbursement = (disbursementId: string) => {
    if (window.confirm('Are you sure you want to delete this disbursement? This may affect loan calculations significantly.')) {
      dispatch({ type: 'DELETE_DISBURSEMENT', payload: { loanId: loan.id, disbursementId } });
    }
  };
  const handleDeletePayment = (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment/prepayment?')) {
      dispatch({ type: 'DELETE_PAYMENT', payload: { loanId: loan.id, paymentId } });
    }
  };
  const handleDeleteROIChange = (changeId: string) => {
     if (window.confirm('Are you sure you want to delete this ROI change?')) {
      dispatch({ type: 'DELETE_ROI_CHANGE', payload: { loanId: loan.id, changeId } });
    }
  };
  const handleDeleteCustomEMIChange = (changeId: string) => {
    if (window.confirm('Are you sure you want to delete this custom EMI change?')) {
      dispatch({ type: 'DELETE_CUSTOM_EMI_CHANGE', payload: { loanId: loan.id, changeId } });
    }
  };


  return (
    <DisplayContainer>
      <ButtonContainer>
        <StyledButton onClick={() => setActiveView('summaries')} disabled={activeView === 'summaries'}>
          View Summaries
        </StyledButton>
        <StyledButton onClick={() => setActiveView('schedule')} disabled={activeView === 'schedule'}>
          View Full Schedule
        </StyledButton>
      </ButtonContainer>

      {activeView === 'summaries' && (
        <LoanSummaries 
          schedule={schedule}
          loanDetails={loan.details}
        />
      )}

      {activeView === 'schedule' && schedule.length > 0 && (
        <AmortizationTable 
          schedule={schedule} 
          loan={loan} 
          onDeleteDisbursement={handleDeleteDisbursement}
          onDeletePayment={handleDeletePayment}
          onDeleteROIChange={handleDeleteROIChange}
          onDeleteCustomEMIChange={handleDeleteCustomEMIChange}
        />
      )}
    </DisplayContainer>
  );
};

export default LoanDetailsDisplay;
