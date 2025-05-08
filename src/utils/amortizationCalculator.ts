// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange, Disbursement } from '../types'; 
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

export interface AnnualSummary {
  yearLabel: string; // Changed from year: number to yearLabel: string (e.g., "FY 2023-24")
  startYear: number; // Keep start year for sorting
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPayment: number;
}

export interface LifespanSummary {
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPayment: number;
  actualTenureMonths: number;
}

/**
 * Generates annual summaries based on a financial year start month.
 * @param schedule The amortization schedule.
 * @param fyStartMonth The start month of the financial year (0=Jan, 1=Feb, ..., 11=Dec). Default is 3 (April).
 * @returns An array of AnnualSummary objects.
 */
export const generateAnnualSummaries = (
    schedule: AmortizationEntry[], 
    fyStartMonth: number = 3 // Default to April (month index 3)
): AnnualSummary[] => {
  if (!schedule || schedule.length === 0) return [];

  const summariesByFY: { [fyLabel: string]: AnnualSummary } = {}; 

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
        yearLabel: fyLabel, // Use the label
        startYear: financialYearStart, // Store start year for sorting
        totalPrincipalPaid: 0,
        totalInterestPaid: 0,
        totalPayment: 0,
      };
    }
    summariesByFY[fyLabel].totalPrincipalPaid += entry.principalPaid;
    summariesByFY[fyLabel].totalInterestPaid += entry.interestPaid;
    summariesByFY[fyLabel].totalPayment += entry.emi; 
  });

  return Object.values(summariesByFY)
    .map(summary => ({
        ...summary,
        totalPrincipalPaid: parseFloat(summary.totalPrincipalPaid.toFixed(2)),
        totalInterestPaid: parseFloat(summary.totalInterestPaid.toFixed(2)),
        totalPayment: parseFloat(summary.totalPayment.toFixed(2)),
    }))
    .sort((a, b) => a.startYear - b.startYear); // Sort by start year
};

export const generateLifespanSummary = (schedule: AmortizationEntry[]): LifespanSummary | null => {
  if (!schedule || schedule.length === 0) return null;

  const summary: LifespanSummary = {
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalPayment: 0,
    actualTenureMonths: schedule.length,
  };

  schedule.forEach(entry => {
    summary.totalPrincipalPaid += entry.principalPaid;
    summary.totalInterestPaid += entry.interestPaid;
    summary.totalPayment += entry.emi; 
  });
  
  summary.totalPrincipalPaid = parseFloat(summary.totalPrincipalPaid.toFixed(2));
  summary.totalInterestPaid = parseFloat(summary.totalInterestPaid.toFixed(2));
  summary.totalPayment = parseFloat(summary.totalPayment.toFixed(2));

  return summary;
};
