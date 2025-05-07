// src/components/LoanSummaries.tsx
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { AmortizationEntry } from '../types';
import { generateAnnualSummaries, generateLifespanSummary, AnnualSummary, LifespanSummary } from '../utils/amortizationCalculator';

const SummaryContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

const SummarySection = styled.div`
  margin-bottom: 20px;
`;

const SummaryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin-top: 10px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: right;
  }
  th {
    background-color: #f8f9fa;
  }
  td:first-child {
      text-align: left;
  }
`;

interface LoanSummariesProps {
  schedule: AmortizationEntry[];
}

const LoanSummaries: React.FC<LoanSummariesProps> = ({ schedule }) => {
  const annualSummaries: AnnualSummary[] = useMemo(() => {
    return generateAnnualSummaries(schedule);
  }, [schedule]);

  const lifespanSummary: LifespanSummary | null = useMemo(() => {
    return generateLifespanSummary(schedule);
  }, [schedule]);

  if (!schedule || schedule.length === 0) {
    return null; // Don't display if no schedule
  }

  return (
    <SummaryContainer>
      <SummarySection>
        <h4>Annual Summaries</h4>
        {annualSummaries.length > 0 ? (
          <SummaryTable>
            <thead>
              <tr>
                <th>Year</th>
                <th>Principal Paid</th>
                <th>Interest Paid</th>
                <th>Total Payment</th>
              </tr>
            </thead>
            <tbody>
              {annualSummaries.map(summary => (
                <tr key={summary.year}>
                  <td>{summary.year}</td>
                  <td>{summary.totalPrincipalPaid.toLocaleString()}</td>
                  <td>{summary.totalInterestPaid.toLocaleString()}</td>
                  <td>{summary.totalPayment.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </SummaryTable>
        ) : (
          <p>No annual summary data available.</p>
        )}
      </SummarySection>

      <SummarySection>
        <h4>Loan Lifespan Summary (Based on Schedule)</h4>
        {lifespanSummary ? (
          <div>
            <p><strong>Actual Tenure:</strong> {lifespanSummary.actualTenureMonths} months ({ (lifespanSummary.actualTenureMonths / 12).toFixed(1) } years)</p>
            <p><strong>Total Principal Paid:</strong> ₹{lifespanSummary.totalPrincipalPaid.toLocaleString()}</p>
            <p><strong>Total Interest Paid:</strong> ₹{lifespanSummary.totalInterestPaid.toLocaleString()}</p>
            <p><strong>Total Amount Paid:</strong> ₹{lifespanSummary.totalPayment.toLocaleString()}</p>
          </div>
        ) : (
          <p>No lifespan summary data available.</p>
        )}
      </SummarySection>
    </SummaryContainer>
  );
};

export default LoanSummaries;
