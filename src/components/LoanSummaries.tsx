// src/components/LoanSummaries.tsx
import React, { useMemo, useState } from 'react'; // Add useState
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

const monthOptions = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' }, 
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
];

const LoanSummaries: React.FC<LoanSummariesProps> = ({ schedule }) => {
  const [fyStartMonth, setFyStartMonth] = useState<number>(3); // Default to April (index 3)

  const annualSummaries: AnnualSummary[] = useMemo(() => {
    return generateAnnualSummaries(schedule, fyStartMonth); // Pass selected month
  }, [schedule, fyStartMonth]);

  const lifespanSummary: LifespanSummary | null = useMemo(() => {
    return generateLifespanSummary(schedule);
  }, [schedule]);

  if (!schedule || schedule.length === 0) {
    return null; // Don't display if no schedule
  }

  return (
    <SummaryContainer>
      <SummarySection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>Annual Summaries</h4>
            <div>
                <label htmlFor="fyStartMonth" style={{ marginRight: '5px', fontSize: '0.9em' }}>FY Start Month:</label>
                <select 
                    id="fyStartMonth" 
                    value={fyStartMonth} 
                    onChange={(e) => setFyStartMonth(parseInt(e.target.value, 10))}
                    style={{ padding: '3px', fontSize: '0.9em' }}
                >
                    {monthOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
        {annualSummaries.length > 0 ? (
          <SummaryTable>
            <thead>
              <tr>
                <th>Financial Year</th>
                <th>Principal Paid</th>
                <th>Interest Paid</th>
                <th>Total Payment</th>
              </tr>
            </thead>
            <tbody>
              {annualSummaries.map(summary => (
                <tr key={summary.startYear}> {/* Use startYear for key */}
                  <td>{summary.yearLabel}</td> {/* Display yearLabel */}
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
