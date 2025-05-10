// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange, Disbursement, CurrentSummary, AnnualSummary, LifespanSummary, LoanDetails } from '../types'; 
import { calculateEMI } from './loanCalculations'; 

type LoanEvent = 
  | (Omit<Payment, 'date'> & { eventType: 'payment'; date: Date })
  | (Omit<InterestRateChange, 'date'> & { eventType: 'roiChange'; date: Date })
  | (Omit<CustomEMIChange, 'date'> & { eventType: 'emiChange'; date: Date });

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate(); // month is 0-indexed for Date, but 1-indexed for this function's input
};

export const generateAmortizationSchedule = (loan: Loan): AmortizationEntry[] => {
  const schedule: AmortizationEntry[] = [];
  if (!loan || !loan.details || !loan.details.disbursements || loan.details.disbursements.length === 0) return schedule;

  const sortedDisbursements = [...loan.details.disbursements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let monthNumber = 0;
  let openingBalance = sortedDisbursements[0].amount; 
  let cumulativeDisbursed = sortedDisbursements[0].amount; 
  let currentAnnualRate = loan.details.originalInterestRate;
  let currentTenureMonths = loan.details.originalTenureMonths; 
  let currentEMI = calculateEMI(cumulativeDisbursed, currentAnnualRate, currentTenureMonths); 
  
  const allEvents: (LoanEvent | (Omit<Disbursement, 'date'> & { eventType: 'disbursement'; date: Date }))[] = [
    ...(loan.paymentHistory || []).map(p => ({ ...p, eventType: 'payment' as const, date: new Date(new Date(p.date).setHours(0,0,0,0)) })),
    ...(loan.interestRateChanges || []).map(c => ({ ...c, eventType: 'roiChange' as const, date: new Date(new Date(c.date).setHours(0,0,0,0)) })),
    ...(loan.customEMIChanges || []).map(c => ({ ...c, eventType: 'emiChange' as const, date: new Date(new Date(c.date).setHours(0,0,0,0)) })),
    ...sortedDisbursements.slice(1).map(d => ({ ...d, eventType: 'disbursement' as const, date: new Date(new Date(d.date).setHours(0,0,0,0)) })) 
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let eventPointer = 0;
  
  const loanStartDate = new Date(new Date(loan.details.startDate).setHours(0,0,0,0));
  const emiStartDate = loan.details.emiStartDate ? new Date(new Date(loan.details.emiStartDate).setHours(0,0,0,0)) : loanStartDate; 
  
  let actualDebitDay = loan.details.emiDebitDay || loanStartDate.getDate();

  // Determine the date for the first schedule entry (payment period end)
  let paymentPeriodEndDate = new Date(loanStartDate);
  if (loan.details.emiDebitDay) { // If a specific debit day is set
    if (actualDebitDay < loanStartDate.getDate()) {
      // If debit day is in the past for the start month, move to next month's debit day
      paymentPeriodEndDate.setMonth(paymentPeriodEndDate.getMonth() + 1);
    }
    const daysInScheduledMonth = getDaysInMonth(paymentPeriodEndDate.getFullYear(), paymentPeriodEndDate.getMonth() + 1);
    paymentPeriodEndDate.setDate(Math.min(actualDebitDay, daysInScheduledMonth));
  }
  // If no emiDebitDay, paymentPeriodEndDate remains loanStartDate for the first entry.
  // For subsequent entries, it will be advanced by a month and day set to actualDebitDay.


  while (openingBalance > 0.01 && monthNumber < 600) { 
    monthNumber++;
    
    if (monthNumber > 1) { // For subsequent months, advance and set day
        paymentPeriodEndDate.setMonth(paymentPeriodEndDate.getMonth() + 1);
        const daysInNewMonth = getDaysInMonth(paymentPeriodEndDate.getFullYear(), paymentPeriodEndDate.getMonth() + 1);
        paymentPeriodEndDate.setDate(Math.min(actualDebitDay, daysInNewMonth));
    }
    // For monthNumber === 1, paymentPeriodEndDate is already set before the loop.

    const monthlyInterestRate = currentAnnualRate / 12 / 100;
    let interestForMonthAccrued = openingBalance * monthlyInterestRate;
    
    let principalPaidFromEMIThisMonth = 0;
    let principalPaidFromPrepaymentsThisMonth = 0;
    let interestPaidThisMonth = 0;
    
    let effectiveEMIForMonth = currentEMI; 
    // Pre-EMI check is based on whether the calculated paymentPeriodEndDate is before the emiStartDate
    let isPreEmiPeriodCurrentMonth = loan.details.startedWithPreEMI && paymentPeriodEndDate < emiStartDate; 
    let manualPaymentAmount: number | null = null; 

    let disbursementsThisMonth: AmortizationEntry['disbursements'] = [];
    let prepaymentsThisMonth: AmortizationEntry['prepayments'] = [];
    let roiChangesThisMonth: AmortizationEntry['roiChanges'] = [];
    let emiChangesThisMonth: AmortizationEntry['emiChanges'] = [];
    
    let openingBalanceForInterestCalc = openingBalance;

    // Process events that fall on or before the paymentPeriodEndDate for this period
    // Ensure event dates are also normalized for comparison
    while(eventPointer < allEvents.length && allEvents[eventPointer].date.getTime() <= paymentPeriodEndDate.getTime()) {
        const event = allEvents[eventPointer];
        
        if (event.eventType === 'disbursement') {
            openingBalance += event.amount; 
            cumulativeDisbursed += event.amount; 
            const remainingMonthsForEmiCalc = currentTenureMonths - monthNumber; 
            currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1);
            effectiveEMIForMonth = currentEMI; 
            disbursementsThisMonth.push({ id: event.id, amount: event.amount }); 
        } else if (event.eventType === 'payment') {
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; 
                principalPaidFromPrepaymentsThisMonth += event.amount; 
                prepaymentsThisMonth.push({ 
                    id: event.id, 
                    amount: event.amount, 
                    adjustmentPreference: event.adjustmentPreference 
                }); 
                
                if (event.adjustmentPreference === 'adjustEMI') {
                    const remainingMonthsForEmiCalc = currentTenureMonths - (monthNumber -1); 
                    if (remainingMonthsForEmiCalc > 0) {
                        currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc);
                        effectiveEMIForMonth = currentEMI;
                    }
                }
            } else { 
                manualPaymentAmount = event.amount;
            }
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            interestForMonthAccrued = openingBalanceForInterestCalc * (currentAnnualRate / 12 / 100); 
            
            const remainingMonthsForEmiCalc = currentTenureMonths - (monthNumber -1); 
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1); 
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) { 
                currentEMI = event.newEMIIfApplicable;
            }
            effectiveEMIForMonth = currentEMI; 
            roiChangesThisMonth.push({ id: event.id, newRate: event.newRate, preference: event.adjustmentPreference }); 
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            effectiveEMIForMonth = currentEMI; 
            emiChangesThisMonth.push({ id: event.id, newEMI: event.newEMI }); 
        }
        eventPointer++;
    }
    
    let actualCashOutflowThisMonth = 0;
    isPreEmiPeriodCurrentMonth = loan.details.startedWithPreEMI && paymentPeriodEndDate < emiStartDate; 

    if (manualPaymentAmount !== null) {
        actualCashOutflowThisMonth = manualPaymentAmount;
        if (isPreEmiPeriodCurrentMonth) {
            interestPaidThisMonth = manualPaymentAmount; 
            principalPaidFromEMIThisMonth = 0; 
        } else {
            interestPaidThisMonth = Math.min(interestForMonthAccrued, manualPaymentAmount);
            principalPaidFromEMIThisMonth = manualPaymentAmount - interestPaidThisMonth;
        }
    } else { 
        actualCashOutflowThisMonth = effectiveEMIForMonth;
        if (isPreEmiPeriodCurrentMonth) {
            interestPaidThisMonth = interestForMonthAccrued; 
            principalPaidFromEMIThisMonth = 0;
            actualCashOutflowThisMonth = interestForMonthAccrued; 
        } else {
            interestPaidThisMonth = Math.min(interestForMonthAccrued, effectiveEMIForMonth);
            principalPaidFromEMIThisMonth = effectiveEMIForMonth - interestPaidThisMonth;
        }
    }
    
    let totalPrincipalPaidThisMonth = principalPaidFromEMIThisMonth + principalPaidFromPrepaymentsThisMonth;
    if (manualPaymentAmount === null) { 
        actualCashOutflowThisMonth += principalPaidFromPrepaymentsThisMonth; 
    } else if (prepaymentsThisMonth.length > 0 && manualPaymentAmount !== null) {
         actualCashOutflowThisMonth = manualPaymentAmount + principalPaidFromPrepaymentsThisMonth;
    }

    if (totalPrincipalPaidThisMonth > openingBalanceForInterestCalc) { 
        totalPrincipalPaidThisMonth = openingBalanceForInterestCalc;
    }
    if (totalPrincipalPaidThisMonth < 0) totalPrincipalPaidThisMonth = 0;
    
    let closingBalance = openingBalance - principalPaidFromEMIThisMonth; 

    if (closingBalance < 0 && openingBalanceForInterestCalc > 0) {
        totalPrincipalPaidThisMonth = openingBalanceForInterestCalc; 
        closingBalance = 0;
        actualCashOutflowThisMonth = totalPrincipalPaidThisMonth + interestPaidThisMonth;
    }
    
    if (interestPaidThisMonth < 0) interestPaidThisMonth = 0;

    schedule.push({
      monthNumber,
      paymentDate: paymentPeriodEndDate.toISOString().split('T')[0], 
      openingBalance: parseFloat(openingBalanceForInterestCalc.toFixed(2)), 
      emi: parseFloat(actualCashOutflowThisMonth.toFixed(2)), 
      principalPaid: parseFloat(totalPrincipalPaidThisMonth.toFixed(2)),
      interestPaid: parseFloat(interestPaidThisMonth.toFixed(2)), 
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      isPreEMIPeriod: isPreEmiPeriodCurrentMonth, 
      ...(disbursementsThisMonth.length > 0 && { disbursements: disbursementsThisMonth }),
      ...(prepaymentsThisMonth.length > 0 && { prepayments: prepaymentsThisMonth }),
      ...(roiChangesThisMonth.length > 0 && { roiChanges: roiChangesThisMonth }),
      ...(emiChangesThisMonth.length > 0 && { emiChanges: emiChangesThisMonth }),
    });

    openingBalance = closingBalance; 
    if (openingBalance <= 0.01) break;
  }

  return schedule;
};

