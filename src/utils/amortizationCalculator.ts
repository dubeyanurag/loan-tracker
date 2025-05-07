// src/utils/amortizationCalculator.ts
import { Loan, AmortizationEntry, Payment, InterestRateChange, CustomEMIChange } from '../types';
import { calculateEMI } from './loanCalculations'; // calculateNewTenureAfterPrepayment is not used in this version yet

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
  if (!loan || !loan.details) return schedule;

  let monthNumber = 0;
  let openingBalance = loan.details.principal;
  let currentAnnualRate = loan.details.originalInterestRate;
  let currentTenureMonths = loan.details.originalTenureMonths;
  let currentEMI = calculateEMI(openingBalance, currentAnnualRate, currentTenureMonths);
  
  // Sort all events by date to process them chronologically
  const allEvents: LoanEvent[] = [
    ...loan.paymentHistory.map(p => ({ ...p, eventType: 'payment' as const, date: new Date(p.date) } as LoanEvent)),
    ...loan.interestRateChanges.map(c => ({ ...c, eventType: 'roiChange' as const, date: new Date(c.date) } as LoanEvent)),
    ...loan.customEMIChanges.map(c => ({ ...c, eventType: 'emiChange' as const, date: new Date(c.date) } as LoanEvent)),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let eventPointer = 0;
  let currentDate = new Date(loan.details.startDate);

  // Loop until loan is paid off or max iterations (e.g., 600 months = 50 years)
  while (openingBalance > 0.01 && monthNumber < 600) {
    monthNumber++;
    const monthlyInterestRate = currentAnnualRate / 12 / 100;
    let interestForMonth = openingBalance * monthlyInterestRate;
    let principalPaidThisMonth = currentEMI - interestForMonth;
    let actualPaymentMade = currentEMI; // Assume scheduled EMI is paid
    let remarks = '';

    // Check for events occurring in the current month/period
    // This logic needs to be robust to handle multiple events in a month,
    // and how they affect calculations for *that* month vs subsequent months.
    // For simplicity, we'll assume events apply from the start of the month they occur in.
    
    while(eventPointer < allEvents.length && allEvents[eventPointer].date <= currentDate) {
        const event = allEvents[eventPointer];
        remarks += `${event.eventType} on ${event.date.toLocaleDateString()}. `;

        if (event.eventType === 'payment') {
            actualPaymentMade = event.amount; // Actual amount paid
            if (event.type === 'Prepayment') {
                openingBalance -= event.amount; // Reduce principal directly
                remarks += `Prepayment: ${event.amount}. `;
                // Recalculate interest for the month on new lower balance if prepayment is at start of month
                interestForMonth = openingBalance * monthlyInterestRate;
            }
            // For EMI type, actualPaymentMade is set. The principal/interest split will be based on this.
            principalPaidThisMonth = actualPaymentMade - interestForMonth;
        } else if (event.eventType === 'roiChange') {
            currentAnnualRate = event.newRate;
            remarks += `ROI changed to ${currentAnnualRate}%. `;
            // Recalculate EMI or Tenure based on preference
            if (event.adjustmentPreference === 'adjustEMI') {
                currentEMI = calculateEMI(openingBalance, currentAnnualRate, currentTenureMonths - (monthNumber -1) ); // Remaining tenure
            } else if (event.adjustmentPreference === 'customEMI' && event.newEMIIfApplicable) {
                currentEMI = event.newEMIIfApplicable;
            }
            // If 'adjustTenure', EMI remains same, tenure will naturally adjust or can be recalculated.
        } else if (event.eventType === 'emiChange') {
            currentEMI = event.newEMI;
            remarks += `EMI changed to ${currentEMI}. `;
        }
        eventPointer++;
    }


    if (principalPaidThisMonth > openingBalance) {
      principalPaidThisMonth = openingBalance;
      actualPaymentMade = principalPaidThisMonth + interestForMonth; // Final payment might be less than EMI
    }
    if (openingBalance - principalPaidThisMonth < 0.01 && openingBalance > 0) { // Final small adjustment
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
      remarks: remarks.trim(),
    });

    openingBalance = closingBalance;
    
    // Advance to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (openingBalance <= 0.01) break; // Loan paid off
  }

  return schedule;
};
