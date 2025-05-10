// import React from 'react'; // Removed unused import
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppState } from './contexts/AppContext'; // Reverted to useAppState
import LoanDetailsDisplay from './components/LoanDetailsDisplay';
import ShareState from './components/ShareState'; 
import OverallSummary from './components/OverallSummary'; 
// import TestRunner from './components/TestRunner'; // Removed TestRunner import

// Basic layout styled components
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
`;


function App() {
  const { selectedLoanId, loans } = useAppState(); // Use useAppState, no testCaseData
  const selectedLoan = loans.find(loan => loan.id === selectedLoanId); // loan type should be inferred

  // Removed TestRunner conditional rendering
  // if (testCaseData) {
  //   return <TestRunner testCase={testCaseData} />;
  // }

  return (
    <AppContainer>
      <HeaderContainer>
        <MainTitle>Loan Tracker</MainTitle> 
        <ShareState /> 
      </HeaderContainer>

      <OverallSummary /> 
      
      <ContentLayout>
        <Section>
          <LoanForm />
          <LoanList />
        </Section>
        
        <Section>
          {selectedLoan ? (
            <div>
              <h2 style={{color: '#3f51b5'}}>{selectedLoan.name} Details</h2> 
              <LoanDetailsDisplay loan={selectedLoan} /> 
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#777', marginTop: '30px' }}>Select a loan to see details or add a new loan.</p>
          )}
        </Section>
      </ContentLayout>
    </AppContainer>
  );
}

export default App;
