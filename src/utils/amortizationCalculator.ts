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

  // Sort disbursements by date to process them correctly
  const sortedDisbursements = [...loan.details.disbursements].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let monthNumber = 0;
  // Initial opening balance is based on the *first* disbursement amount
  let openingBalance = sortedDisbursements[0].amount; 
  let cumulativeDisbursed = sortedDisbursements[0].amount;
  let currentAnnualRate = loan.details.originalInterestRate;
  let currentTenureMonths = loan.details.originalTenureMonths;
  // Initial EMI calculation might need adjustment based on disbursement schedule / total expected principal
  // For now, calculate based on first disbursement and original terms - this will likely be recalculated soon
  let currentEMI = calculateEMI(cumulativeDisbursed, currentAnnualRate, currentTenureMonths); 
  
  // Combine and sort all events including disbursements
  const allEvents: (LoanEvent | (Omit<Disbursement, 'date'> & { eventType: 'disbursement'; date: Date }))[] = [
    ...(loan.paymentHistory || []).map(p => ({ ...p, eventType: 'payment' as const, date: new Date(p.date) })),
    ...(loan.interestRateChanges || []).map(c => ({ ...c, eventType: 'roiChange' as const, date: new Date(c.date) })),
    ...(loan.customEMIChanges || []).map(c => ({ ...c, eventType: 'emiChange' as const, date: new Date(c.date) })),
    // Add disbursements as events (skip the first one as it sets initial balance)
    ...sortedDisbursements.slice(1).map(d => ({ ...d, eventType: 'disbursement' as const, date: new Date(d.date) })) 
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let eventPointer = 0;
  // Start date should be the date of the first disbursement
  let currentDate = new Date(sortedDisbursements[0].date); 
  // Determine the actual EMI start date
  const emiStartDate = loan.details.emiStartDate ? new Date(loan.details.emiStartDate) : currentDate; // Default to loan start if not specified

  // Loop until loan is paid off or max iterations (e.g., 600 months = 50 years)
  while (openingBalance > 0.01 && monthNumber < 600) {
    monthNumber++;
    const monthlyInterestRate = currentAnnualRate / 12 / 100;
    let interestForMonth = openingBalance * monthlyInterestRate;
    let principalPaidThisMonth = currentEMI - interestForMonth;
    let actualPaymentMade = currentEMI; // Assume scheduled EMI is paid
    // Temporary arrays to collect events for this month's entry
    let disbursementsThisMonth: AmortizationEntry['disbursements'] = [];
    let prepaymentsThisMonth: AmortizationEntry['prepayments'] = [];
    let roiChangesThisMonth: AmortizationEntry['roiChanges'] = [];
    let emiChangesThisMonth: AmortizationEntry['emiChanges'] = [];

    // Check for events occurring in the current month/period
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
  year: number;
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

export const generateAnnualSummaries = (schedule: AmortizationEntry[]): AnnualSummary[] => {
  if (!schedule || schedule.length === 0) return [];

  const summariesByYear: { [year: number]: AnnualSummary } = {};

  schedule.forEach(entry => {
    const year = new Date(entry.paymentDate).getFullYear();
    if (!summariesByYear[year]) {
      summariesByYear[year] = {
        year,
        totalPrincipalPaid: 0,
        totalInterestPaid: 0,
        totalPayment: 0,
      };
    }
    summariesByYear[year].totalPrincipalPaid += entry.principalPaid;
    summariesByYear[year].totalInterestPaid += entry.interestPaid;
    summariesByYear[year].totalPayment += entry.emi; 
  });

  return Object.values(summariesByYear).sort((a, b) => a.year - b.year);
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
