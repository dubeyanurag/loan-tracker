// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange, Disbursement, CurrentSummary, AnnualSummary, LifespanSummary, LoanDetails } from '../types'; 
import { calculateEMI } from './loanCalculations'; 

type LoanEvent = 
  | (Omit<Payment, 'date'> & { eventType: 'payment'; date: Date })
  | (Omit<InterestRateChange, 'date'> & { eventType: 'roiChange'; date: Date })
  | (Omit<CustomEMIChange, 'date'> & { eventType: 'emiChange'; date: Date });

export const generateAmortizationSchedule = (loan: Loan): AmortizationEntry[] => {
  const schedule: AmortizationEntry[] = [];
  if (!loan || !loan.details || !loan.details.disbursements || loan.details.disbursements.length === 0) return schedule;

  const sortedDisbursements = [...loan.details.disbursements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let monthNumber = 0;
  let openingBalance = sortedDisbursements[0].amount; 
  let cumulativeDisbursed = sortedDisbursements[0].amount; // Tracks total disbursed up to the start of current month processing
  let currentAnnualRate = loan.details.originalInterestRate;
  let currentTenureMonths = loan.details.originalTenureMonths; // This might need to be dynamic if tenure changes
  let currentEMI = calculateEMI(cumulativeDisbursed, currentAnnualRate, currentTenureMonths); 
  
  const allEvents: (LoanEvent | (Omit<Disbursement, 'date'> & { eventType: 'disbursement'; date: Date }))[] = [
    ...(loan.paymentHistory || []).map(p => ({ ...p, eventType: 'payment' as const, date: new Date(p.date) })),
    ...(loan.interestRateChanges || []).map(c => ({ ...c, eventType: 'roiChange' as const, date: new Date(c.date) })),
    ...(loan.customEMIChanges || []).map(c => ({ ...c, eventType: 'emiChange' as const, date: new Date(c.date) })),
    ...sortedDisbursements.slice(1).map(d => ({ ...d, eventType: 'disbursement' as const, date: new Date(d.date) })) 
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let eventPointer = 0;
  let currentDate = new Date(sortedDisbursements[0].date); 
  const emiStartDate = loan.details.emiStartDate ? new Date(loan.details.emiStartDate) : currentDate; 

  while (openingBalance > 0.01 && monthNumber < 600) { // Max 50 years
    monthNumber++;
    const monthlyInterestRate = currentAnnualRate / 12 / 100;
    
    let interestForMonthAccrued = openingBalance * monthlyInterestRate;
    
    let principalPaidFromEMIThisMonth = 0;
    let principalPaidFromPrepaymentsThisMonth = 0;
    let interestPaidThisMonth = 0;
    
    let effectiveEMIForMonth = currentEMI; // Start with the EMI from previous month or initial calculation
    let isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate;
    let manualPaymentAmount: number | null = null; // To track if a manual 'EMI' type payment was logged

    // Store event details for the entry
    let disbursementsThisMonth: AmortizationEntry['disbursements'] = [];
    let prepaymentsThisMonth: AmortizationEntry['prepayments'] = [];
    let roiChangesThisMonth: AmortizationEntry['roiChanges'] = [];
    let emiChangesThisMonth: AmortizationEntry['emiChanges'] = [];
    
    // Buffer for opening balance before events of this month modify it for interest calculation
    let openingBalanceForInterestCalc = openingBalance;

    // Process events that fall within this month
    while(eventPointer < allEvents.length && allEvents[eventPointer].date <= currentDate) {
        const event = allEvents[eventPointer];
        
        if (event.eventType === 'disbursement') {
            openingBalance += event.amount; 
            cumulativeDisbursed += event.amount; // This cumulative is fine for tracking total disbursed
            // Recalculate EMI based on new total opening balance for future payments
            const remainingMonthsForEmiCalc = currentTenureMonths - monthNumber; 
            currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1);
            effectiveEMIForMonth = currentEMI; // Update effective EMI for the current month if disbursement happens
            disbursementsThisMonth.push({ id: event.id, amount: event.amount }); 
        } else if (event.eventType === 'payment') {
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; 
                principalPaidFromPrepaymentsThisMonth += event.amount; 
                prepaymentsThisMonth.push({ id: event.id, amount: event.amount }); 
            } else { // 'EMI' type payment logged manually
                manualPaymentAmount = event.amount;
            }
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            // Recalculate interest for *this* month if rate changes mid-month and affects it
            interestForMonthAccrued = openingBalanceForInterestCalc * (currentAnnualRate / 12 / 100); // Recalculate with new rate on original opening balance
            
            const remainingMonthsForEmiCalc = currentTenureMonths - (monthNumber -1); 
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1); 
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) { 
                currentEMI = event.newEMIIfApplicable;
            }
            // If 'adjustTenure', currentEMI remains.
            effectiveEMIForMonth = currentEMI; // Update effective EMI for the current month
            roiChangesThisMonth.push({ id: event.id, newRate: event.newRate, preference: event.adjustmentPreference }); 
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            effectiveEMIForMonth = currentEMI; // Update effective EMI for the current month
            emiChangesThisMonth.push({ id: event.id, newEMI: event.newEMI }); 
        }
        eventPointer++;
    }
    
    // Determine actual payment and its components for the month
    let actualCashOutflowThisMonth = 0;
    isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate; // Final check for PreEMI

    if (manualPaymentAmount !== null) {
        actualCashOutflowThisMonth = manualPaymentAmount;
        if (isPreEmiPeriod) {
            interestPaidThisMonth = Math.min(manualPaymentAmount, interestForMonthAccrued);
            principalPaidFromEMIThisMonth = 0; // No principal from EMI in PreEMI
        } else {
            interestPaidThisMonth = Math.min(interestForMonthAccrued, manualPaymentAmount);
            principalPaidFromEMIThisMonth = manualPaymentAmount - interestPaidThisMonth;
        }
    } else { // No manual payment, use scheduled/effective EMI
        actualCashOutflowThisMonth = effectiveEMIForMonth;
        if (isPreEmiPeriod) {
            interestPaidThisMonth = interestForMonthAccrued; // Payment is only interest
            principalPaidFromEMIThisMonth = 0;
            actualCashOutflowThisMonth = interestForMonthAccrued; // Actual outflow is just interest
        } else {
            interestPaidThisMonth = Math.min(interestForMonthAccrued, effectiveEMIForMonth);
            principalPaidFromEMIThisMonth = effectiveEMIForMonth - interestPaidThisMonth;
        }
    }
    
    // Add prepayments to total principal paid and cash outflow
    let totalPrincipalPaidThisMonth = principalPaidFromEMIThisMonth + principalPaidFromPrepaymentsThisMonth;
    actualCashOutflowThisMonth += principalPaidFromPrepaymentsThisMonth; // Add prepayments to total outflow if not already part of manualPaymentAmount logic

    // Ensure principal paid doesn't exceed opening balance (before prepayments were subtracted)
    if (totalPrincipalPaidThisMonth > openingBalanceForInterestCalc) { // Compare against balance before prepayments for this month
        totalPrincipalPaidThisMonth = openingBalanceForInterestCalc;
    }
    if (totalPrincipalPaidThisMonth < 0) totalPrincipalPaidThisMonth = 0;
    
    // Final closing balance
    // Opening balance for this month already reflects prepayments if they occurred.
    // So, closing balance is openingBalance (after prepayments) - principalPaidFromEMIThisMonth
    let closingBalance = openingBalance - principalPaidFromEMIThisMonth; 

    // Adjust for final payment if it overpays
    if (closingBalance < 0 && openingBalanceForInterestCalc > 0) {
        totalPrincipalPaidThisMonth = openingBalanceForInterestCalc; // Total principal paid is the entire opening balance
        closingBalance = 0;
        // Recalculate cash outflow if principal was capped to exact balance
        // Interest paid remains interestForMonthAccrued
        actualCashOutflowThisMonth = totalPrincipalPaidThisMonth + interestPaidThisMonth;
    }
    
    // Ensure interest is not negative
    if (interestPaidThisMonth < 0) interestPaidThisMonth = 0;


    schedule.push({
      monthNumber,
      paymentDate: currentDate.toISOString().split('T')[0], 
      openingBalance: parseFloat(openingBalanceForInterestCalc.toFixed(2)), // Show balance at start of month before events
      emi: parseFloat(actualCashOutflowThisMonth.toFixed(2)), 
      principalPaid: parseFloat(totalPrincipalPaidThisMonth.toFixed(2)),
      interestPaid: parseFloat(interestPaidThisMonth.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      ...(disbursementsThisMonth.length > 0 && { disbursements: disbursementsThisMonth }),
      ...(prepaymentsThisMonth.length > 0 && { prepayments: prepaymentsThisMonth }),
      ...(roiChangesThisMonth.length > 0 && { roiChanges: roiChangesThisMonth }),
      ...(emiChangesThisMonth.length > 0 && { emiChanges: emiChangesThisMonth }),
    });

    openingBalance = closingBalance; // This is the true opening balance for the next period
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (openingBalance <= 0.01 && monthNumber >= currentTenureMonths && prepaymentsThisMonth.length === 0) {
        // If balance is near zero, and we are at or past original tenure, and no prepayments this month, likely done.
        // This condition might need refinement to prevent premature exit if EMI is very low.
        // The primary exit is openingBalance <= 0.01
    }
    if (openingBalance <= 0.01) break;
  }

  return schedule;
};

