// src/contexts/AppContext.test.tsx
import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from './AppContext'; // Reverted to initialState
import { Loan, Disbursement, Payment, InterestRateChange, CustomEMIChange } from '../types';

// Helper to create a basic loan for testing
const createTestLoan = (id: string, name: string, initialDisbursementAmount: number = 500000): Loan => ({
    id,
    name,
    details: {
        disbursements: [{ id: 'd1', date: '2023-01-01', amount: initialDisbursementAmount }],
        originalInterestRate: 8.5,
        originalTenureMonths: 120,
        startDate: '2023-01-01',
    },
    paymentHistory: [],
    interestRateChanges: [],
    customEMIChanges: [],
});


describe('appReducer', () => {
    it('should handle ADD_LOAN', () => {
        const newLoan = createTestLoan('loan1', 'Test Loan 1');
        const action = { type: 'ADD_LOAN' as const, payload: newLoan };
        const newState = appReducer(initialState, action); // Use initialState
        expect(newState.loans).toHaveLength(1);
        expect(newState.loans[0]).toEqual(newLoan);
        expect(newState.selectedLoanId).toBe('loan1');
    });

    it('should handle SELECT_LOAN', () => {
        const stateWithLoan = { 
            ...initialState, // Use initialState
            loans: [createTestLoan('loan1', 'Test Loan 1')],
        };
        const action = { type: 'SELECT_LOAN' as const, payload: 'loan1' };
        const newState = appReducer(stateWithLoan, action);
        expect(newState.selectedLoanId).toBe('loan1');

        const actionNull = { type: 'SELECT_LOAN' as const, payload: null };
        const newStateNull = appReducer(newState, actionNull);
        expect(newStateNull.selectedLoanId).toBeNull();
    });

    it('should handle DELETE_LOAN', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const loan2 = createTestLoan('loan2', 'Test Loan 2');
        const stateWithLoans = { 
            ...initialState, // Use initialState
            loans: [loan1, loan2],
            selectedLoanId: 'loan1',
        };
        const action = { type: 'DELETE_LOAN' as const, payload: 'loan1' };
        const newState = appReducer(stateWithLoans, action);
        expect(newState.loans).toHaveLength(1);
        expect(newState.loans[0].id).toBe('loan2');
        // Corrected expectation: if selected loan ('loan1') is deleted, 
        // new selectedLoanId is the first of remaining loans, or null if no loans left.
        expect(newState.selectedLoanId).toBe(newState.loans.length > 0 ? newState.loans[0].id : null); 
    });
    
     it('should handle DELETE_LOAN when deleted loan is not selected', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const loan2 = createTestLoan('loan2', 'Test Loan 2');
        const stateWithLoans = { 
            ...initialState, // Use initialState
            loans: [loan1, loan2],
            selectedLoanId: 'loan2', // loan2 is selected
        };
        const action = { type: 'DELETE_LOAN' as const, payload: 'loan1' }; // delete loan1
        const newState = appReducer(stateWithLoans, action);
        expect(newState.loans).toHaveLength(1);
        expect(newState.loans[0].id).toBe('loan2');
        expect(newState.selectedLoanId).toBe('loan2'); // Selection remains unchanged
    });

    it('should handle ADD_DISBURSEMENT', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1', 100000);
        const stateWithLoan = { ...initialState, loans: [loan1], selectedLoanId: 'loan1' }; // Use initialState
        // Payload for ADD_DISBURSEMENT is Omit<Disbursement, 'id'>
        const newDisbursementPayload: Omit<Disbursement, 'id'> = { date: '2023-06-01', amount: 50000 };
        const action = { type: 'ADD_DISBURSEMENT' as const, payload: { loanId: 'loan1', disbursement: newDisbursementPayload } };
        
        const newState = appReducer(stateWithLoan, action);
        expect(newState.loans[0].details.disbursements).toHaveLength(2);
        expect(newState.loans[0].details.disbursements[1].amount).toBe(50000);
        // Check if ID is added by reducer (it should be)
        expect(newState.loans[0].details.disbursements[1].id).toBeDefined(); 
        expect(newState.loans[0].details.disbursements[1].id).not.toBe('d2'); // Reducer assigns new ID
    });

    it('should handle ADD_PAYMENT (Prepayment)', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const stateWithLoan = { ...initialState, loans: [loan1], selectedLoanId: 'loan1' }; // Use initialState
        // Payload for ADD_PAYMENT is Omit<Payment, 'id' | 'principalPaid' | 'interestPaid' | 'balanceAfterPayment'>
        const newPaymentPayload: Omit<Payment, 'id' | 'principalPaid' | 'interestPaid' | 'balanceAfterPayment'> = { 
            date: '2023-02-01', amount: 10000, type: 'Prepayment'
        };
        const action = { type: 'ADD_PAYMENT' as const, payload: { loanId: 'loan1', payment: newPaymentPayload } };

        const newState = appReducer(stateWithLoan, action);
        expect(newState.loans[0].paymentHistory).toHaveLength(1);
        expect(newState.loans[0].paymentHistory[0].type).toBe('Prepayment');
        expect(newState.loans[0].paymentHistory[0].amount).toBe(10000);
        expect(newState.loans[0].paymentHistory[0].id).not.toBe('p1'); // Reducer assigns new ID
    });

     it('should handle ADD_INTEREST_RATE_CHANGE', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const stateWithLoan = { ...initialState, loans: [loan1], selectedLoanId: 'loan1' }; // Use initialState
        // Payload for ADD_INTEREST_RATE_CHANGE is Omit<InterestRateChange, 'id'>
        const newChangePayload: Omit<InterestRateChange, 'id'> = { 
            date: '2024-01-01', newRate: 9.0, adjustmentPreference: 'adjustTenure'
        };
        const action = { type: 'ADD_INTEREST_RATE_CHANGE' as const, payload: { loanId: 'loan1', change: newChangePayload } };

        const newState = appReducer(stateWithLoan, action);
        expect(newState.loans[0].interestRateChanges).toHaveLength(1);
        expect(newState.loans[0].interestRateChanges[0].newRate).toBe(9.0);
        expect(newState.loans[0].interestRateChanges[0].id).not.toBe('r1'); // Reducer assigns new ID
    });

     it('should handle ADD_CUSTOM_EMI_CHANGE', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const stateWithLoan = { ...initialState, loans: [loan1], selectedLoanId: 'loan1' }; // Use initialState
        // Payload for ADD_CUSTOM_EMI_CHANGE is Omit<CustomEMIChange, 'id'>
        const newChangePayload: Omit<CustomEMIChange, 'id'> = { 
            date: '2024-02-01', newEMI: 5000
        };
        const action = { type: 'ADD_CUSTOM_EMI_CHANGE' as const, payload: { loanId: 'loan1', change: newChangePayload } };

        const newState = appReducer(stateWithLoan, action);
        expect(newState.loans[0].customEMIChanges).toHaveLength(1);
        expect(newState.loans[0].customEMIChanges[0].newEMI).toBe(5000);
        expect(newState.loans[0].customEMIChanges[0].id).not.toBe('e1'); // Reducer assigns new ID
    });

    it('should handle UPDATE_LOAN', () => {
        const loan1 = createTestLoan('loan1', 'Test Loan 1');
        const stateWithLoan = { ...initialState, loans: [loan1], selectedLoanId: 'loan1' }; // Use initialState
        const updatedLoan = { ...loan1, name: 'Updated Loan Name' };
        const action = { type: 'UPDATE_LOAN' as const, payload: updatedLoan };

        const newState = appReducer(stateWithLoan, action);
        expect(newState.loans).toHaveLength(1);
        expect(newState.loans[0].name).toBe('Updated Loan Name');
    });

     it('should return current state for unknown action', () => {
        const stateWithLoan = { 
            ...initialState, // Use initialState
             loans: [createTestLoan('loan1', 'Test Loan 1')],
         };
         const action = { type: 'UNKNOWN_ACTION', payload: {} }; 
         const newState = appReducer(stateWithLoan, action as any); 
        expect(newState).toEqual(stateWithLoan);
    });

});

// Note: The state passed to appReducer in tests should be AppState.
