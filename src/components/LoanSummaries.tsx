// src/components/LoanSummaries.tsx
import React, { useMemo, useRef, useEffect } from 'react'; // Removed useState
import styled from 'styled-components';
import { AmortizationEntry, AnnualSummary, LifespanSummary, CurrentSummary, LoanDetails } from '../types'; 
import { generateAnnualSummaries, generateLifespanSummary, generateSummaryToDate } from '../utils/amortizationCalculator'; 
import AnnualSummaryChart from './AnnualSummaryChart'; 
import { useAppState } from '../contexts/AppContext'; 
import { formatCurrency, formatDateReadable, formatIndianCurrencyShort } from '../utils/formatting'; 

const SummaryContainer = styled.div`
`;

const SummarySection = styled.div`
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
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
    overflow-x: auto; 
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

// monthOptions removed as dropdown is now in SettingsModal

const LoanSummaries: React.FC<LoanSummariesProps> = ({ schedule, loanDetails }) => { 
  const { currency, fyStartMonth } = useAppState(); // Get currency and fyStartMonth
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
  const currentMonthNum = now.getMonth(); // Renamed to avoid conflict
  let currentFYStartYear = currentCalendarYear;
  if (currentMonthNum < fyStartMonth) { // Use currentMonthNum
      currentFYStartYear = currentCalendarYear - 1;
  }
  const currentFYLabel = `FY ${currentFYStartYear}-${(currentFYStartYear + 1).toString().slice(-2)}`;

  useEffect(() => {
      if (currentFYRowRef.current && annualTableContainerRef.current) {
          const containerHeight = annualTableContainerRef.current.clientHeight;
          const rowTop = currentFYRowRef.current.offsetTop;
          const rowHeight = currentFYRowRef.current.clientHeight;
          const scrollTo = rowTop - (containerHeight / 2) + (rowHeight / 2);
          
          annualTableContainerRef.current.scrollTo({ top: Math.max(0, scrollTo), behavior: 'smooth' });
      }
  }, [annualSummaries]); 


  if (!schedule || schedule.length === 0) {
    return null; 
  }

  const principalLimitHeader = `Deductible Principal (Max ${formatCurrency(loanDetails.principalDeductionLimit ?? 150000, currency)})`;
  const interestLimitHeader = `Deductible Interest (Max ${formatCurrency(loanDetails.interestDeductionLimit ?? 200000, currency)})`;


  return (
    <SummaryContainer>
      <SummaryColumns> 
          <SummarySection>
            <h4>Loan Lifespan Summary</h4>
            {lifespanSummary ? (
              <div>
                <p><strong>Actual Tenure:</strong> {lifespanSummary.actualTenureMonths} months ({ (lifespanSummary.actualTenureMonths / 12).toFixed(1) } years)</p>
                <p><strong>Total Principal Paid:</strong> {formatIndianCurrencyShort(lifespanSummary.totalPrincipalPaid, currency)}</p>
                {loanDetails.startedWithPreEMI && <p><strong>Total Pre-EMI Interest Paid:</strong> {formatIndianCurrencyShort(lifespanSummary.totalPreEMIInterestPaid, currency)}</p>}
                <p><strong>Total Regular Interest Paid:</strong> {formatIndianCurrencyShort(lifespanSummary.totalInterestPaid, currency)}</p>
                <p><strong>Total Amount Paid:</strong> {formatIndianCurrencyShort(lifespanSummary.totalPayment, currency)}</p>
                {loanDetails.isTaxDeductible && (
                  <>
                    <p><strong>Total Deductible Principal (Lifespan):</strong> {formatIndianCurrencyShort(lifespanSummary.totalDeductiblePrincipal, currency)}</p>
                    <p><strong>Total Deductible Interest (Lifespan):</strong> {formatIndianCurrencyShort(lifespanSummary.totalDeductibleInterest, currency)}</p>
                  </>
                )}
              </div>
            ) : (
              <p>No lifespan summary data available.</p>
            )}
          </SummarySection>

          <SummarySection>
            <h4>Summary To Date ({formatDateReadable(new Date().toISOString().split('T')[0])})</h4>
            {summaryToDate ? (
              <div>
                 <p><strong>Months Elapsed:</strong> {summaryToDate.monthsElapsed}</p>
                 <p><strong>Outstanding Balance:</strong> {formatIndianCurrencyShort(summaryToDate.currentOutstandingBalance, currency)}</p>
                 <p><strong>Total Principal Paid (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.uncappedTotalPrincipalPaid, currency)}</p> 
                 {loanDetails.startedWithPreEMI && <p><strong>Total Pre-EMI Interest Paid (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.totalPreEMIInterestPaid, currency)}</p>}
                 <p><strong>Total Regular Interest Paid (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.uncappedTotalInterestPaid, currency)}</p> 
                 <p><strong>Total Amount Paid (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.totalPayment, currency)}</p>
                 {loanDetails.isTaxDeductible && (
                   <>
                    <p><strong>Total Deductible Principal (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.totalDeductiblePrincipal, currency)}</p>
                    <p><strong>Total Deductible Interest (To Date):</strong> {formatIndianCurrencyShort(summaryToDate.totalDeductibleInterest, currency)}</p>
                   </>
                 )}
              </div>
            ) : (
              <p>No summary data available for current date.</p>
            )}
          </SummarySection>
      </SummaryColumns>

      <SummarySection>
        {/* FY Start Month dropdown removed from here */}
        <h4>Annual Summaries (Table)</h4>
        {annualSummaries.length > 0 ? (
          <AnnualTableContainer ref={annualTableContainerRef}> 
            <SummaryTable>
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Principal Paid</th>
                  {loanDetails.startedWithPreEMI && <th>Pre-EMI Interest</th>}
                  <th>Regular Interest</th>
                  <th>Prepayments Made</th>
                  <th>Total Payment</th>
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
                      <td>{formatIndianCurrencyShort(summary.totalPrincipalPaid, currency)}</td>
                      {loanDetails.startedWithPreEMI && <td>{formatIndianCurrencyShort(summary.totalPreEMIInterestPaid, currency)}</td>}
                      <td>{formatIndianCurrencyShort(summary.totalInterestPaid, currency)}</td>
                      <td>{formatIndianCurrencyShort(summary.totalPrepaymentsMade, currency)}</td>
                      <td>{formatIndianCurrencyShort(summary.totalPayment, currency)}</td>
                      {loanDetails.isTaxDeductible && ( 
                        <>
                          <td>{formatIndianCurrencyShort(summary.deductiblePrincipal, currency)}</td> 
                          <td>{formatIndianCurrencyShort(summary.deductibleInterest, currency)}</td>
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
      
      {annualSummaries.length > 0 && (
        <SummarySection>
          <AnnualSummaryChart annualSummaries={annualSummaries} />
        </SummarySection>
      )}

    </SummaryContainer>
  );
};

export default LoanSummaries;
