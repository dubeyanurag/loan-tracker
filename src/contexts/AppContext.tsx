// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Loan, Payment, InterestRateChange, CustomEMIChange, Disbursement } from '../types'; 
import { v4 as uuidv4 } from 'uuid'; 

const LOCAL_STORAGE_KEY = 'homeLoanTrackerAppState';

// Initial state 
export const initialState: AppState = { 
  loans: [],
  selectedLoanId: null,
};

// Reducer manages AppState
export const appReducer = (state: AppState, action: AppAction): AppState => { 
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...initialState, ...action.payload };
    case 'ADD_LOAN':
      return {
        ...state,
        loans: [...state.loans, action.payload],
        selectedLoanId: action.payload.id, 
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
      const remainingLoans = state.loans.filter((loan) => loan.id !== action.payload);
      return {
        ...state,
        loans: remainingLoans,
        selectedLoanId: state.selectedLoanId === action.payload 
                        ? (remainingLoans.length > 0 ? remainingLoans[0].id : null) 
                        : state.selectedLoanId,
      };
    
    case 'ADD_PAYMENT': {
      const { loanId, payment } = action.payload;
      const newPayment: Payment = {
        ...payment,
        id: uuidv4(),
        principalPaid: 0, 
        interestPaid: 0,  
        balanceAfterPayment: 0, 
      };
      return {
        ...state,
        loans: state.loans.map(loan => 
          loan.id === loanId 
            ? { ...loan, paymentHistory: [...(loan.paymentHistory || []), newPayment] } 
            : loan
        ),
      };
    }
    case 'ADD_INTEREST_RATE_CHANGE': {
        const { loanId, change } = action.payload;
        const newChange: InterestRateChange = { ...change, id: uuidv4() };
        return {
            ...state,
            loans: state.loans.map(loan => 
                loan.id === loanId
                ? { ...loan, interestRateChanges: [...(loan.interestRateChanges || []), newChange] }
                : loan
            ),
        };
    }
    case 'ADD_CUSTOM_EMI_CHANGE': {
        const { loanId, change } = action.payload;
        const newChange: CustomEMIChange = { ...change, id: uuidv4() };
        return {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                ? { ...loan, customEMIChanges: [...(loan.customEMIChanges || []), newChange] }
                : loan
            ),
        };
    }
    case 'ADD_DISBURSEMENT': {
        const { loanId, disbursement } = action.payload;
        const newDisbursement: Disbursement = { ...disbursement, id: uuidv4() };
        return {
            ...state,
            loans: state.loans.map(loan =>
                loan.id === loanId
                ? { 
                    ...loan, 
                    details: { 
                        ...loan.details, 
                        disbursements: [...(loan.details.disbursements || []), newDisbursement] 
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

const AppStateContext = createContext<AppState | undefined>(undefined); // Uses AppState
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

const isValidAppState = (data: any): data is AppState => {
    return data && typeof data === 'object' && Array.isArray(data.loans) && 
           (data.selectedLoanId === null || typeof data.selectedLoanId === 'string');
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    let loadedState: AppState = initial; // Start with initial AppState

    // Check for loadState URL parameter (for sharing state)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const base64State = urlParams.get('loadState');
        if (base64State) {
            console.log("Found loadState in URL parameter.");
            const jsonState = atob(base64State);
            const parsedStateFromUrl = JSON.parse(jsonState);
            if (isValidAppState(parsedStateFromUrl)) {
                console.log("Successfully parsed state from URL for merging/loading.");
                // Merge logic: URL state takes precedence for shared loans
                let existingStateFromStorage = initial;
                 try {
                    const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (storedState) {
                        const parsedLocalStorageState = JSON.parse(storedState);
                        if (isValidAppState(parsedLocalStorageState)) {
                            existingStateFromStorage = parsedLocalStorageState;
                        }
                    }
                } catch (e) { /* ignore */ }

                const urlLoansMap = new Map<string, Loan>();
                parsedStateFromUrl.loans.forEach(loan => urlLoansMap.set(loan.id, loan));
                
                const mergedLoans = existingStateFromStorage.loans.filter(l => !urlLoansMap.has(l.id));
                mergedLoans.push(...parsedStateFromUrl.loans);
                
                loadedState = {
                    loans: mergedLoans,
                    selectedLoanId: parsedStateFromUrl.loans.length > 0 ? parsedStateFromUrl.loans[0].id : (mergedLoans.length > 0 ? mergedLoans[0].id : null)
                };
            } else {
                console.warn("Invalid AppState structure from loadState URL parameter.");
            }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash); 
        } else {
            // Fallback to localStorage if no loadState URL param
            try {
              const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (storedState) {
                const parsedState = JSON.parse(storedState);
                 if (isValidAppState(parsedState)) {
                    console.log("Successfully loaded state from localStorage.");
                    loadedState = parsedState;
                 } else {
                     console.warn("Invalid state structure found in localStorage.");
                 }
              }
            } catch (error) {
              console.error("Error loading state from localStorage:", error);
            }
        }
    } catch (error) {
        console.error("Error processing URL parameters or localStorage:", error);
        // Fallback to initial or localStorage if URL processing fails catastrophically
         try {
            const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                if (isValidAppState(parsedState)) loadedState = parsedState;
            }
        } catch (e) { /* ignore */ }
    }
    
    return loadedState; // Returns AppState
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
