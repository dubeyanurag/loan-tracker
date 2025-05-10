// import React from 'react'; // Removed unused import
import styled from 'styled-components';
import LoanForm from './components/LoanForm';
import LoanList from './components/LoanList';
import { useAppContextShape } from './contexts/AppContext'; // Use useAppContextShape
import LoanDetailsDisplay from './components/LoanDetailsDisplay';
import ShareState from './components/ShareState'; 
import OverallSummary from './components/OverallSummary'; 
import TestRunner from './components/TestRunner'; // Import TestRunner

// Basic layout styled components
const AppContainer = styled.div`
  position: relative; /* Needed for absolute positioning of children */
  /* max-width: 900px; */ 
  margin: 0; 
  padding: 1.5rem; /* Use rem */
  font-family: inherit; /* Inherit from :root */
  color: inherit; /* Inherit from :root */
  background-color: #ffffff; /* White background for main app area */
  border-radius: 8px; /* Slightly larger radius */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Refined shadow */
  margin: 1rem auto; /* Add margin for spacing from viewport edges */
  max-width: 1200px; /* Add back a max-width for large screens */
`;

// New Header Container using Flexbox
const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between; /* Pushes title left, share right */
  align-items: center; 
  margin-bottom: 1.5rem; /* Use rem */
  padding-bottom: 1rem; /* Add padding below title/share */
  border-bottom: 1px solid #e0e0e0; /* Separator line */
`;

const MainTitle = styled.h1`
  color: #1976d2; /* Material Blue */
  margin: 0; 
  font-size: 2rem; /* Adjusted size */
`;

const ContentLayout = styled.div`
  display: flex; 
  flex-direction: column; 
  gap: 1.5rem; /* Use rem */

  /* Remove media query for columns */
  /* @media (min-width: 768px) { ... } */
`;

const Section = styled.section`
  padding: 1rem; /* Use rem */
  border-radius: 6px; /* Consistent radius */
  background-color: #f9f9f9; /* Very light grey for sections */
  border: 1px solid #e0e0e0; /* Light border */
`;


function App() {
  const { selectedLoanId, loans, testCaseData } = useAppContextShape(); // Get testCaseData
  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  if (testCaseData) {
    return <TestRunner testCase={testCaseData} />;
  }

  return (
    <AppContainer>
      <HeaderContainer>
        <MainTitle>Loan Tracker</MainTitle> 
        <ShareState /> 
      </HeaderContainer>

      <OverallSummary /> {/* Add Overall Summary Component */}
      
      <ContentLayout>
        <Section>
          <LoanForm />
          <LoanList />
        </Section>
        
        <Section>
          {selectedLoan ? (
            <div>
              <h2 style={{color: '#3f51b5'}}>{selectedLoan.name} Details</h2> {/* Material Indigo */}
              {/* Interest rate removed */}
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
