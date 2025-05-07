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

// We can add more calculation functions here later, e.g., for amortization schedule,
// outstanding balance after N payments, impact of prepayments, etc.
