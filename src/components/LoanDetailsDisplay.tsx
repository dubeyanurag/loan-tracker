// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Loan } from '../types';
import { generateAmortizationSchedule } from '../utils/amortizationCalculator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries'; 
import LoanChart from './LoanChart';
import LoanHistoryTimeline from './LoanHistoryTimeline'; // Import Timeline
import { useAppDispatch } from '../contexts/AppContext';
import Modal from './Modal'; 
import AddDisbursementForm from './AddDisbursementForm'; 

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
  align-items: center; 
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

  &:hover:not(:disabled) {
    background-color: #45a049;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const AddEventButton = styled(StyledButton)`
  background-color: #007bff; 
  font-size: 0.8em;
  padding: 0.4rem 0.8rem;
  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
`;

interface LoanDetailsDisplayProps {
  loan: Loan;
}

const LoanDetailsDisplay: React.FC<LoanDetailsDisplayProps> = ({ loan }) => {
  const dispatch = useAppDispatch();
  const [activeView, setActiveView] = useState<'summaries' | 'scheduleAndChart'>('summaries'); 
  const [isAddDisbursementModalOpen, setIsAddDisbursementModalOpen] = useState(false);

  const schedule = useMemo(() => generateAmortizationSchedule(loan), [loan]);

  if (!loan) return <p>No loan selected.</p>;

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
        <StyledButton onClick={() => setActiveView('scheduleAndChart')} disabled={activeView === 'scheduleAndChart'}>
          View Full Schedule
        </StyledButton>
        <AddEventButton onClick={() => setIsAddDisbursementModalOpen(true)} style={{marginLeft: 'auto'}}>
          + Add Disbursement
        </AddEventButton>
      </ButtonContainer>

      {activeView === 'summaries' && (
        <>
          <LoanSummaries 
            schedule={schedule}
            loanDetails={loan.details}
          />
          <LoanHistoryTimeline loan={loan} schedule={schedule} /> {/* Pass schedule prop */}
        </>
      )}

      {activeView === 'scheduleAndChart' && ( 
        <>
          {schedule.length > 0 && <LoanChart schedule={schedule} loan={loan} />}
          {schedule.length > 0 && (
            <AmortizationTable 
              schedule={schedule} 
              loan={loan} 
              onDeleteDisbursement={handleDeleteDisbursement}
              onDeletePayment={handleDeletePayment}
              onDeleteROIChange={handleDeleteROIChange}
              onDeleteCustomEMIChange={handleDeleteCustomEMIChange}
            />
          )}
          {schedule.length === 0 && <p>No schedule to display.</p>}
        </>
      )}

      <Modal 
        isOpen={isAddDisbursementModalOpen} 
        onClose={() => setIsAddDisbursementModalOpen(false)}
        title="Add New Disbursement"
      >
        <AddDisbursementForm loanId={loan.id} onClose={() => setIsAddDisbursementModalOpen(false)} />
      </Modal>
    </DisplayContainer>
  );
};

export default LoanDetailsDisplay;
