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
  adjustmentPreference?: 'adjustTenure' | 'adjustEMI'; 
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
  disbursements: Disbursement[]; // Should contain at least the initial disbursement for a new loan test case
  originalInterestRate: number; 
  originalTenureMonths: number; 
  startDate: string; // Should match the date of the first disbursement in the array
  startedWithPreEMI?: boolean; 
  emiStartDate?: string; 
  isTaxDeductible?: boolean; 
  principalDeductionLimit?: number; 
  interestDeductionLimit?: number; 
  emiDebitDay?: number; 
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
  | { type: 'ADD_PAYMENT'; payload: { loanId: string; payment: Omit<Payment, 'id' | 'principalPaid' | 'interestPaid' | 'balanceAfterPayment'> } } // Allow passing partial for new
  | { type: 'ADD_INTEREST_RATE_CHANGE'; payload: { loanId: string; change: Omit<InterestRateChange, 'id'> } }
  | { type: 'ADD_CUSTOM_EMI_CHANGE'; payload: { loanId: string; change: Omit<CustomEMIChange, 'id'> } }
  | { type: 'ADD_DISBURSEMENT'; payload: { loanId: string; disbursement: Omit<Disbursement, 'id'> } }; 

export interface AmortizationEntry {
  monthNumber: number;
  paymentDate: string; 
  openingBalance: number;
  emi: number; 
  principalPaid: number;
  interestPaid: number; 
  closingBalance: number;
  isPreEMIPeriod?: boolean; 
  disbursements?: Array<{ id: string; amount: number }>;
  prepayments?: Array<{ id: string; amount: number; adjustmentPreference?: 'adjustTenure' | 'adjustEMI' }>; 
  roiChanges?: Array<{ id: string; newRate: number; preference?: string }>;
  emiChanges?: Array<{ id: string; newEMI: number }>;
}

export interface AnnualSummary {
  yearLabel: string; 
  startYear: number; 
  totalPrincipalPaid: number;
  totalInterestPaid: number; 
  totalPreEMIInterestPaid: number; 
  totalPrepaymentsMade: number; 
  totalPayment: number;
  deductiblePrincipal: number; 
  deductibleInterest: number; 
}

export interface LifespanSummary {
  totalPrincipalPaid: number;
  totalInterestPaid: number; 
  totalPreEMIInterestPaid: number; 
  totalPayment: number;
  actualTenureMonths: number;
  totalDeductiblePrincipal: number;
  totalDeductibleInterest: number; 
}

export interface CurrentSummary {
  monthsElapsed: number;
  totalPrincipalPaid: number; 
  totalInterestPaid: number; 
  totalPreEMIInterestPaid: number; 
  totalPayment: number;
  totalDeductiblePrincipal: number; 
  totalDeductibleInterest: number; 
  currentOutstandingBalance: number;
  uncappedTotalPrincipalPaid: number; 
  uncappedTotalInterestPaid: number; 
}

// --- Test Case Related Types ---
export type TestEvent = 
  | { eventType: 'DISBURSEMENT'; date: string; amount: number; remarks?: string }
  | { eventType: 'ROI_CHANGE'; date: string; newRate: number; adjustmentPreference?: 'adjustTenure' | 'adjustEMI' | 'customEMI'; newEMIIfApplicable?: number }
  | { eventType: 'CUSTOM_EMI'; date: string; newEMI: number; remarks?: string }
  | { eventType: 'PREPAYMENT'; date: string; amount: number; adjustmentPreference?: 'adjustTenure' | 'adjustEMI'; remarks?: string };
  // Note: 'PAYMENT' of type 'EMI' is not an event here, it's an outcome or a custom EMI.

export interface ExpectedScheduleEntry {
  monthNumber: number;
  openingBalance?: number;
  emi?: number;
  principalPaid?: number;
  interestPaid?: number;
  closingBalance?: number;
  isPreEMIPeriod?: boolean;
}

export interface ExpectedResults {
  lifespanSummary?: Partial<LifespanSummary>;
  annualSummaries?: Array<Partial<AnnualSummary> & { yearLabel: string }>; // yearLabel is key for matching
  scheduleEntryChecks?: ExpectedScheduleEntry[];
  finalEMI?: number;
  finalTenure?: number; // Actual tenure in months
}

export interface TestCaseJson {
  testName: string;
  initialLoanDetails: LoanDetails;
  events: TestEvent[];
  expectedResults: ExpectedResults;
}
