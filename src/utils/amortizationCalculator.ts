// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange, LoanDetails, Disbursement } from '../types'; // Added LoanDetails, Disbursement
import { calculateEMI, calculateTotalDisbursed } from './loanCalculations'; // Added calculateTotalDisbursed

// Define a union type for all possible events with a consistent structure
type LoanEvent = 
  | (Omit<Payment, 'date'> & { eventType: 'payment'; date: Date })
  | (Omit<InterestRateChange, 'date'> & { eventType: 'roiChange'; date: Date })
  | (Omit<CustomEMIChange, 'date'> & { eventType: 'emiChange'; date: Date });


interface EffectiveLoanParams {
  currentPrincipal: number;
  currentAnnualRate: number;
  currentEMI: number;
  remainingTenureMonths: number; // This might be recalculated
}

export const generateAmortizationSchedule = (loan: Loan): AmortizationEntry[] => {
  const schedule: AmortizationEntry[] = [];
  if (!loan || !loan.details || loan.details.disbursements.length === 0) return schedule;

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
  let currentEMI = calculateEMI(cumulativeDisbursed, currentAnnualRate, currentTenureMonths); // Initial EMI based on first disbursement or total? Needs clarification. Let's use cumulative for now.
  
  // Combine and sort all events including disbursements
  const allEvents: (LoanEvent | (Omit<Disbursement, 'date'> & { eventType: 'disbursement'; date: Date }))[] = [
    ...loan.paymentHistory.map(p => ({ ...p, eventType: 'payment' as const, date: new Date(p.date) })),
    ...loan.interestRateChanges.map(c => ({ ...c, eventType: 'roiChange' as const, date: new Date(c.date) })),
    ...loan.customEMIChanges.map(c => ({ ...c, eventType: 'emiChange' as const, date: new Date(c.date) })),
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
    // Event indicators for the current month's entry
    let entryIndicators: Partial<Pick<AmortizationEntry, 'isPrepayment' | 'isRoiChange' | 'isEmiChange' | 'isDisbursement'>> = {};

    // Check for events occurring in the current month/period
    // This logic needs to be robust to handle multiple events in a month,
    // and how they affect calculations for *that* month vs subsequent months.
    // For simplicity, we'll assume events apply from the start of the month they occur in.
    let isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate;

    while(eventPointer < allEvents.length && allEvents[eventPointer].date <= currentDate) {
        const event = allEvents[eventPointer];
        // remarks += `${event.eventType} on ${event.date.toLocaleDateString()}. `; 

        if (event.eventType === 'disbursement') {
            openingBalance += event.amount; 
            cumulativeDisbursed += event.amount;
            const remainingMonths = currentTenureMonths - monthNumber; 
            currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonths > 0 ? remainingMonths : 1);
            entryIndicators.isDisbursement = { id: event.id, amount: event.amount }; // Set indicator with ID
        } else if (event.eventType === 'payment') {
            actualPaymentMade = event.amount; 
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; 
                interestForMonth = openingBalance * monthlyInterestRate;
                entryIndicators.isPrepayment = { id: event.id, amount: event.amount }; // Set indicator with ID
            }
            // For EMI type, actualPaymentMade is set. The principal/interest split will be based on this.
            principalPaidThisMonth = actualPaymentMade - interestForMonth;
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            const remainingMonths = currentTenureMonths - (monthNumber -1); // Approx remaining
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, remainingMonths > 0 ? remainingMonths : 1); 
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) { // This case might be removed if edit only allows adjustTenure/adjustEMI
                currentEMI = event.newEMIIfApplicable;
            }
            // If 'adjustTenure', EMI remains same.
            entryIndicators.isRoiChange = { id: event.id, newRate: event.newRate, preference: event.adjustmentPreference }; // Set indicator with ID
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            entryIndicators.isEmiChange = { id: event.id, newEMI: event.newEMI }; // Set indicator with ID
        }
        eventPointer++;
        // Re-check if we moved past the Pre-EMI period due to event processing
        isPreEmiPeriod = loan.details.startedWithPreEMI && currentDate < emiStartDate; 
    }

    // Handle Pre-EMI period: Only interest is paid, principal reduction starts after emiStartDate
    if (isPreEmiPeriod) {
        principalPaidThisMonth = 0; // No principal reduction during Pre-EMI
        // Actual payment during Pre-EMI might be just the interest, or zero if logged separately
        // For simplicity, let's assume logged PreEmiPayments cover this. Here we calculate scheduled payment.
        actualPaymentMade = interestForMonth; // Scheduled payment is just interest
        // We should check logged PreEMIInterestPayments here to see if actual payment was made/different
    } else {
         // Normal EMI period calculation (already done above, but adjust for final payment)
         principalPaidThisMonth = actualPaymentMade - interestForMonth;
         if (principalPaidThisMonth < 0) principalPaidThisMonth = 0; // Cannot pay negative principal
    }


    if (principalPaidThisMonth > openingBalance) {
      principalPaidThisMonth = openingBalance;
      // Recalculate actual payment if it's the final one
      actualPaymentMade = principalPaidThisMonth + interestForMonth; 
    }
     // Ensure final payment clears the balance exactly
    if (openingBalance - principalPaidThisMonth < 0.01 && openingBalance > 0) { 
        principalPaidThisMonth = openingBalance;
        actualPaymentMade = principalPaidThisMonth + interestForMonth;
        interestForMonth = actualPaymentMade - principalPaidThisMonth; // ensure interest is correct for final payment
    }


    const closingBalance = openingBalance - principalPaidThisMonth;

    schedule.push({
      monthNumber,
      paymentDate: currentDate.toISOString().split('T')[0], // Approximate payment date
      openingBalance: parseFloat(openingBalance.toFixed(2)),
      emi: parseFloat(actualPaymentMade.toFixed(2)),
      principalPaid: parseFloat(principalPaidThisMonth.toFixed(2)),
      interestPaid: parseFloat(interestForMonth.toFixed(2)),
      closingBalance: parseFloat(closingBalance.toFixed(2)),
      ...entryIndicators // Spread the collected indicators for this month
    });

    openingBalance = closingBalance;
    
    // Advance to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (openingBalance <= 0.01) break; // Loan paid off
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
    summariesByYear[year].totalPayment += entry.emi; // emi here is actual payment made
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
    summary.totalPayment += entry.emi; // emi here is actual payment made
  });
  
  // Round to 2 decimal places
  summary.totalPrincipalPaid = parseFloat(summary.totalPrincipalPaid.toFixed(2));
  summary.totalInterestPaid = parseFloat(summary.totalInterestPaid.toFixed(2));
  summary.totalPayment = parseFloat(summary.totalPayment.toFixed(2));


  return summary;
};