// --- Summary Calculation Functions ---

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

  const summariesByFY: { [fyLabel: string]: Omit<AnnualSummary, 'yearLabel' | 'startYear'> & { startYear: number } } = {}; 

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
        startYear: financialYearStart, 
        totalPrincipalPaid: 0,
        totalInterestPaid: 0,
        totalPayment: 0,
        deductiblePrincipal: 0, 
        deductibleInterest: 0,
      };
    }
    summariesByFY[fyLabel].totalPrincipalPaid += entry.principalPaid;
    summariesByFY[fyLabel].totalInterestPaid += entry.interestPaid;
    summariesByFY[fyLabel].totalPayment += entry.emi; 
  });

  Object.keys(summariesByFY).forEach(fyLabel => {
      const summary = summariesByFY[fyLabel];
      if (isEligible) {
          summary.deductiblePrincipal = Math.min(summary.totalPrincipalPaid, principalLimit);
          summary.deductibleInterest = Math.min(summary.totalInterestPaid, interestLimit);
      } else {
          summary.deductiblePrincipal = 0;
          summary.deductibleInterest = 0;
      }
  });

  return Object.values(summariesByFY)
    .map(summary => ({
        ...summary,
        yearLabel: `FY ${summary.startYear}-${(summary.startYear + 1).toString().slice(-2)}`, 
        totalPrincipalPaid: parseFloat(summary.totalPrincipalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(summary.totalInterestPaid.toFixed(2)),
        totalPayment: parseFloat(summary.totalPayment.toFixed(2)),
        deductiblePrincipal: parseFloat(summary.deductiblePrincipal.toFixed(2)),
        deductibleInterest: parseFloat(summary.deductibleInterest.toFixed(2)),
    }))
    .sort((a, b) => a.startYear - b.startYear); 
};

