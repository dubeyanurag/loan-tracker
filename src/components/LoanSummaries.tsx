// src/components/LoanSummaries.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react'; 
import styled from 'styled-components';
import { AmortizationEntry, AnnualSummary, LifespanSummary, CurrentSummary, LoanDetails } from '../types'; 
import { generateAnnualSummaries, generateLifespanSummary, generateSummaryToDate } from '../utils/amortizationCalculator'; 

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

const SummaryColumns = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 30px; 

    & > div { 
        flex: 1;
        min-width: 250px; 
        
        p { 
             margin: 5px 0;
             font-size: 0.95em;
        }
    }
`;

const AnnualTableContainer = styled.div`
    max-height: 300px; 
    overflow-y: auto;
    border: 1px solid #eee; 
    margin-top: 10px;
`;

const SummaryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: right;
  }
  th {
    background-color: #f8f9fa;
    position: sticky; 
    top: 0;
    z-index: 1;
  }
  td:first-child {
      text-align: left;
  }
  tr.highlight-current-fy { 
      background-color: #fff3cd; 
      font-weight: bold; 
  }
`;

interface LoanSummariesProps {
  schedule: AmortizationEntry[];
  loanDetails: LoanDetails; 
}

const monthOptions = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' }, 
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
];

const LoanSummaries: React.FC<LoanSummariesProps> = ({ schedule, loanDetails }) => { 
  const [fyStartMonth, setFyStartMonth] = useState<number>(3); 
  const currentFYRowRef = useRef<HTMLTableRowElement | null>(null); 
  const annualTableContainerRef = useRef<HTMLDivElement | null>(null); 

  const annualSummaries: AnnualSummary[] = useMemo(() => {
    return generateAnnualSummaries(schedule, loanDetails, fyStartMonth); 
  }, [schedule, loanDetails, fyStartMonth]);

  const lifespanSummary: LifespanSummary | null = useMemo(() => {
    return generateLifespanSummary(schedule, annualSummaries); 
  }, [schedule, annualSummaries]); 

  const summaryToDate: CurrentSummary | null = useMemo(() => {
      return generateSummaryToDate(schedule, loanDetails, fyStartMonth); 
  }, [schedule, loanDetails, fyStartMonth]); 

  const now = new Date();
  const currentCalendarYear = now.getFullYear();
  const currentMonth = now.getMonth();
  let currentFYStartYear = currentCalendarYear;
  if (currentMonth < fyStartMonth) {
      currentFYStartYear = currentCalendarYear - 1;
  }
  const currentFYLabel = `FY ${currentFYStartYear}-${(currentFYStartYear + 1).toString().slice(-2)}`;

  useEffect(() => {
      if (currentFYRowRef.current && annualTableContainerRef.current) {
          const containerHeight = annualTableContainerRef.current.clientHeight;
          const rowTop = currentFYRowRef.current.offsetTop;
          const rowHeight = currentFYRowRef.current.clientHeight;
          const scrollTo = rowTop - (containerHeight / 2) + (rowHeight / 2);
          
          annualTableContainerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
  }, [annualSummaries]); 


  if (!schedule || schedule.length === 0) {
    return null; 
  }

  const principalLimitHeader = `Deductible Principal (Max ₹${(loanDetails.principalDeductionLimit ?? 150000).toLocaleString()})`;
  const interestLimitHeader = `Deductible Interest (Max ₹${(loanDetails.interestDeductionLimit ?? 200000).toLocaleString()})`;


  return (
    <SummaryContainer>
      <SummarySection>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
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
          <AnnualTableContainer ref={annualTableContainerRef}> 
            <SummaryTable>
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Principal Paid</th>
                  <th>Interest Paid</th>
                  <th>Total Payment</th>
                  {/* Ensure conditional rendering for headers */}
                  {loanDetails.isTaxDeductible && ( 
                    <> 
                      <th>{principalLimitHeader}</th> 
                      <th>{interestLimitHeader}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {annualSummaries.map(summary => {
                  const isCurrentFY = summary.yearLabel === currentFYLabel;
                  return (
                    <tr 
                      key={summary.startYear} 
                      className={isCurrentFY ? 'highlight-current-fy' : ''} 
                      ref={isCurrentFY ? currentFYRowRef : null} 
                    > 
                      <td>{summary.yearLabel}</td> 
                      <td>{summary.totalPrincipalPaid.toLocaleString()}</td>
                      <td>{summary.totalInterestPaid.toLocaleString()}</td>
                      <td>{summary.totalPayment.toLocaleString()}</td>
                      {/* Ensure conditional rendering for data cells */}
                      {loanDetails.isTaxDeductible && ( 
                        <>
                          <td>{summary.deductiblePrincipal.toLocaleString()}</td> 
                          <td>{summary.deductibleInterest.toLocaleString()}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </SummaryTable>
          </AnnualTableContainer>
        ) : (
          <p>No annual summary data available.</p>
        )}
      </SummarySection>

      <SummaryColumns> 
          <SummarySection>
            <h4>Loan Lifespan Summary</h4>
            {lifespanSummary ? (
              <div>
                <p><strong>Actual Tenure:</strong> {lifespanSummary.actualTenureMonths} months ({ (lifespanSummary.actualTenureMonths / 12).toFixed(1) } years)</p>
                <p><strong>Total Principal Paid:</strong> ₹{lifespanSummary.totalPrincipalPaid.toLocaleString()}</p>
                <p><strong>Total Interest Paid:</strong> ₹{lifespanSummary.totalInterestPaid.toLocaleString()}</p>
                <p><strong>Total Amount Paid:</strong> ₹{lifespanSummary.totalPayment.toLocaleString()}</p>
                {/* Restore conditional display for lifespan deductibles */}
                {loanDetails.isTaxDeductible && (
                  <>
                    <p><strong>Total Deductible Principal (Lifespan):</strong> ₹{lifespanSummary.totalDeductiblePrincipal.toLocaleString()}</p>
                    <p><strong>Total Deductible Interest (Lifespan):</strong> ₹{lifespanSummary.totalDeductibleInterest.toLocaleString()}</p>
                  </>
                )}
              </div>
            ) : (
              <p>No lifespan summary data available.</p>
            )}
          </SummarySection>

          <SummarySection>
            <h4>Summary To Date ({new Date().toLocaleDateString()})</h4>
            {summaryToDate ? (
              <div>
                 <p><strong>Months Elapsed:</strong> {summaryToDate.monthsElapsed}</p>
                 <p><strong>Outstanding Balance:</strong> ₹{summaryToDate.currentOutstandingBalance.toLocaleString()}</p>
                 <p><strong>Total Principal Paid (To Date):</strong> ₹{summaryToDate.uncappedTotalPrincipalPaid.toLocaleString()}</p> 
                 <p><strong>Total Interest Paid (To Date):</strong> ₹{summaryToDate.uncappedTotalInterestPaid.toLocaleString()}</p> 
                 <p><strong>Total Amount Paid (To Date):</strong> ₹{summaryToDate.totalPayment.toLocaleString()}</p>
                 {/* Restore conditional display for to-date deductibles */}
                 {loanDetails.isTaxDeductible && (
                   <>
                    <p><strong>Total Deductible Principal (To Date):</strong> ₹{summaryToDate.totalDeductiblePrincipal.toLocaleString()}</p>
                    <p><strong>Total Deductible Interest (To Date):</strong> ₹{summaryToDate.totalDeductibleInterest.toLocaleString()}</p>
                   </>
                 )}
              </div>
            ) : (
              <p>No summary data available for current date.</p>
            )}
          </SummarySection>
      </SummaryColumns>
    </SummaryContainer>
  );
};

export default LoanSummaries;
