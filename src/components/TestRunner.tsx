// src/components/TestRunner.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
// import type { AmortizationEntry, AnnualSummary, LifespanSummary } from '../types'; // Removed unused import type
import { TestCaseJson, LoanDetails } from '../types'; // Keep these as direct imports
import { 
    generateAmortizationSchedule, 
    generateAnnualSummaries, 
    generateLifespanSummary 
} from '../utils/amortizationCalculator';

const TestRunnerContainer = styled.div`
  padding: 20px;
  font-family: sans-serif;
  background-color: #f0f0f0;
  min-height: 100vh;
`;

const TestResult = styled.div<{$passed: boolean}>`
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid ${props => (props.$passed ? 'green' : 'red')};
  background-color: ${props => (props.$passed ? '#e6ffe6' : '#ffe6e6')};
`;

const SectionTitle = styled.h3`
  margin-top: 10px;
  margin-bottom: 5px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
`;

const CodeBlock = styled.pre`
  background-color: #282c34;
  color: #abb2bf;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 0.85em;
`;

interface TestRunnerProps {
  testCase: TestCaseJson;
}

// Helper to compare numbers with tolerance for floating point issues
const approxEqual = (val1?: number, val2?: number, tolerance = 0.011): boolean => {
    if (val1 === undefined && val2 === undefined) return true;
    if (val1 === undefined || val2 === undefined) return false;
    return Math.abs(val1 - val2) < tolerance;
};

const TestRunner: React.FC<TestRunnerProps> = ({ testCase }) => {
  const { testName, initialLoanDetails, events, expectedResults } = testCase;

  const actualSchedule = useMemo(() => {
    // Ensure disbursements in details have IDs for the calculator
    const detailsWithDisbursementIds: LoanDetails = {
        ...initialLoanDetails,
        disbursements: initialLoanDetails.disbursements.map(d => ({...d, id: d.id || uuidv4()}))
    };
    return generateAmortizationSchedule(detailsWithDisbursementIds, events);
  }, [initialLoanDetails, events]);

  const actualAnnualSummaries = useMemo(() => {
    return generateAnnualSummaries(actualSchedule, initialLoanDetails, 3); // Assuming FY starts April (month 3)
  }, [actualSchedule, initialLoanDetails]);

  const actualLifespanSummary = useMemo(() => {
    return generateLifespanSummary(actualSchedule, actualAnnualSummaries);
  }, [actualSchedule, actualAnnualSummaries]);

  const results: { message: string; passed: boolean; details?: string }[] = [];

  // --- Perform Checks ---

  // Lifespan Summary Checks
  if (expectedResults.lifespanSummary && actualLifespanSummary) {
    Object.keys(expectedResults.lifespanSummary).forEach(key => {
      const expected = (expectedResults.lifespanSummary as any)[key];
      const actual = (actualLifespanSummary as any)[key];
      const passed = approxEqual(parseFloat(expected), parseFloat(actual));
      results.push({
        message: `Lifespan Summary - ${key}: Expected ${expected}, Got ${actual}`,
        passed,
        details: `Expected: ${expected}, Actual: ${actual}`
      });
    });
  }
  if (expectedResults.finalEMI && actualSchedule.length > 0) {
    const lastEMI = actualSchedule[actualSchedule.length -1].emi;
    const passed = approxEqual(expectedResults.finalEMI, lastEMI);
    results.push({ message: `Final EMI: Expected ${expectedResults.finalEMI}, Got ${lastEMI}`, passed });
  }
  if (expectedResults.finalTenure && actualSchedule.length > 0) {
    const actualTenure = actualSchedule.length;
    const passed = expectedResults.finalTenure === actualTenure;
    results.push({ message: `Final Tenure (months): Expected ${expectedResults.finalTenure}, Got ${actualTenure}`, passed });
  }


  // Annual Summary Checks
  if (expectedResults.annualSummaries) {
    expectedResults.annualSummaries.forEach(expectedAnnual => {
      const actualAnnual = actualAnnualSummaries.find(a => a.yearLabel === expectedAnnual.yearLabel);
      if (actualAnnual) {
        Object.keys(expectedAnnual).forEach(key => {
          if (key === 'yearLabel') return;
          const expected = (expectedAnnual as any)[key];
          const actual = (actualAnnual as any)[key];
          const passed = approxEqual(parseFloat(expected), parseFloat(actual));
          results.push({
            message: `Annual Summary (${expectedAnnual.yearLabel}) - ${key}: Expected ${expected}, Got ${actual}`,
            passed,
            details: `Expected: ${expected}, Actual: ${actual}`
          });
        });
      } else {
        results.push({ message: `Annual Summary for ${expectedAnnual.yearLabel} not found.`, passed: false });
      }
    });
  }

  // Schedule Entry Checks
  if (expectedResults.scheduleEntryChecks) {
    expectedResults.scheduleEntryChecks.forEach(expectedEntry => {
      const actualEntry = actualSchedule.find(e => e.monthNumber === expectedEntry.monthNumber);
      if (actualEntry) {
        Object.keys(expectedEntry).forEach(key => {
          if (key === 'monthNumber') return;
          const expected = (expectedEntry as any)[key];
          const actual = (actualEntry as any)[key];
          let passed = typeof expected === 'boolean' ? expected === actual : approxEqual(parseFloat(expected), parseFloat(actual));
          results.push({
            message: `Schedule Month ${expectedEntry.monthNumber} - ${key}: Expected ${expected}, Got ${actual}`,
            passed,
            details: `Expected: ${expected}, Actual: ${actual}`
          });
        });
      } else {
        results.push({ message: `Schedule entry for month ${expectedEntry.monthNumber} not found.`, passed: false });
      }
    });
  }
  
  const overallPassed = results.every(r => r.passed);

  return (
    <TestRunnerContainer>
      <h2>Test Runner: {testName}</h2>
      <TestResult $passed={overallPassed}>
        <strong>Overall Result: {overallPassed ? 'PASSED' : 'FAILED'}</strong>
      </TestResult>

      <SectionTitle>Test Assertions:</SectionTitle>
      {results.map((r, i) => (
        <TestResult key={i} $passed={r.passed}>
          {r.message}
          {!r.passed && r.details && <div style={{fontSize: '0.9em', color: '#721c24', marginTop: '5px'}}><em>{r.details}</em></div>}
        </TestResult>
      ))}

      <SectionTitle>Generated Lifespan Summary:</SectionTitle>
      <CodeBlock>{JSON.stringify(actualLifespanSummary, null, 2)}</CodeBlock>

      <SectionTitle>Generated Annual Summaries:</SectionTitle>
      <CodeBlock>{JSON.stringify(actualAnnualSummaries, null, 2)}</CodeBlock>
      
      <SectionTitle>Full Generated Schedule (First 20 rows):</SectionTitle>
      <CodeBlock>{JSON.stringify(actualSchedule.slice(0,20), null, 2)}</CodeBlock>
      {actualSchedule.length > 20 && <p>...</p>}
    </TestRunnerContainer>
  );
};

// Helper for uuidv4 if not globally available (e.g. in test environment)
// Should be imported if used in generateAmortizationSchedule for test loan ID
// For now, assuming generateAmortizationSchedule handles ID generation for test loan
// const uuidv4 = () => { /* basic uuid */ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); };


export default TestRunner;
