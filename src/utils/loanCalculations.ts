// src/utils/loanCalculations.ts
import { LoanDetails, Disbursement } from '../types'; // Import necessary types

/**
 * Calculates the total disbursed principal amount from an array of disbursements.
 * @param disbursements An array of Disbursement objects.
 * @returns The sum of all disbursement amounts.
 */
export const calculateTotalDisbursed = (disbursements: Disbursement[]): number => {
  if (!disbursements || disbursements.length === 0) {
    return 0;
  }
  return disbursements.reduce((sum, disbursement) => sum + disbursement.amount, 0);
};

/**
 * Calculates the Equated Monthly Installment (EMI) for a loan.
 * NOTE: This function currently takes a single principal value. 
 * For loans with multiple disbursements, the EMI might need recalculation 
 * after each disbursement based on the total disbursed amount and remaining tenure.
 * This simple version is suitable for calculating initial EMI based on total expected principal,
 * or for recalculating based on current outstanding balance.
 * @param principal The principal loan amount (or current outstanding balance).
 * @param annualInterestRate The annual interest rate (e.g., 8.5 for 8.5%).
 * @param tenureMonths The loan tenure in months (or remaining tenure).
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
  if (annualInterestRate < 0) { 
    return principal / tenureMonths; 
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
 * NOTE: This assumes a single principal amount. For multiple disbursements, 
 * the 'principal' here should likely be the total disbursed amount for an initial estimate.
 * @param principal The principal loan amount (total disbursed).
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

  const interestForMonth = currentOutstandingPrincipal * monthlyInterestRate;
  if (emi <= interestForMonth && monthlyInterestRate > 0) {
    return Infinity; // Indicates loan will not be repaid at this EMI
  }
  if (monthlyInterestRate === 0) {
    return Math.ceil(currentOutstandingPrincipal / emi);
  }

  const numerator = Math.log(1 - (currentOutstandingPrincipal * monthlyInterestRate) / emi);
  const denominator = Math.log(1 + monthlyInterestRate);
  
  if (isNaN(numerator) || (currentOutstandingPrincipal * monthlyInterestRate) / emi >=1 ) {
    return Infinity;
  }

  const newTenureMonths = -numerator / denominator;
  return Math.ceil(newTenureMonths); // Round up to the next whole month
};
