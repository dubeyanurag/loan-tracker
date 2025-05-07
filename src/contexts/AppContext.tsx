// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Loan } from '../types'; // Assuming types.ts is in src/
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

const LOCAL_STORAGE_KEY = 'homeLoanTrackerAppState';

const initialState: AppState = {
  loans: [],
  selectedLoanId: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;
    case 'ADD_LOAN':
      return {
        ...state,
        loans: [...state.loans, action.payload],
        selectedLoanId: action.payload.id, // Auto-select new loan
      };
    case 'SELECT_LOAN':
      return {
        ...state,
        selectedLoanId: action.payload,
      };
    case 'UPDATE_LOAN':
      return {
        ...state,
        loans: state.loans.map((loan) =>
          loan.id === action.payload.id ? action.payload : loan
        ),
      };
    case 'DELETE_LOAN':
      return {
        ...state,
        loans: state.loans.filter((loan) => loan.id !== action.payload),
        selectedLoanId: state.selectedLoanId === action.payload ? null : state.selectedLoanId,
      };
    
    // More specific update actions for a selected loan
    case 'ADD_PAYMENT': {
      const { loanId, payment } = action.payload;
      return {
        ...state,
        loans: state.loans.map(loan => 
          loan.id === loanId 
            ? { ...loan, paymentHistory: [...loan.paymentHistory, { ...payment, id: uuidv4() }] } 
            : loan
        ),
      };
    }
    case 'ADD_PRE_EMI_PAYMENT': {
      const { loanId, payment } = action.payload;
      return {
        ...state,
        loans: state.loans.map(loan =>
          loan.id === loanId
            ? { ...loan, preEMIInterestPayments: [...loan.preEMIInterestPayments, { ...payment, id: uuidv4() }] }
            : loan
        ),
      };
    }
    case 'ADD_INTEREST_RATE_CHANGE': {
        const { loanId, change } = action.payload;
        return {
            ...state,
            loans: state.loans.map(loan => 
                loan.id === loanId
                ? { ...loan, interestRateChanges: [...loan.interestRateChanges, { ...change, id: uuidv4() }] }
                : loan
            ),
        };
    }
    case 'ADD_CUSTOM_EMI_CHANGE': {
        const { loanId, change } = action.payload;
        return {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                ? { ...loan, customEMIChanges: [...loan.customEMIChanges, { ...change, id: uuidv4() }] }
                : loan
            ),
        };
    }
    case 'ADD_DISBURSEMENT': {
        const { loanId, disbursement } = action.payload;
        return {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                ? { 
                    ...loan, 
                    details: { 
                        ...loan.details, 
                        // Add new disbursement, ensuring array exists
                        disbursements: [...(loan.details.disbursements || []), { ...disbursement, id: uuidv4() }] 
                    } 
                  }
                : loan
            ),
        };
    }
    default:
      return state;
  }
};

// Create Contexts
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        return JSON.parse(storedState) as AppState;
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
    }
  }, [state]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

// Custom Hooks
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

export const useAppDispatch = (): React.Dispatch<AppAction> => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
