// src/types.ts

// Removed PreEMIInterestPayment interface

export interface Payment {
  id: string; // Unique ID for the payment
  date: string; // ISO date string
  amount: number;
  type: 'EMI' | 'Prepayment';
  principalPaid: number;
  interestPaid: number;
  balanceAfterPayment: number; // Outstanding balance after this payment
  remarks?: string;
}

export interface InterestRateChange {
  id: string; // Unique ID
  date: string; // ISO date string
  newRate: number; // Annual percentage
  adjustmentPreference?: 'adjustTenure' | 'adjustEMI' | 'customEMI';
  newEMIIfApplicable?: number; // If user chose adjustEMI or customEMI
  // We might also store the recalculated tenure/EMI here for record
}

export interface CustomEMIChange {
  id: string;
  date: string; // ISO date string
  newEMI: number;
  remarks?: string;
}

// New interface for disbursements
export interface Disbursement {
  id: string; // Unique ID
  date: string; // ISO date string
  amount: number;
  remarks?: string;
}

export interface LoanDetails {
  // principal: number; // Removed single principal
  disbursements: Disbursement[]; // Added array for disbursements
  originalInterestRate: number; // Annual percentage
  originalTenureMonths: number; // Original planned tenure for the *total* sanctioned amount
  startDate: string; // ISO date string (Loan disbursement/agreement start)
  startedWithPreEMI?: boolean; // Optional flag
  emiStartDate?: string; // Optional: ISO date string when full EMIs actually started
}

export interface Loan {
  id: string; // Unique ID for the loan itself, e.g., UUID
  name: string; // User-defined name, e.g., "My HDFC Home Loan"
  details: LoanDetails;
  // preEMIInterestPayments: PreEMIInterestPayment[]; // Removed
  paymentHistory: Payment[];
  interestRateChanges: InterestRateChange[];
  customEMIChanges: CustomEMIChange[];
  // Calculated/dynamic fields (not stored directly but derived for display/logic)
  // currentOutstandingBalance?: number;
  // currentEMI?: number;
  // currentTenureMonths?: number;
  // amortizationSchedule?: Payment[]; // Could be generated on demand
}

// Root state managed by Context API
export interface AppState {
  loans: Loan[];
  selectedLoanId: string | null;
  // Potentially global settings like currency symbol, date format preferences
  // settings: {
  //  currencySymbol: string;
  // };
}

// Actions for useReducer
export type AppAction =
  | { type: 'ADD_LOAN'; payload: Loan }
  | { type: 'SELECT_LOAN'; payload: string | null }
  | { type: 'UPDATE_LOAN'; payload: Loan } // For any modification to a loan
  | { type: 'DELETE_LOAN'; payload: string } // Loan ID
  | { type: 'LOAD_STATE'; payload: AppState } // For loading from localStorage
  // More specific actions for loan modifications can be added:
  | { type: 'ADD_PAYMENT'; payload: { loanId: string; payment: Payment } }
  // | { type: 'ADD_PRE_EMI_PAYMENT'; payload: { loanId: string; payment: PreEMIInterestPayment } } // Removed
  | { type: 'ADD_INTEREST_RATE_CHANGE'; payload: { loanId: string; change: InterestRateChange } }
  | { type: 'ADD_CUSTOM_EMI_CHANGE'; payload: { loanId: string; change: CustomEMIChange } }
  | { type: 'ADD_DISBURSEMENT'; payload: { loanId: string; disbursement: Disbursement } }; // New action type

export interface AmortizationEntry {
  monthNumber: number;
  paymentDate: string; // Could be more specific if we track exact payment dates
  openingBalance: number;
  emi: number; // The EMI paid for this period
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  // Indicator fields for events occurring *during* this month/period
  // Include original event ID and type for potential deletion/linking
  isPrepayment?: { id: string; amount: number };
  isRoiChange?: { id: string; newRate: number; preference?: string };
  isEmiChange?: { id: string; newEMI: number };
  isDisbursement?: { id: string; amount: number };
}
