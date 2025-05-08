// import React from 'react'; // Removed unused import
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppState } from './contexts/AppContext';
import LoanDetailsDisplay from './components/LoanDetailsDisplay';
import ShareState from './components/ShareState'; // Import ShareState

// Basic layout styled components
const AppContainer = styled.div`
  position: relative; /* Needed for absolute positioning of children */
  /* max-width: 900px; */ 
  margin: 0; 
  padding: 20px; 
  font-family: Arial, sans-serif; // Overriding index.css for app-specific font
  color: #333; // Overriding index.css for app-specific color
  background-color: #fff; // Overriding index.css for app-specific background
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
`;

const MainTitle = styled.h1`
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
`;

const ContentLayout = styled.div`
  display: flex; /* Use flexbox */
  flex-direction: column; /* Stack sections vertically */
  gap: 30px; 
  /* align-items: start; */ /* Not needed for column flex */

  /* Remove media query for columns */
  /* @media (min-width: 768px) { ... } */
`;

const Section = styled.section`
  padding: 15px;
  border-radius: 5px;
  /* background-color: #f0f4f8; */
  /* overflow: hidden; */ /* Remove overflow hidden */
  /* min-height: 100vh; */ /* Revert temporary debug */
`;


function App() {
  const { selectedLoanId, loans } = useAppState();
  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  return (
    <AppContainer>
      <MainTitle>Home Loan Tracker</MainTitle>
      
      <ContentLayout>
        <Section>
          <LoanForm />
          <LoanList />
        </Section>
        
        <Section>
          {selectedLoan ? (
            <div>
              <h2>Loan Details: {selectedLoan.name}</h2>
              {/* <p>Principal: ₹{selectedLoan.details.principal.toLocaleString()}</p> */} {/* Removed - Handled in LoanDetailsDisplay */}
              <p>Interest Rate: {selectedLoan.details.originalInterestRate}%</p>
              {/* LoanDetailsDisplay now renders directly inside the second section */}
              <LoanDetailsDisplay loan={selectedLoan} /> 
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#777', marginTop: '30px' }}>Select a loan to see details or add a new loan.</p>
          )}
        </Section>
      </ContentLayout>
      {/* Position ShareState at top right */}
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ShareState /> 
      </div>
    </AppContainer>
  );
}

export default App;
