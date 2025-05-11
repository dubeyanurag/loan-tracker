// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, Dispatch, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Payment, InterestRateChange, CustomEMIChange, Disbursement } from '../types'; // Removed Loan
import { v4 as uuidv4 } from 'uuid';

// Separate state for UI concerns like editing, not persisted or shared
interface UIState {
  editingLoanId: string | null;
}

export interface AppStateWithEdit extends AppState, UIState {}

const initialUIState: UIState = {
  editingLoanId: null,
};

// Function to load initial state from localStorage
const loadInitialState = (): AppState => {
  try {
    const serializedState = localStorage.getItem('loanAppState');
    if (serializedState === null) {
      return {
        loans: [],
        selectedLoanId: null,
        currency: 'INR', // Default currency
      };
    }
    const storedState = JSON.parse(serializedState);
    return {
        ...storedState,
        currency: storedState.currency || 'INR' // Ensure currency exists
    };
  } catch (error) {
    console.error("Could not load state from localStorage", error);
    return {
      loans: [],
      selectedLoanId: null,
      currency: 'INR',
    };
  }
};


export const initialState: AppStateWithEdit = { // Export initialState
  ...loadInitialState(),
  ...initialUIState,
};


const AppContext = createContext<{
  state: AppStateWithEdit;
  dispatch: Dispatch<AppAction>;
} | undefined>(undefined);

export const appReducer = (state: AppStateWithEdit = initialState, action: AppAction): AppStateWithEdit => { // Export appReducer and provide default state
  let newState: AppStateWithEdit;
  switch (action.type) {
    case 'ADD_LOAN':
      newState = { ...state, loans: [...state.loans, action.payload] };
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
        editingLoanId: null, // Ensure editing mode is exited
      };
      break;
    case 'DELETE_LOAN':
      newState = {
        ...state,
        loans: state.loans.filter(loan => loan.id !== action.payload),
        selectedLoanId: state.selectedLoanId === action.payload ? null : state.selectedLoanId,
      };
      break;
    case 'LOAD_STATE':
      // When loading state, only load AppState properties, keep UIState separate
      newState = { 
        ...state, // Retain current UI state like editingLoanId
        loans: action.payload.loans, 
        selectedLoanId: action.payload.selectedLoanId,
        currency: action.payload.currency || 'INR', // Ensure currency is loaded or defaulted
      };
      break;
    case 'ADD_PAYMENT': {
        const { loanId, payment } = action.payload;
        const newPayment: Payment = {
            ...payment,
            id: uuidv4(),
            principalPaid: 0, // These will be determined by amortization logic
            interestPaid: 0,
            balanceAfterPayment: 0,
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
    
    // Deletion cases
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
    default:
      newState = state;
  }

  // Save to localStorage after every action that modifies persisted state
  // Exclude UI state like editingLoanId from being saved
  const { editingLoanId, ...persistedState } = newState;
  localStorage.setItem('loanAppState', JSON.stringify(persistedState));
  if (action.type === 'SET_CURRENCY') { // Also save currency specifically if needed elsewhere
    localStorage.setItem('loanAppCurrency', newState.currency);
  }


  return newState;
};

export const AppProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Effect to load currency from its specific localStorage item if loanAppState doesn't have it
  // This handles the case where 'loanAppCurrency' might be set by an older version of the app
  // or if 'loanAppState' was cleared but 'loanAppCurrency' remains.
  useEffect(() => {
    const storedCurrency = localStorage.getItem('loanAppCurrency');
    if (storedCurrency && storedCurrency !== state.currency) {
        // Only dispatch if it's different to avoid loop & if it's a valid known currency (optional check)
        dispatch({ type: 'SET_CURRENCY', payload: storedCurrency });
    }
  }, []); // Runs once on mount


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
  // Return only the AppState part, excluding UIState
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
