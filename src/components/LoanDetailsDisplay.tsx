// src/components/LoanDetailsDisplay.tsx
import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components'; // Import css
import { Loan } from '../types';
import { generateAmortizationSchedule } from '../utils/amortizationCalculator';
import AmortizationTable from './AmortizationTable';
import LoanSummaries from './LoanSummaries'; 
import LoanChart from './LoanChart';
import LoanHistoryTimeline from './LoanHistoryTimeline';
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

const TopControlsContainer = styled.div`
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between; // To push Add Disbursement button to the right
  align-items: center; 
  flex-wrap: wrap; // Allow wrapping on small screens
  gap: 0.5rem;
`;

const TabNav = styled.div`
  display: flex;
  border-bottom: 2px solid #eee;
  margin-bottom: 1rem; // Add margin below tabs
`;

const TabButton = styled.button<{$isActive: boolean}>`
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  border: none;
  background-color: transparent;
  font-size: 1em;
  color: ${props => props.$isActive ? '#1976d2' : '#555'};
  border-bottom: 3px solid ${props => props.$isActive ? '#1976d2' : 'transparent'};
  margin-bottom: -2px; // Align with TabNav border
  transition: color 0.2s, border-bottom-color 0.2s;

  &:hover {
    color: #1976d2;
  }
`;

const AddEventButton = styled.button` // Re-styled from StyledButton for this specific use
  padding: 0.5rem 1rem;
  background-color: #007bff; 
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;

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
      <TopControlsContainer>
        <TabNav>
          <TabButton onClick={() => setActiveView('summaries')} $isActive={activeView === 'summaries'}>
            Summaries
          </TabButton>
          <TabButton onClick={() => setActiveView('scheduleAndChart')} $isActive={activeView === 'scheduleAndChart'}>
            Schedule & Chart
          </TabButton>
        </TabNav>
        <AddEventButton onClick={() => setIsAddDisbursementModalOpen(true)}>
          + Add Disbursement
        </AddEventButton>
      </TopControlsContainer>

      {activeView === 'summaries' && (
        <>
          <LoanSummaries 
            schedule={schedule}
            loanDetails={loan.details}
          />
          <LoanHistoryTimeline loan={loan} schedule={schedule} />
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
