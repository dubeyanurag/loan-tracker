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
  let cumulativeDisbursed = sortedDisbursements[0].amount;
  let currentAnnualRate = loan.details.originalInterestRate;
  let currentTenureMonths = loan.details.originalTenureMonths;
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
    
    // Calculate interest for the month based on the opening balance *before* any events of this month
    let interestForMonthAccrued = openingBalance * monthlyInterestRate;
    
    let principalPaidThisMonth = 0;
    let interestPaidThisMonth = 0; // Will be set based on EMI type
    let totalCashOutflowThisMonth = 0;
    
    let scheduledEMIForMonth = currentEMI; // EMI that was scheduled at the start of the month
    let isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate;

    if (isPreEmiPeriod) {
        scheduledEMIForMonth = interestForMonthAccrued; // In Pre-EMI, "scheduled" payment is just the interest
        interestPaidThisMonth = interestForMonthAccrued;
        principalPaidThisMonth = 0;
    } else {
        interestPaidThisMonth = Math.min(interestForMonthAccrued, scheduledEMIForMonth);
        principalPaidThisMonth = scheduledEMIForMonth - interestPaidThisMonth;
        if (principalPaidThisMonth < 0) principalPaidThisMonth = 0;
    }
    totalCashOutflowThisMonth = scheduledEMIForMonth;

    // Store event details for the entry
    let disbursementsThisMonth: AmortizationEntry['disbursements'] = [];
    let prepaymentsThisMonth: AmortizationEntry['prepayments'] = [];
    let roiChangesThisMonth: AmortizationEntry['roiChanges'] = [];
    let emiChangesThisMonth: AmortizationEntry['emiChanges'] = [];

    // Process events that fall within this month
    while(eventPointer < allEvents.length && allEvents[eventPointer].date <= currentDate) {
        const event = allEvents[eventPointer];
        isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate; // Re-check in case EMI start date is this month

        if (event.eventType === 'disbursement') {
            openingBalance += event.amount; 
            cumulativeDisbursed += event.amount;
            // Recalculate EMI if tenure/rate implies it (or keep as is if user wants fixed EMI)
            // For simplicity, let's assume EMI recalculates based on remaining tenure for new balance
            const remainingMonthsForEmiCalc = currentTenureMonths - monthNumber; // Or a more sophisticated remaining tenure calc
            currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1);
            scheduledEMIForMonth = currentEMI; // Update scheduled EMI for *future* months
            disbursementsThisMonth.push({ id: event.id, amount: event.amount }); 
        } else if (event.eventType === 'payment') {
            // This 'payment' event is a manual log, could be EMI or Prepayment
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; 
                principalPaidThisMonth += event.amount; // Prepayment directly reduces principal
                totalCashOutflowThisMonth += event.amount; // Add to total cash out
                prepaymentsThisMonth.push({ id: event.id, amount: event.amount }); 
            } else { // 'EMI' type payment logged manually - treat as the month's EMI
                totalCashOutflowThisMonth = event.amount; // This becomes the actual payment
                if (!isPreEmiPeriod) {
                    interestPaidThisMonth = Math.min(interestForMonthAccrued, event.amount);
                    principalPaidThisMonth = event.amount - interestPaidThisMonth;
                } else {
                    interestPaidThisMonth = event.amount; // Assume full payment is interest
                    principalPaidThisMonth = 0;
                }
            }
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            const remainingMonthsForEmiCalc = currentTenureMonths - (monthNumber -1); 
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonthsForEmiCalc > 0 ? remainingMonthsForEmiCalc : 1); 
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) { 
                currentEMI = event.newEMIIfApplicable;
            }
            // If 'adjustTenure', currentEMI remains, tenure will change implicitly by how long balance lasts
            scheduledEMIForMonth = currentEMI; // Update for future months
            roiChangesThisMonth.push({ id: event.id, newRate: event.newRate, preference: event.adjustmentPreference }); 
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            scheduledEMIForMonth = currentEMI; // Update for future months
            emiChangesThisMonth.push({ id: event.id, newEMI: event.newEMI }); 
        }
        eventPointer++;
    }
    
    // Final adjustments for the month based on calculated values
    if (isPreEmiPeriod && prepaymentsThisMonth.length === 0) { // If it's Pre-EMI and no prepayment, ensure principal is 0
        principalPaidThisMonth = 0;
        interestPaidThisMonth = interestForMonthAccrued; // Interest is the accrued amount
        totalCashOutflowThisMonth = interestForMonthAccrued; // Payment is just the interest
    }


    // Ensure principal paid doesn't exceed opening balance
    if (principalPaidThisMonth > openingBalance) {
      principalPaidThisMonth = openingBalance;
    }
    
    // If principal paid makes balance negative, adjust interest and total payment
    // This typically happens on the last EMI
    let closingBalance = openingBalance - principalPaidThisMonth;
    if (closingBalance < 0 && openingBalance > 0) { 
        principalPaidThisMonth = openingBalance; // Pay off remaining balance
        closingBalance = 0;
        if (!isPreEmiPeriod) { // For regular EMI, adjust interest if principal was capped
             totalCashOutflowThisMonth = principalPaidThisMonth + interestPaidThisMonth; // Interest already calculated
        } else { // For Pre-EMI, if a prepayment caused this, interest is still what accrued
            totalCashOutflowThisMonth = principalPaidThisMonth + interestForMonthAccrued;
            interestPaidThisMonth = interestForMonthAccrued;
        }
    }
    // Ensure interest is not negative if principal was capped
    if (interestPaidThisMonth < 0) interestPaidThisMonth = 0;


    schedule.push({
      monthNumber,
      paymentDate: currentDate.toISOString().split('T')[0], 
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      emi: parseFloat(totalCashOutflowThisMonth.toFixed(2)), // Total cash outflow for the month
      principalPaid: parseFloat(principalPaidThisMonth.toFixed(2)),
      interestPaid: parseFloat(interestPaidThisMonth.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      ...(disbursementsThisMonth.length > 0 && { disbursements: disbursementsThisMonth }),
      ...(prepaymentsThisMonth.length > 0 && { prepayments: prepaymentsThisMonth }),
      ...(roiChangesThisMonth.length > 0 && { roiChanges: roiChangesThisMonth }),
      ...(emiChangesThisMonth.length > 0 && { emiChanges: emiChangesThisMonth }),
    });

    openingBalance = closingBalance; // Update opening balance for next month
    
    currentDate.setMonth(currentDate.getMonth() + 1);
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

    // const principalLimit = loanDetails.principalDeductionLimit ?? DEFAULT_PRINCIPAL_DEDUCTION_LIMIT; // Unused here
    // const interestLimit = loanDetails.interestDeductionLimit ?? DEFAULT_INTEREST_DEDUCTION_LIMIT; // Unused here
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
