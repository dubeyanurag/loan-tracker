// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange, Disbursement, CurrentSummary, AnnualSummary, LifespanSummary } from '../types'; // Add LifespanSummary
import { calculateEMI } from './loanCalculations'; 

// Define a union type for all possible events with a consistent structure
type LoanEvent = 
  | (Omit<Payment, 'date'> & { eventType: 'payment'; date: Date })
  | (Omit<InterestRateChange, 'date'> & { eventType: 'roiChange'; date: Date })
  | (Omit<CustomEMIChange, 'date'> & { eventType: 'emiChange'; date: Date });

// Removed unused EffectiveLoanParams interface

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

  while (openingBalance > 0.01 && monthNumber < 600) {
    monthNumber++;
    const monthlyInterestRate = currentAnnualRate / 12 / 100;
    let interestForMonth = openingBalance * monthlyInterestRate;
    let principalPaidThisMonth = currentEMI - interestForMonth;
    let actualPaymentMade = currentEMI; 
    let disbursementsThisMonth: AmortizationEntry['disbursements'] = [];
    let prepaymentsThisMonth: AmortizationEntry['prepayments'] = [];
    let roiChangesThisMonth: AmortizationEntry['roiChanges'] = [];
    let emiChangesThisMonth: AmortizationEntry['emiChanges'] = [];

    let isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate;

    while(eventPointer < allEvents.length && allEvents[eventPointer].date <= currentDate) {
        const event = allEvents[eventPointer];

        if (event.eventType === 'disbursement') {
            openingBalance += event.amount; 
            cumulativeDisbursed += event.amount;
            const remainingMonths = currentTenureMonths - monthNumber; 
            currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonths > 0 ? remainingMonths : 1);
            disbursementsThisMonth.push({ id: event.id, amount: event.amount }); 
        } else if (event.eventType === 'payment') {
            actualPaymentMade = event.amount; 
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; 
                interestForMonth = openingBalance * monthlyInterestRate;
                prepaymentsThisMonth.push({ id: event.id, amount: event.amount }); 
            }
            principalPaidThisMonth = actualPaymentMade - interestForMonth;
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            const remainingMonths = currentTenureMonths - (monthNumber -1); 
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonths > 0 ? remainingMonths : 1); 
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) { 
                currentEMI = event.newEMIIfApplicable;
            }
            roiChangesThisMonth.push({ id: event.id, newRate: event.newRate, preference: event.adjustmentPreference }); 
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            emiChangesThisMonth.push({ id: event.id, newEMI: event.newEMI }); 
        }
        eventPointer++;
        isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate; 
    }

    if (isPreEmiPeriod) {
        principalPaidThisMonth = 0; 
        actualPaymentMade = interestForMonth; 
    } else {
         principalPaidThisMonth = actualPaymentMade - interestForMonth;
         if (principalPaidThisMonth < 0) principalPaidThisMonth = 0; 
    }

    if (principalPaidThisMonth > openingBalance) {
      principalPaidThisMonth = openingBalance;
      actualPaymentMade = principalPaidThisMonth + interestForMonth; 
    }
    if (openingBalance - principalPaidThisMonth < 0.01 && openingBalance > 0) { 
        principalPaidThisMonth = openingBalance;
        actualPaymentMade = principalPaidThisMonth + interestForMonth;
        interestForMonth = actualPaymentMade - principalPaidThisMonth; 
    }

    const closingBalance = openingBalance - principalPaidThisMonth;

    schedule.push({
      monthNumber,
      paymentDate: currentDate.toISOString().split('T')[0], 
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      emi: parseFloat(actualPaymentMade.toFixed(2)),
      principalPaid: parseFloat(principalPaidThisMonth.toFixed(2)),
      interestPaid: parseFloat(interestForMonth.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      ...(disbursementsThisMonth.length > 0 && { disbursements: disbursementsThisMonth }),
      ...(prepaymentsThisMonth.length > 0 && { prepayments: prepaymentsThisMonth }),
      ...(roiChangesThisMonth.length > 0 && { roiChanges: roiChangesThisMonth }),
      ...(emiChangesThisMonth.length > 0 && { emiChanges: emiChangesThisMonth }),
    });

    openingBalance = closingBalance;
    
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (openingBalance <= 0.01) break; 
  }

  return schedule;
};

// --- Summary Calculation Functions ---

const PRINCIPAL_DEDUCTION_LIMIT = 150000;
const INTEREST_DEDUCTION_LIMIT = 200000;

