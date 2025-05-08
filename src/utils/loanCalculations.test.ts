// src/utils/loanCalculations.test.ts
import { describe, it, expect } from 'vitest';
import { calculateEMI, calculateTotalDisbursed, calculateTotalInterestAndPayment } from './loanCalculations';
import { Disbursement } from '../types';

describe('loanCalculations', () => {
  describe('calculateTotalDisbursed', () => {
    it('should return 0 for an empty array', () => {
      expect(calculateTotalDisbursed([])).toBe(0);
     });

     it('should return 0 for undefined input', () => {
       // Removed @ts-expect-error - test might fail if type checking is strict, but let's see
       expect(calculateTotalDisbursed(undefined as any)).toBe(0); // Use 'as any' to bypass type check for test
     });

    it('should calculate the sum of amounts for multiple disbursements', () => {
      const disbursements: Disbursement[] = [
        { id: '1', date: '2023-01-01', amount: 100000 },
        { id: '2', date: '2023-02-01', amount: 50000 },
        { id: '3', date: '2023-03-01', amount: 25000 },
      ];
      expect(calculateTotalDisbursed(disbursements)).toBe(175000);
    });

     it('should handle a single disbursement', () => {
      const disbursements: Disbursement[] = [
        { id: '1', date: '2023-01-01', amount: 500000 },
      ];
      expect(calculateTotalDisbursed(disbursements)).toBe(500000);
    });
  });

  describe('calculateEMI', () => {
    it('should calculate EMI correctly for standard inputs', () => {
      // Example: 50 Lakhs (5,000,000), 8.5% annual rate, 20 years (240 months)
      const principal = 5000000;
      const annualRate = 8.5;
      const tenureMonths = 240;
      // Expected EMI (use an online calculator to verify) ~ 43391.16
      expect(calculateEMI(principal, annualRate, tenureMonths)).toBeCloseTo(43391.16, 2);
    });

    it('should return 0 if principal is zero or negative', () => {
      expect(calculateEMI(0, 8.5, 240)).toBe(0);
      expect(calculateEMI(-1000, 8.5, 240)).toBe(0);
    });

    it('should return 0 if tenure is zero or negative', () => {
      expect(calculateEMI(5000000, 8.5, 0)).toBe(0);
      expect(calculateEMI(5000000, 8.5, -12)).toBe(0);
    });

    it('should handle zero interest rate', () => {
      expect(calculateEMI(120000, 0, 12)).toBe(10000);
    });

     it('should handle negative interest rate (treat as zero)', () => {
      expect(calculateEMI(120000, -1, 12)).toBe(10000);
    });
  });

  describe('calculateTotalInterestAndPayment', () => {
     it('should calculate total interest and payment correctly', () => {
        const principal = 5000000;
        const emi = 43391.16;
        const tenureMonths = 240;
        const expectedTotalPayment = 43391.16 * 240; // 10413878.4
        const expectedTotalInterest = expectedTotalPayment - principal; // 5413878.4

        const result = calculateTotalInterestAndPayment(principal, emi, tenureMonths);
        expect(result.totalPayment).toBeCloseTo(expectedTotalPayment, 2);
        expect(result.totalInterest).toBeCloseTo(expectedTotalInterest, 2);
     });

      it('should return zero if inputs are invalid', () => {
        expect(calculateTotalInterestAndPayment(0, 1000, 12)).toEqual({ totalInterest: 0, totalPayment: 0 });
        expect(calculateTotalInterestAndPayment(10000, 0, 12)).toEqual({ totalInterest: 0, totalPayment: 0 });
        expect(calculateTotalInterestAndPayment(10000, 1000, 0)).toEqual({ totalInterest: 0, totalPayment: 0 });
      });
  });

  // Add tests for calculateNewTenureAfterPrepayment later if needed
});