// ... (rest of the summary functions remain unchanged for this step) ...

const DEFAULT_PRINCIPAL_DEDUCTION_LIMIT = 150000;
const DEFAULT_INTEREST_DEDUCTION_LIMIT = 200000;

export const generateAnnualSummaries = (
    schedule: AmortizationEntry[], 
    loanDetails: LoanDetails, 
    fyStartMonth: number = 3 
): AnnualSummary[] => {
  if (!schedule || schedule.length === 0) return [];

  const principalLimit = loanDetails.principalDeductionLimit ?? DEFAULT_PRINCIPAL_DEDUCTION_LIMIT;
  const interestLimit = loanDetails.interestDeductionLimit ?? DEFAULT_INTEREST_DEDUCTION_LIMIT;
  const isEligible = loanDetails.isTaxDeductible ?? false; 

  const summariesByFY: { [fyKey: string]: AnnualSummary } = {};

  schedule.forEach(entry => {
    const entryDate = new Date(entry.paymentDate);
    const year = entryDate.getFullYear();
    const month = entryDate.getMonth(); 

    let financialYearStart = year;
    if (month < fyStartMonth) {
        financialYearStart = year - 1; 
    }
    const fyLabel = `FY ${financialYearStart}-${(financialYearStart + 1).toString().slice(-2)}`;

    if (!summariesByFY[fyLabel]) {
      summariesByFY[fyLabel] = {
        yearLabel: fyLabel, 
        startYear: financialYearStart, 
        totalPrincipalPaid: 0,
        totalInterestPaid: 0, 
        totalPreEMIInterestPaid: 0, 
        totalPrepaymentsMade: 0, 
        totalPayment: 0,
        deductiblePrincipal: 0, 
        deductibleInterest: 0,
      };
    }
    summariesByFY[fyLabel].totalPrincipalPaid += entry.principalPaid;
    if (entry.isPreEMIPeriod) {
        summariesByFY[fyLabel].totalPreEMIInterestPaid += entry.interestPaid;
    } else {
        summariesByFY[fyLabel].totalInterestPaid += entry.interestPaid;
    }
    if (entry.prepayments) { 
        entry.prepayments.forEach(p => {
            summariesByFY[fyLabel].totalPrepaymentsMade += p.amount;
        });
    }
    summariesByFY[fyLabel].totalPayment += entry.emi; 
  });

  Object.keys(summariesByFY).forEach(fyLabel => {
      const summary = summariesByFY[fyLabel];
      if (isEligible) {
          summary.deductiblePrincipal = Math.min(summary.totalPrincipalPaid, principalLimit);
          const totalInterestForDeduction = summary.totalInterestPaid + summary.totalPreEMIInterestPaid;
          summary.deductibleInterest = Math.min(totalInterestForDeduction, interestLimit);
      } else {
          summary.deductiblePrincipal = 0;
          summary.deductibleInterest = 0;
      }
      summary.totalPrincipalPaid = parseFloat(summary.totalPrincipalPaid.toFixed(2));
      summary.totalInterestPaid = parseFloat(summary.totalInterestPaid.toFixed(2));
      summary.totalPreEMIInterestPaid = parseFloat(summary.totalPreEMIInterestPaid.toFixed(2));
      summary.totalPrepaymentsMade = parseFloat(summary.totalPrepaymentsMade.toFixed(2));
      summary.totalPayment = parseFloat(summary.totalPayment.toFixed(2));
      summary.deductiblePrincipal = parseFloat(summary.deductiblePrincipal.toFixed(2));
      summary.deductibleInterest = parseFloat(summary.deductibleInterest.toFixed(2));
  });

  return Object.values(summariesByFY).sort((a, b) => a.startYear - b.startYear); 
};

