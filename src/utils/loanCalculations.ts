// src/utils/loanCalculations.ts
import { LoanDetails, Disbursement } from "../types"; // Corrected path

export const calculateEMI = (principal: number, annualRate: number, tenureMonths: number): number => {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0; 
  }
  
  // Handle 0% or negative interest rate - treat negative as 0%
  if (annualRate <= 0) {
    return principal / tenureMonths;
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi =
    principal *
    monthlyRate *
    (Math.pow(1 + monthlyRate, tenureMonths) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1));
  return parseFloat(emi.toFixed(2));
};


export const calculateTotalDisbursed = (disbursements: Disbursement[]): number => {
    if (!disbursements || disbursements.length === 0) {
        return 0;
    }
    return disbursements.reduce((total, d) => total + d.amount, 0);
};


export const isValidLoanDetails = (details: LoanDetails): boolean => {
    if (!details) return false;
    if (!details.disbursements || details.disbursements.length === 0) return false;
    if (isNaN(details.originalInterestRate) || details.originalInterestRate < 0) return false; // Allow 0%
    if (isNaN(details.originalTenureMonths) || details.originalTenureMonths <= 0) return false;
    if (!details.startDate) return false;
    if (details.startedWithPreEMI && !details.emiStartDate) return false;

    // Validate each disbursement
    for (const disbursement of details.disbursements) {
        if (!disbursement.date || isNaN(disbursement.amount) || disbursement.amount <= 0) {
            return false;
        }
    }
    return true;
};
