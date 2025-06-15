// import React from 'react';
import { useState, useEffect } from 'react'; // Removed React import, kept hooks
import styled from 'styled-components';
import pako from 'pako';
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
  /* Add SVG background pattern */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ctext x='10' y='30' font-size='20' opacity='0.1'%3E🏠%3C/text%3E%3Ctext x='60' y='70' font-size='20' opacity='0.1'%3E💰%3C/text%3E%3Ctext x='30' y='80' font-size='20' opacity='0.1'%3E🔒%3C/text%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 100px 100px; /* Adjust size of the repeating tile */
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

const SubTitle = styled.p`
  color: #666; // Muted color
  margin: 0.25rem 0 0 0; // Small top margin, no other margins
  font-size: 0.9rem; // Smaller font size
  font-weight: normal; // Normal font weight
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
  
  useEffect(() => {
    // Load state from URL if present
    const params = new URLSearchParams(window.location.search);
    const loadStateParam = params.get('loadState');
    if (loadStateParam) {
      try {
        const base64DecodedBinaryString = atob(decodeURIComponent(loadStateParam));
        const compressedDataArray = new Uint8Array(base64DecodedBinaryString.length);
        for (let i = 0; i < base64DecodedBinaryString.length; i++) { compressedDataArray[i] = base64DecodedBinaryString.charCodeAt(i); }
        const decompressedJsonState = pako.inflate(compressedDataArray, { to: 'string' });
        const loadedState = JSON.parse(decompressedJsonState);
        // Ensure loadedState conforms to at least part of AppState structure
        if (loadedState && loadedState.loans) { // Basic check
          dispatch({ type: 'LOAD_STATE', payload: loadedState });
        }
        // Remove the loadState param from URL to prevent re-loading on refresh
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error("Failed to load state from URL:", error);
        alert("Error: Could not load shared state from URL. It might be invalid or corrupted.");
        window.history.replaceState({}, '', window.location.pathname); // Also clear on error
      }
    }
  }, [dispatch]); // Run once on mount

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);
  const loanToEdit = loans.find(loan => loan.id === editingLoanId);

  const handleCloseEditModal = () => {
    dispatch({ type: 'END_EDIT_LOAN' });
  };

  return (
    <AppContainer>
      <HeaderContainer>
        <div> {/* Wrap title and subtitle */}
          <MainTitle>Loan Tracker</MainTitle> 
          <SubTitle>Your data is safe and stored only in your browser.</SubTitle>
        </div>
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
