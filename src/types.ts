// src/types.ts

export interface Payment {
  id: string; 
  date: string; 
  amount: number;
  type: 'EMI' | 'Prepayment';
  principalPaid: number;
  interestPaid: number;
  balanceAfterPayment: number; 
  remarks?: string;
}

export interface InterestRateChange {
  id: string; 
  date: string; 
  newRate: number; 
  adjustmentPreference?: 'adjustTenure' | 'adjustEMI' | 'customEMI';
  newEMIIfApplicable?: number; 
}

export interface CustomEMIChange {
  id: string;
  date: string; 
  newEMI: number;
  remarks?: string;
}

export interface Disbursement {
  id: string; 
  date: string; 
  amount: number;
  remarks?: string;
}

export interface LoanDetails {
  disbursements: Disbursement[]; 
  originalInterestRate: number; 
  originalTenureMonths: number; 
  startDate: string; 
  startedWithPreEMI?: boolean; 
  emiStartDate?: string; 
  isTaxDeductible?: boolean; 
  principalDeductionLimit?: number; 
  interestDeductionLimit?: number; 
}

export interface Loan {
  id: string; 
  name: string; 
  details: LoanDetails;
  paymentHistory: Payment[];
  interestRateChanges: InterestRateChange[];
  customEMIChanges: CustomEMIChange[];
}

export interface AppState {
  loans: Loan[];
  selectedLoanId: string | null;
}

export type AppAction =
  | { type: 'ADD_LOAN'; payload: Loan }
  | { type: 'SELECT_LOAN'; payload: string | null }
  | { type: 'UPDATE_LOAN'; payload: Loan } 
  | { type: 'DELETE_LOAN'; payload: string } 
  | { type: 'LOAD_STATE'; payload: AppState } 
  | { type: 'ADD_PAYMENT'; payload: { loanId: string; payment: Payment } }
  | { type: 'ADD_INTEREST_RATE_CHANGE'; payload: { loanId: string; change: InterestRateChange } }
  | { type: 'ADD_CUSTOM_EMI_CHANGE'; payload: { loanId: string; change: CustomEMIChange } }
  | { type: 'ADD_DISBURSEMENT'; payload: { loanId: string; disbursement: Disbursement } }; 

export interface AmortizationEntry {
  monthNumber: number;
  paymentDate: string; 
  openingBalance: number;
  emi: number; 
  principalPaid: number;
  interestPaid: number; // This will now be REGULAR interest if not Pre-EMI
  closingBalance: number;
  isPreEMIPeriod?: boolean; // New flag
  // Store arrays of events occurring *during* this month/period
  disbursements?: Array<{ id: string; amount: number }>;
  prepayments?: Array<{ id: string; amount: number }>;
  roiChanges?: Array<{ id: string; newRate: number; preference?: string }>;
  emiChanges?: Array<{ id: string; newEMI: number }>;
}

// --- Summary Interfaces ---
export interface AnnualSummary {
  yearLabel: string; 
  startYear: number; 
  totalPrincipalPaid: number;
  totalInterestPaid: number; // Regular EMI interest
  totalPreEMIInterestPaid: number; // New field
  totalPayment: number;
  deductiblePrincipal: number; 
  deductibleInterest: number; // Combined deductible interest
}

export interface LifespanSummary {
  totalPrincipalPaid: number;
  totalInterestPaid: number; // Regular EMI interest
  totalPreEMIInterestPaid: number; // New field
  totalPayment: number;
  actualTenureMonths: number;
  totalDeductiblePrincipal: number;
  totalDeductibleInterest: number; // Combined deductible interest
}

export interface CurrentSummary {
  monthsElapsed: number;
  totalPrincipalPaid: number; // Uncapped regular principal paid to date
  totalInterestPaid: number; // Uncapped regular interest paid to date
  totalPreEMIInterestPaid: number; // New: Uncapped Pre-EMI interest paid to date
  totalPayment: number;
  totalDeductiblePrincipal: number; // Cumulative capped principal
  totalDeductibleInterest: number; // Cumulative capped combined interest
  currentOutstandingBalance: number;
  uncappedTotalPrincipalPaid: number; 
  uncappedTotalInterestPaid: number; // This will become uncapped REGULAR interest
  // uncappedTotalPreEMIInterestPaid: number; // Already added above as totalPreEMIInterestPaid
}
