// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction } from '../types'; // Removed unused Loan import
import { v4 as uuidv4 } from 'uuid'; 

const LOCAL_STORAGE_KEY = 'homeLoanTrackerAppState';

// Export for testing
export const initialState: AppState = { 
  loans: [],
  selectedLoanId: null,
};

// Export for testing
export const appReducer = (state: AppState, action: AppAction): AppState => { 
  switch (action.type) {
    case 'LOAD_STATE':
      // TODO: Add validation/migration logic if needed when loading from localStorage
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
            // Ensure paymentHistory exists before spreading
            ? { ...loan, paymentHistory: [...(loan.paymentHistory || []), { ...payment, id: uuidv4() }] } 
            : loan
        ),
      };
    }
    // Removed ADD_PRE_EMI_PAYMENT case
    case 'ADD_INTEREST_RATE_CHANGE': {
        const { loanId, change } = action.payload;
        return {
            ...state,
            loans: state.loans.map(loan => 
                loan.id === loanId
                // Ensure interestRateChanges exists before spreading
                ? { ...loan, interestRateChanges: [...(loan.interestRateChanges || []), { ...change, id: uuidv4() }] }
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
                // Ensure customEMIChanges exists before spreading
                ? { ...loan, customEMIChanges: [...(loan.customEMIChanges || []), { ...change, id: uuidv4() }] }
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
                        // Ensure disbursements array exists before spreading
                        disbursements: [...(loan.details.disbursements || []), { ...disbursement, id: uuidv4() }] 
                    } 
                  }
                : loan
            ),
        };
    }
    default:
      // Ensure exhaustive check for action types if necessary, or just return state
      // const _exhaustiveCheck: never = action; // Uncomment for exhaustive check
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
        // TODO: Add validation/migration logic for loaded state
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
