// src/utils/loanCalculations.ts

/**
 * Calculates the Equated Monthly Installment (EMI) for a loan.
 * @param principal The principal loan amount.
 * @param annualInterestRate The annual interest rate (e.g., 8.5 for 8.5%).
 * @param tenureMonths The loan tenure in months.
 * @returns The calculated EMI amount.
 */
export const calculateEMI = (
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): number => {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0;
  }
  if (annualInterestRate < 0) { // Allow 0% interest rate
    return principal / tenureMonths; // Or handle as an error if 0% is not allowed
  }
  if (annualInterestRate === 0) {
    return principal / tenureMonths;
  }

  const monthlyInterestRate = annualInterestRate / 12 / 100;
  
  // EMI = P × r × (1 + r)^n / ((1 + r)^n – 1)
  const emi =
    (principal *
      monthlyInterestRate *
      Math.pow(1 + monthlyInterestRate, tenureMonths)) /
    (Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);

  return parseFloat(emi.toFixed(2)); // Return with 2 decimal places
};

/**
 * Calculates total interest and total payment for a loan based on a fixed EMI.
 * @param principal The principal loan amount.
 * @param emi The Equated Monthly Installment.
 * @param tenureMonths The loan tenure in months.
 * @returns An object containing totalInterest and totalPayment.
 */
export const calculateTotalInterestAndPayment = (
  principal: number,
  emi: number,
  tenureMonths: number
): { totalInterest: number; totalPayment: number } => {
  if (principal <= 0 || emi <= 0 || tenureMonths <= 0) {
    return { totalInterest: 0, totalPayment: 0 };
  }
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;
  return {
    totalInterest: parseFloat(totalInterest.toFixed(2)),
    totalPayment: parseFloat(totalPayment.toFixed(2)),
  };
};

/**
 * Calculates the remaining loan tenure in months after a prepayment,
 * assuming the EMI remains constant.
 * P = Principal, r = monthly interest rate, EMI = Equated Monthly Installment
 * Formula for n (number of EMIs): n = -log(1 - (P * r / EMI)) / log(1 + r)
 * @param currentOutstandingPrincipal The outstanding principal *after* the prepayment is applied.
 * @param monthlyInterestRate The current effective monthly interest rate.
 * @param emi The current EMI being paid.
 * @returns The new loan tenure in months. Returns Infinity if EMI is too low to cover interest.
 */
export const calculateNewTenureAfterPrepayment = (
  currentOutstandingPrincipal: number,
  monthlyInterestRate: number,
  emi: number
): number => {
  if (currentOutstandingPrincipal <= 0) return 0;
  if (emi <= 0) return Infinity; // Or handle as an error

  // If EMI is less than or equal to the interest on the principal, the loan will never be paid off.
  const interestForMonth = currentOutstandingPrincipal * monthlyInterestRate;
  if (emi <= interestForMonth && monthlyInterestRate > 0) {
    return Infinity; // Indicates loan will not be repaid at this EMI
  }
  if (monthlyInterestRate === 0) {
    return Math.ceil(currentOutstandingPrincipal / emi);
  }

  const numerator = Math.log(1 - (currentOutstandingPrincipal * monthlyInterestRate) / emi);
  const denominator = Math.log(1 + monthlyInterestRate);
  
  // Numerator can be NaN if (P*r/EMI) >= 1, which means EMI is too low.
  // This is partially caught by the interestForMonth check, but this is more robust.
  if (isNaN(numerator) || (currentOutstandingPrincipal * monthlyInterestRate) / emi >=1 ) {
    return Infinity;
  }

  const newTenureMonths = -numerator / denominator;
  return Math.ceil(newTenureMonths); // Round up to the next whole month
};


// We can add more calculation functions here later, e.g., for amortization schedule,
// outstanding balance after N payments, impact of prepayments, etc.
