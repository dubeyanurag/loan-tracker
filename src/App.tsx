// import React from 'react';
import React, { useState } from 'react'; // Added useState
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppStateWithEdit, useAppDispatch } from './contexts/AppContext'; 
import LoanDetailsDisplay from './components/LoanDetailsDisplay';
// import ShareState from './components/ShareState'; // Old import
import SettingsButton from './components/SettingsButton'; // New import
import OverallSummary from './components/OverallSummary'; 
import Modal from './components/Modal'; 
import EditLoanDetailsForm from './components/EditLoanDetailsForm'; 
import EmptyState from './components/EmptyState'; 
import SettingsModal from './components/SettingsModal'; // Import SettingsModal

const AppContainer = styled.div`
  position: relative; 
  margin: 0; 
  padding: 1.5rem; 
  font-family: inherit; 
  color: inherit; 
  background-color: #ffffff; 
  border-radius: 8px; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
  margin: 1rem auto; 
  max-width: 1200px; 
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 1.5rem; 
  padding-bottom: 1rem; 
  border-bottom: 1px solid #e0e0e0; 
`;

const MainTitle = styled.h1`
  color: #1976d2; 
  margin: 0; 
  font-size: 2rem; 
`;

const ContentLayout = styled.div`
  display: flex; 
  flex-direction: column; 
  gap: 1.5rem; 
`;

const Section = styled.section`
  padding: 1rem; 
  border-radius: 6px; 
  background-color: #f9f9f9; 
  border: 1px solid #e0e0e0; 

  @media (max-width: 600px) {
    padding: 0.75rem; // Slightly reduce padding on small screens
  }
`;


function App() {
  const { selectedLoanId, loans, editingLoanId } = useAppStateWithEdit(); 
  const dispatch = useAppDispatch();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // State for settings modal
  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);
  const loanToEdit = loans.find(loan => loan.id === editingLoanId);

  const handleCloseEditModal = () => {
    dispatch({ type: 'END_EDIT_LOAN' });
  };

  return (
    <AppContainer>
      <HeaderContainer>
        <MainTitle>Loan Tracker</MainTitle> 
      </HeaderContainer>

      <LoanForm /> {/* Add Loan FAB */}
      {loans.length > 0 && <SettingsButton onClick={() => setIsSettingsModalOpen(true)} />} {/* Settings FAB */}
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {loans.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <OverallSummary /> 
          <ContentLayout>
            <Section>
              {/* LoanForm is now only the FAB, actual form is in modal */}
              <LoanList />
            </Section>
            
            <Section>
              {selectedLoan ? (
                <div>
                  <h2 style={{color: '#3f51b5'}}>{selectedLoan.name} Details</h2> 
                  <LoanDetailsDisplay loan={selectedLoan} /> 
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#777', marginTop: '30px' }}>Select a loan to see details.</p>
              )}
            </Section>
          </ContentLayout>
        </>
      )}

      {/* Edit Loan Modal */}
      {loanToEdit && (
        <Modal isOpen={!!editingLoanId} onClose={handleCloseEditModal} title={`Edit Loan: ${loanToEdit.name}`}>
          <EditLoanDetailsForm loan={loanToEdit} onClose={handleCloseEditModal} />
        </Modal>
      )}
    </AppContainer>
  );
}

export default App;
