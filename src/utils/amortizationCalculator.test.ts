// src/utils/amortizationCalculator.test.ts
import { describe, it, expect, vi } from 'vitest';
import { 
    generateAmortizationSchedule, 
    generateAnnualSummaries, 
    generateLifespanSummary, 
    generateSummaryToDate 
} from './amortizationCalculator';
import { calculateEMI } from './loanCalculations'; // Assuming it's needed directly or for setup
import { Loan, LoanDetails, AmortizationEntry, Disbursement, Payment, InterestRateChange, CustomEMIChange } from '../types'; // Add all relevant types

// Helper function to create a basic loan object
const createBasicLoan = (details: Partial<LoanDetails>, events: Partial<Loan> = {}): Loan => {
  const defaultDetails: LoanDetails = {
    id: 'loan1',
    userId: 'user1',
    loanName: 'Test Loan',
    originalPrincipal: 100000,
    originalInterestRate: 10, // %
    originalTenureMonths: 12,
    startDate: '2024-01-01',
    emiDebitDay: 5,
    disbursements: [{ id: 'd1', date: '2024-01-01', amount: 100000 }],
    startedWithPreEMI: false,
    isTaxDeductible: false,
    ...details,
  };
  return {
    id: defaultDetails.id,
    details: defaultDetails,
    paymentHistory: events.paymentHistory || [],
    interestRateChanges: events.interestRateChanges || [],
    customEMIChanges: events.customEMIChanges || [],
    // disbursements within details are the primary source for schedule generation
  };
};

describe('amortizationCalculator', () => {
  describe('generateAmortizationSchedule', () => {
    it('should generate a simple loan schedule correctly', () => {
      const loan = createBasicLoan({
        originalPrincipal: 12000,
        originalInterestRate: 10,
        originalTenureMonths: 12,
        startDate: '2024-01-15', // Start date
        emiDebitDay: 20,       // EMI due on 20th
        disbursements: [{ id: 'd1', date: '2024-01-15', amount: 12000 }],
      });
      const schedule = generateAmortizationSchedule(loan);
      expect(schedule.length).toBe(12);
      expect(schedule[0].openingBalance).toBe(12000);
      // First payment date should be 2024-02-20 as emiDebitDay is 20 and startDate is 15th Jan
      expect(schedule[0].paymentDate).toBe('2024-02-20'); 
      // Last payment should make closing balance close to 0
      expect(schedule[11].closingBalance).toBeLessThanOrEqual(0.01); 

      // Verify EMI (approximate, use actual calculateEMI for precision if needed for test)
      // const expectedEMI = calculateEMI(12000, 10, 12); // Around 1055.17
      // expect(schedule[0].emi).toBeCloseTo(expectedEMI, 2); // Might vary slightly due to date logic
      
      let totalPrincipalPaid = 0;
      let totalInterestPaid = 0;
      schedule.forEach(entry => {
        totalPrincipalPaid += entry.principalPaid;
        totalInterestPaid += entry.interestPaid;
      });
      expect(totalPrincipalPaid).toBeCloseTo(12000, 2);
    });

    it('should handle zero interest rate loan', () => {
      const loan = createBasicLoan({
        originalPrincipal: 12000,
        originalInterestRate: 0,
        originalTenureMonths: 12,
        startDate: '2024-01-01',
        emiDebitDay: 5,
        disbursements: [{ id: 'd1', date: '2024-01-01', amount: 12000 }],
      });
      const schedule = generateAmortizationSchedule(loan);
      expect(schedule.length).toBe(12);
      expect(schedule[0].interestPaid).toBe(0);
      expect(schedule[5].interestPaid).toBe(0);
      expect(schedule[0].principalPaid).toBe(1000);
      expect(schedule[0].emi).toBe(1000);
      expect(schedule[11].closingBalance).toBeLessThanOrEqual(0.01);
    });

    // Add more tests based on the outline...
  });

  describe('generateAnnualSummaries', () => {
    // Add basic tests later
    it('should be defined', () => { // Placeholder
        expect(generateAnnualSummaries).toBeDefined();
    });
  });

  describe('generateLifespanSummary', () => {
    // Add basic tests later
     it('should be defined', () => { // Placeholder
        expect(generateLifespanSummary).toBeDefined();
    });
  });

  describe('generateSummaryToDate', () => {
    // Add basic tests later
     it('should be defined', () => { // Placeholder
        expect(generateSummaryToDate).toBeDefined();
    });
  });
});