export const generateLifespanSummary = (
    schedule: AmortizationEntry[], 
    annualSummaries: AnnualSummary[] 
): LifespanSummary | null => {
  if (!schedule || schedule.length === 0) return null;

  const summary: LifespanSummary = {
    totalPrincipalPaid: 0,
    totalInterestPaid: 0, 
    totalPreEMIInterestPaid: 0, 
    totalPayment: 0,
    actualTenureMonths: schedule.length,
    totalDeductiblePrincipal: 0, 
    totalDeductibleInterest: 0, 
  };

  schedule.forEach(entry => {
    summary.totalPrincipalPaid += entry.principalPaid;
    if (entry.isPreEMIPeriod) {
        summary.totalPreEMIInterestPaid += entry.interestPaid;
    } else {
        summary.totalInterestPaid += entry.interestPaid;
    }
    summary.totalPayment += entry.emi; 
  });

  annualSummaries.forEach(annual => {
      summary.totalDeductiblePrincipal += annual.deductiblePrincipal;
      summary.totalDeductibleInterest += annual.deductibleInterest; 
  });
  
  summary.totalPrincipalPaid = parseFloat(summary.totalPrincipalPaid.toFixed(2));
  summary.totalInterestPaid = parseFloat(summary.totalInterestPaid.toFixed(2));
  summary.totalPreEMIInterestPaid = parseFloat(summary.totalPreEMIInterestPaid.toFixed(2));
  summary.totalPayment = parseFloat(summary.totalPayment.toFixed(2));
  summary.totalDeductiblePrincipal = parseFloat(summary.totalDeductiblePrincipal.toFixed(2));
  summary.totalDeductibleInterest = parseFloat(summary.totalDeductibleInterest.toFixed(2));

  return summary;
};

