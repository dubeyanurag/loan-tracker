import React from 'react';
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppState } from './contexts/AppContext';
// import LoanDetailsDisplay from './components/LoanDetailsDisplay'; // To be created

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
  gap: 20px;

  @media (min-width: 768px) {
    // grid-template-columns: 1fr 2fr; // Example for two columns
  }
`;

const Section = styled.section`
  padding: 15px;
  border-radius: 5px;
  /* background-color: #f0f4f8; */
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
              <p>Tenure: {selectedLoan.details.originalTenureMonths / 12} years</p>
              <p>Start Date: {new Date(selectedLoan.details.startDate).toLocaleDateString()}</p>
              {/* More details and actions for the selected loan will go here */}
              {/* e.g., <LoanDetailsDisplay loan={selectedLoan} /> */}
            </div>
          ) : (
            <p>Select a loan to see details or add a new loan.</p>
          )}
        </Section>
      </ContentLayout>
    </AppContainer>
  );
}

export default App;
