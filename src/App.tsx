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

// New Header Container using Flexbox
const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between; /* Pushes title left, share right */
  align-items: center; /* Vertically align items */
  margin-bottom: 30px; /* Keep margin below header */
`;

const MainTitle = styled.h1`
  /* text-align: center; */ /* No longer needed */
  color: #2c3e50;
  margin: 0; /* Remove default h1 margin */
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
      <HeaderContainer>
        <MainTitle>Loan Tracker</MainTitle> 
        <ShareState /> 
      </HeaderContainer>
      
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
      {/* ShareState moved into HeaderContainer */}
    </AppContainer>
  );
}

export default App;
