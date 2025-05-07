import React from 'react';
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppState } from './contexts/AppContext';
import LoanDetailsDisplay from './components/LoanDetailsDisplay';

// Basic layout styled components
const AppContainer = styled.div`
  max-width: 900px;
  margin: 20px auto;
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
  display: grid;
  grid-template-columns: 1fr; // Single column for now, can be 2 for wider screens
  gap: 30px; // Increased gap slightly

  @media (min-width: 768px) {
    grid-template-columns: 1fr 2fr; // Enable two columns on wider screens
  }
`;

const Section = styled.section`
  padding: 15px;
  border-radius: 5px;
  /* background-color: #f0f4f8; */
  overflow: hidden; /* Add overflow hidden to prevent content spillover/overlap */
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
              <p>Principal: ₹{selectedLoan.details.principal.toLocaleString()}</p>
              <p>Interest Rate: {selectedLoan.details.originalInterestRate}%</p>
              <LoanDetailsDisplay loan={selectedLoan} />
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#777' }}>Select a loan to see details or add a new loan.</p>
          )}
        </Section>
      </ContentLayout>
    </AppContainer>
  );
}

export default App;