// Ensure LifespanSummary is imported from types
export const generateAnnualSummaries = (
    schedule: AmortizationEntry[], 
    fyStartMonth: number = 3 // Default to April (month index 3)
): AnnualSummary[] => {
  if (!schedule || schedule.length === 0) return [];

  const summariesByFY: { [fyLabel: string]: Omit<AnnualSummary, 'yearLabel' | 'startYear'> & { startYear: number } } = {}; 

  schedule.forEach(entry => {
    const entryDate = new Date(entry.paymentDate);
    const year = entryDate.getFullYear();
    const month = entryDate.getMonth(); // 0-11

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
        deductiblePrincipal: 0, // Initialize tax fields
        deductibleInterest: 0,
      };
    }
    summariesByFY[fyLabel].totalPrincipalPaid += entry.principalPaid;
    summariesByFY[fyLabel].totalInterestPaid += entry.interestPaid;
    summariesByFY[fyLabel].totalPayment += entry.emi; 
  });

  // Calculate deductible amounts after summing up totals for the year
  Object.keys(summariesByFY).forEach(fyLabel => {
      const summary = summariesByFY[fyLabel];
      summary.deductiblePrincipal = Math.min(summary.totalPrincipalPaid, PRINCIPAL_DEDUCTION_LIMIT);
      summary.deductibleInterest = Math.min(summary.totalInterestPaid, INTEREST_DEDUCTION_LIMIT);
  });


  return Object.values(summariesByFY)
    .map(summary => ({
        ...summary,
        yearLabel: `FY ${summary.startYear}-${(summary.startYear + 1).toString().slice(-2)}`, // Add label back
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
    annualSummaries: AnnualSummary[] // Pass calculated annual summaries
): LifespanSummary | null => {
  if (!schedule || schedule.length === 0) return null;

  const summary: LifespanSummary = {
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalPayment: 0,
    actualTenureMonths: schedule.length,
    totalDeductiblePrincipal: 0, // Initialize
    totalDeductibleInterest: 0, // Initialize
  };

  schedule.forEach(entry => {
    summary.totalPrincipalPaid += entry.principalPaid;
    summary.totalInterestPaid += entry.interestPaid;
    summary.totalPayment += entry.emi; 
  });

  // Sum up deductible amounts from annual summaries
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
// Ensure CurrentSummary is imported from types
export const generateSummaryToDate = (
    schedule: AmortizationEntry[],
    annualSummaries: AnnualSummary[], // Need annual summaries to get deductible amounts
    fyStartMonth: number = 3 // Need fyStartMonth as well
): CurrentSummary | null => {
    if (!schedule || schedule.length === 0) return null;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let monthsElapsed = 0;
    let totalPrincipalPaid = 0;
    let totalInterestPaid = 0;
    let totalPayment = 0;
    let totalDeductiblePrincipal = 0;
    let totalDeductibleInterest = 0;
    let currentOutstandingBalance = schedule[0].openingBalance; // Start with initial balance

    // Find the index of the current month in the schedule
    let currentMonthIndex = -1;
    for(let i = 0; i < schedule.length; i++) {
        const entryDate = new Date(schedule[i].paymentDate);
        if (entryDate.getFullYear() > currentYear || (entryDate.getFullYear() === currentYear && entryDate.getMonth() > currentMonth)) {
            break; // Stop if we've passed the current month
        }
        currentMonthIndex = i;
        currentOutstandingBalance = schedule[i].closingBalance; // Update balance
    }
    
    // If current date is before the first payment date
    if (currentMonthIndex === -1) {
         const firstEntryDate = new Date(schedule[0].paymentDate);
         if (firstEntryDate > now) {
             return {
                 monthsElapsed: 0, totalPrincipalPaid: 0, totalInterestPaid: 0, totalPayment: 0,
                 totalDeductiblePrincipal: 0, totalDeductibleInterest: 0, 
                 currentOutstandingBalance: schedule[0].openingBalance // Show initial balance
             };
         }
         // If current date is somehow before first payment but not caught above, assume last entry? Or 0?
         // Let's default to last entry if loop didn't find current month but schedule exists
         currentMonthIndex = schedule.length - 1;
         currentOutstandingBalance = schedule[currentMonthIndex].closingBalance;

    }

    monthsElapsed = currentMonthIndex + 1;

    // Sum totals up to the current month index
    for (let i = 0; i <= currentMonthIndex; i++) {
        totalPrincipalPaid += schedule[i].principalPaid;
        totalInterestPaid += schedule[i].interestPaid;
        totalPayment += schedule[i].emi;
    }

    // Sum deductible amounts from relevant annual summaries
    annualSummaries.forEach(annual => {
        if (annual.startYear < currentYear) {
            // Include full deductible for past financial years
            totalDeductiblePrincipal += annual.deductiblePrincipal;
            totalDeductibleInterest += annual.deductibleInterest;
        } else if (annual.startYear === currentYear) {
            // For the current FY, calculate deductible amounts *up to the current month*
            // This requires recalculating based on payments *within* this FY *up to now*
            // Simpler approach: Use the already calculated annual deductible as an estimate for the ongoing year
            // More accurate: Recalculate based on schedule entries <= current date within this FY
            let principalThisFYtoDate = 0;
            let interestThisFYtoDate = 0;
            for(let i = 0; i <= currentMonthIndex; i++) {
                 const entryDate = new Date(schedule[i].paymentDate);
                 // Use the passed fyStartMonth
                 let entryFYStartYear = entryDate.getFullYear();
                 if (entryDate.getMonth() < fyStartMonth) entryFYStartYear--;

                 if (entryFYStartYear === currentYear) { // Compare with currentYear from this function scope
                     principalThisFYtoDate += schedule[i].principalPaid;
                     interestThisFYtoDate += schedule[i].interestPaid;
                 }
            }
             totalDeductiblePrincipal += Math.min(principalThisFYtoDate, PRINCIPAL_DEDUCTION_LIMIT);
             totalDeductibleInterest += Math.min(interestThisFYtoDate, INTEREST_DEDUCTION_LIMIT);
        }
        // Ignore future financial years
    });


    return {
        monthsElapsed,
        totalPrincipalPaid: parseFloat(totalPrincipalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(totalInterestPaid.toFixed(2)),
        totalPayment: parseFloat(totalPayment.toFixed(2)),
        totalDeductiblePrincipal: parseFloat(totalDeductiblePrincipal.toFixed(2)),
        totalDeductibleInterest: parseFloat(totalDeductibleInterest.toFixed(2)),
        currentOutstandingBalance: parseFloat(currentOutstandingBalance.toFixed(2)),
    };
};