export const generateLifespanSummary = (
    schedule: AmortizationEntry[], 
    annualSummaries: AnnualSummary[] 
): LifespanSummary | null => {
  if (!schedule || schedule.length === 0) return null;

  const summary: LifespanSummary = {
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalPayment: 0,
    actualTenureMonths: schedule.length,
    totalDeductiblePrincipal: 0, 
    totalDeductibleInterest: 0, 
  };

  schedule.forEach(entry => {
    summary.totalPrincipalPaid += entry.principalPaid;
    summary.totalInterestPaid += entry.interestPaid;
    summary.totalPayment += entry.emi; 
  });

  annualSummaries.forEach(annual => {
      summary.totalDeductiblePrincipal += annual.deductiblePrincipal;
      summary.totalDeductibleInterest += annual.deductibleInterest;
  });
  
  summary.totalPrincipalPaid = parseFloat(summary.totalPrincipalPaid.toFixed(2));
  summary.totalInterestPaid = parseFloat(summary.totalInterestPaid.toFixed(2));
  summary.totalPayment = parseFloat(summary.totalPayment.toFixed(2));
  summary.totalDeductiblePrincipal = parseFloat(summary.totalDeductiblePrincipal.toFixed(2));
  summary.totalDeductibleInterest = parseFloat(summary.totalDeductibleInterest.toFixed(2));

  return summary;
};

// --- Generate Summary To Date ---
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
    let uncappedTotalPrincipalPaid = 0; 
    let uncappedTotalInterestPaid = 0;  
    let totalPayment = 0;
    let totalDeductiblePrincipal = 0;
    let totalDeductibleInterest = 0;
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
                 totalPayment: 0,
                 totalDeductiblePrincipal: 0, 
                 totalDeductibleInterest: 0, 
                 currentOutstandingBalance: schedule[0].openingBalance,
                 uncappedTotalPrincipalPaid: 0, 
                 uncappedTotalInterestPaid: 0   
             };
         }
         currentMonthIndex = schedule.length - 1;
         currentOutstandingBalance = schedule[currentMonthIndex].closingBalance;
    }

    monthsElapsed = currentMonthIndex + 1;

    const currentScheduleSlice = schedule.slice(0, monthsElapsed);
    currentScheduleSlice.forEach(entry => {
        uncappedTotalPrincipalPaid += entry.principalPaid; 
        uncappedTotalInterestPaid += entry.interestPaid;   
        totalPayment += entry.emi;
    });

    if (isEligible) {
        const annualSummariesToDate = generateAnnualSummaries(currentScheduleSlice, loanDetails, fyStartMonth); 
        annualSummariesToDate.forEach(annual => {
            totalDeductiblePrincipal += annual.deductiblePrincipal; 
            totalDeductibleInterest += annual.deductibleInterest;
        });
    }

    return {
        monthsElapsed,
        totalPrincipalPaid: parseFloat(uncappedTotalPrincipalPaid.toFixed(2)), 
        totalInterestPaid: parseFloat(uncappedTotalInterestPaid.toFixed(2)),  
        totalPayment: parseFloat(totalPayment.toFixed(2)),
        totalDeductiblePrincipal: parseFloat(totalDeductiblePrincipal.toFixed(2)), 
        totalDeductibleInterest: parseFloat(totalDeductibleInterest.toFixed(2)), 
        currentOutstandingBalance: parseFloat(currentOutstandingBalance.toFixed(2)),
        uncappedTotalPrincipalPaid: parseFloat(uncappedTotalPrincipalPaid.toFixed(2)), 
        uncappedTotalInterestPaid: parseFloat(uncappedTotalInterestPaid.toFixed(2)),
    };
};