export const generateSummaryToDate = (
    schedule: AmortizationEntry[],
    loanDetails: LoanDetails, 
    fyStartMonth: number = 3 
): CurrentSummary | null => {
    if (!schedule || schedule.length === 0) return null;

    const isEligible = loanDetails.isTaxDeductible ?? false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); 

    let monthsElapsed = 0;
    let uncappedRegPrincipal = 0; 
    let uncappedRegInterest = 0;  
    let uncappedPreEMIInterest = 0; 
    let totalPaymentToDate = 0;
    let cumulativeDeductiblePrincipal = 0;
    let cumulativeDeductibleInterest = 0;
    let currentOutstandingBalance = schedule[0].openingBalance; 

    let currentMonthIndex = -1;
    for(let i = 0; i < schedule.length; i++) {
        const entryDate = new Date(schedule[i].paymentDate);
        if (entryDate.getFullYear() > currentYear || (entryDate.getFullYear() === currentYear && entryDate.getMonth() > currentMonth)) {
            break; 
        }
        currentMonthIndex = i;
        currentOutstandingBalance = schedule[i].closingBalance; 
    }
    
    if (currentMonthIndex === -1) {
         const firstEntryDate = new Date(schedule[0].paymentDate);
         if (firstEntryDate > now) {
             return {
                 monthsElapsed: 0, 
                 totalPrincipalPaid: 0, 
                 totalInterestPaid: 0,  
                 totalPreEMIInterestPaid: 0, 
                 totalPayment: 0,
                 totalDeductiblePrincipal: 0, 
                 totalDeductibleInterest: 0, 
                 currentOutstandingBalance: schedule[0].openingBalance,
                 uncappedTotalPrincipalPaid: 0, 
                 uncappedTotalInterestPaid: 0,
             };
         }
         currentMonthIndex = schedule.length - 1;
         currentOutstandingBalance = schedule[currentMonthIndex].closingBalance;
    }

    monthsElapsed = currentMonthIndex + 1;
    const currentScheduleSlice = schedule.slice(0, monthsElapsed);

    currentScheduleSlice.forEach(entry => {
        uncappedRegPrincipal += entry.principalPaid; 
        if (entry.isPreEMIPeriod) {
            uncappedPreEMIInterest += entry.interestPaid;
        } else {
            uncappedRegInterest += entry.interestPaid;   
        }
        totalPaymentToDate += entry.emi;
    });

    if (isEligible) {
        const annualSummariesToDate = generateAnnualSummaries(currentScheduleSlice, loanDetails, fyStartMonth); 
        annualSummariesToDate.forEach(annual => {
            cumulativeDeductiblePrincipal += annual.deductiblePrincipal; 
            cumulativeDeductibleInterest += annual.deductibleInterest;
        });
    }

    return {
        monthsElapsed,
        totalPrincipalPaid: parseFloat(uncappedRegPrincipal.toFixed(2)), 
        totalInterestPaid: parseFloat(uncappedRegInterest.toFixed(2)),  
        totalPreEMIInterestPaid: parseFloat(uncappedPreEMIInterest.toFixed(2)), 
        totalPayment: parseFloat(totalPaymentToDate.toFixed(2)),
        totalDeductiblePrincipal: parseFloat(cumulativeDeductiblePrincipal.toFixed(2)), 
        totalDeductibleInterest: parseFloat(cumulativeDeductibleInterest.toFixed(2)), 
        currentOutstandingBalance: parseFloat(currentOutstandingBalance.toFixed(2)),
        uncappedTotalPrincipalPaid: parseFloat(uncappedRegPrincipal.toFixed(2)), 
        uncappedTotalInterestPaid: parseFloat(uncappedRegInterest.toFixed(2)), 
    };
};
