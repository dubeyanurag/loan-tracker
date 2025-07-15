// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, Dispatch, ReactNode } from 'react';
import { AppState, AppAction, Payment, InterestRateChange, CustomEMIChange, Disbursement } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UIState {
  editingLoanId: string | null;
}

export interface AppStateWithEdit extends AppState, UIState {}

const initialUIState: UIState = {
  editingLoanId: null,
};

const FY_START_MONTH_DEFAULT = 3; // April (0-indexed March)

const loadInitialState = (): AppState => {
  try {
    const serializedState = localStorage.getItem('loanAppState');
    if (serializedState === null) {
      return {
        loans: [],
        selectedLoanId: null,
        currency: 'INR', 
        fyStartMonth: FY_START_MONTH_DEFAULT, 
      };
    }
    const storedState = JSON.parse(serializedState);
    return {
        ...storedState,
        currency: storedState.currency || 'INR',
        fyStartMonth: storedState.fyStartMonth ?? FY_START_MONTH_DEFAULT, // Handle missing fyStartMonth
    };
  } catch (error) {
    console.error("Could not load state from localStorage", error);
    return {
      loans: [],
      selectedLoanId: null,
      currency: 'INR',
      fyStartMonth: FY_START_MONTH_DEFAULT,
    };
  }
};


export const initialState: AppStateWithEdit = {
  ...loadInitialState(),
  ...initialUIState,
};


const AppContext = createContext<{
  state: AppStateWithEdit;
  dispatch: Dispatch<AppAction>;
} | undefined>(undefined);

export const appReducer = (state: AppStateWithEdit = initialState, action: AppAction): AppStateWithEdit => {
  let newState: AppStateWithEdit;
  switch (action.type) {
    case 'ADD_LOAN':
      newState = { 
        ...state, 
        loans: [...state.loans, action.payload],
        selectedLoanId: action.payload.id // Auto-select the newly added loan
      };
      break;
    case 'SELECT_LOAN':
      newState = { ...state, selectedLoanId: action.payload };
      break;
    case 'UPDATE_LOAN':
      newState = {
        ...state,
        loans: state.loans.map(loan =>
          loan.id === action.payload.id ? action.payload : loan
        ),
        editingLoanId: null, 
      };
      break;
    case 'DELETE_LOAN': {
      const remainingLoans = state.loans.filter(loan => loan.id !== action.payload);
      let newSelectedLoanId = state.selectedLoanId;
      
      // If the deleted loan was selected, select the first remaining loan (or null if none)
      if (state.selectedLoanId === action.payload) {
        newSelectedLoanId = remainingLoans.length > 0 ? remainingLoans[0].id : null;
      }
      
      newState = {
        ...state,
        loans: remainingLoans,
        selectedLoanId: newSelectedLoanId,
      };
      break;
    }
    case 'LOAD_STATE':
      newState = { 
        ...state, 
        loans: action.payload.loans, 
        selectedLoanId: action.payload.selectedLoanId,
        currency: action.payload.currency || 'INR', 
        fyStartMonth: action.payload.fyStartMonth ?? FY_START_MONTH_DEFAULT, // Handle missing fyStartMonth
      };
      break;
    case 'ADD_PAYMENT': {
        const { loanId, payment } = action.payload;
        const newPayment: Payment = {
            ...payment, id: uuidv4(), principalPaid: 0, interestPaid: 0, balanceAfterPayment: 0,
        };
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                    ? { ...loan, paymentHistory: [...(loan.paymentHistory || []), newPayment] }
                    : loan
            ),
        };
        break;
    }
    case 'ADD_INTEREST_RATE_CHANGE': {
        const { loanId, change } = action.payload;
        const newChange: InterestRateChange = { ...change, id: uuidv4() };
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                    ? { ...loan, interestRateChanges: [...(loan.interestRateChanges || []), newChange] }
                    : loan
            ),
        };
        break;
    }
    case 'ADD_CUSTOM_EMI_CHANGE': {
        const { loanId, change } = action.payload;
        const newEmiChange: CustomEMIChange = { ...change, id: uuidv4() };
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                    ? { ...loan, customEMIChanges: [...(loan.customEMIChanges || []), newEmiChange] }
                    : loan
            ),
        };
        break;
    }
    case 'ADD_DISBURSEMENT': {
        const { loanId, disbursement } = action.payload;
        const newDisbursement: Disbursement = { ...disbursement, id: uuidv4() };
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                    ? { ...loan, details: { ...loan.details, disbursements: [...loan.details.disbursements, newDisbursement] } }
                    : loan
            ),
        };
        break;
    }
    case 'START_EDIT_LOAN':
        newState = { ...state, editingLoanId: action.payload };
        break;
    case 'END_EDIT_LOAN':
        newState = { ...state, editingLoanId: null };
        break;
    case 'DELETE_PAYMENT':
        newState = {
            ...state,
            loans: state.loans.map(loan => 
                loan.id === action.payload.loanId 
                ? { ...loan, paymentHistory: loan.paymentHistory.filter(p => p.id !== action.payload.paymentId) }
                : loan
            )
        };
        break;
    case 'DELETE_ROI_CHANGE':
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === action.payload.loanId
                ? { ...loan, interestRateChanges: loan.interestRateChanges.filter(c => c.id !== action.payload.changeId) }
                : loan
            )
        };
        break;
    case 'DELETE_CUSTOM_EMI_CHANGE':
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === action.payload.loanId
                ? { ...loan, customEMIChanges: loan.customEMIChanges.filter(c => c.id !== action.payload.changeId) }
                : loan
            )
        };
        break;
    case 'DELETE_DISBURSEMENT':
        newState = {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === action.payload.loanId
                ? { ...loan, details: { ...loan.details, disbursements: loan.details.disbursements.filter(d => d.id !== action.payload.disbursementId)} }
                : loan
            )
        };
        break;
    case 'SET_CURRENCY':
        newState = { ...state, currency: action.payload };
        break;
    case 'SET_FY_START_MONTH': // Handle new action
        newState = { ...state, fyStartMonth: action.payload };
        break;
    default:
      newState = state;
  }

  const { editingLoanId, ...persistedState } = newState;
  localStorage.setItem('loanAppState', JSON.stringify(persistedState));

  return newState;
};

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = (): AppState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  const { editingLoanId, ...appState } = context.state;
  return appState;
};

export const useAppStateWithEdit = (): AppStateWithEdit => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStateWithEdit must be used within an AppProvider');
    }
    return context.state;
};

export const useAppDispatch = (): Dispatch<AppAction> => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context.dispatch;
};
