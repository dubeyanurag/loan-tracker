// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Loan, Payment, InterestRateChange, CustomEMIChange, Disbursement } from '../types'; 
import { v4 as uuidv4 } from 'uuid'; 

const LOCAL_STORAGE_KEY = 'homeLoanTrackerAppState';

// Add editingLoanId to AppState interface
export interface AppStateWithEdit extends AppState {
  editingLoanId?: string | null; 
}

// Initial state includes editingLoanId
export const initialState: AppStateWithEdit = { 
  loans: [],
  selectedLoanId: null,
  editingLoanId: null, // Initialize editingLoanId
};

// Reducer manages AppStateWithEdit
export const appReducer = (state: AppStateWithEdit, action: AppAction): AppStateWithEdit => { 
  switch (action.type) {
    case 'LOAD_STATE':
      // When loading state, ensure it's compatible and includes editingLoanId
      const loadedState = action.payload as AppState; // Assuming payload is AppState
      return { ...initialState, ...loadedState, editingLoanId: null }; // Reset editingLoanId on load
    case 'ADD_LOAN':
      return {
        ...state,
        loans: [...state.loans, action.payload],
        selectedLoanId: action.payload.id, 
        editingLoanId: null, // Ensure editing is reset
      };
    case 'SELECT_LOAN':
      return {
        ...state,
        selectedLoanId: action.payload,
        editingLoanId: null, // Reset editing when selecting a new loan
      };
    case 'UPDATE_LOAN':
      return {
        ...state,
        loans: state.loans.map((loan) =>
          loan.id === action.payload.id ? action.payload : loan
        ),
        // editingLoanId: null, // Keep editingLoanId as is, form submission handles closing
      };
    case 'DELETE_LOAN':
      const remainingLoans = state.loans.filter((loan) => loan.id !== action.payload);
      let newSelectedLoanId = state.selectedLoanId;
      let newEditingLoanId = state.editingLoanId;

      if (state.selectedLoanId === action.payload) {
        newSelectedLoanId = remainingLoans.length > 0 ? remainingLoans[0].id : null;
      }
      if (state.editingLoanId === action.payload) { // If the loan being edited is deleted
        newEditingLoanId = null;
      }
      return {
        ...state,
        loans: remainingLoans,
        selectedLoanId: newSelectedLoanId,
        editingLoanId: newEditingLoanId,
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
    case 'START_EDIT_LOAN':
      return {
        ...state,
        editingLoanId: action.payload,
      };
    case 'END_EDIT_LOAN':
      return {
        ...state,
        editingLoanId: null,
      };
    case 'DELETE_PAYMENT':
      return {
        ...state,
        loans: state.loans.map(loan => 
          loan.id === action.payload.loanId
            ? { ...loan, paymentHistory: loan.paymentHistory.filter(p => p.id !== action.payload.paymentId) }
            : loan
        ),
      };
    case 'DELETE_ROI_CHANGE':
      return {
        ...state,
        loans: state.loans.map(loan =>
          loan.id === action.payload.loanId
            ? { ...loan, interestRateChanges: loan.interestRateChanges.filter(c => c.id !== action.payload.changeId) }
            : loan
        ),
      };
    case 'DELETE_CUSTOM_EMI_CHANGE':
      return {
        ...state,
        loans: state.loans.map(loan =>
          loan.id === action.payload.loanId
            ? { ...loan, customEMIChanges: loan.customEMIChanges.filter(c => c.id !== action.payload.changeId) }
            : loan
        ),
      };
    case 'DELETE_DISBURSEMENT':
      // Prevent deleting the very first disbursement if it's the only one.
      // Or ensure loan details are updated if principal becomes zero.
      // For now, simple filter. Consider implications.
      return {
        ...state,
        loans: state.loans.map(loan => {
          if (loan.id === action.payload.loanId) {
            const newDisbursements = loan.details.disbursements.filter(d => d.id !== action.payload.disbursementId);
            // Ensure there's at least one disbursement, or handle loan deletion/invalidation
            if (newDisbursements.length === 0 && loan.details.disbursements.length > 0) {
              // Optionally, alert user or prevent deletion of the last disbursement
              // For now, allowing it might lead to an invalid loan state if not handled carefully by UI/calculator
              console.warn("Attempting to delete the last disbursement. This might lead to an invalid loan state.");
            }
            return { 
              ...loan, 
              details: { 
                ...loan.details, 
                disbursements: newDisbursements
              } 
            };
          }
          return loan;
        }),
      };
    default:
      return state;
  }
};

// Context now uses AppStateWithEdit
const AppStateContext = createContext<AppStateWithEdit | undefined>(undefined); 
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// isValidAppState needs to check AppState, not AppStateWithEdit for localStorage/URL load
const isValidAppState = (data: any): data is AppState => { 
    return data && typeof data === 'object' && Array.isArray(data.loans) && 
           (data.selectedLoanId === null || typeof data.selectedLoanId === 'string');
};

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    let loadedStateCore: AppState = { loans: initial.loans, selectedLoanId: initial.selectedLoanId };

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const base64State = urlParams.get('loadState');
        if (base64State) {
            console.log("Found loadState in URL parameter.");
            const jsonState = atob(base64State);
            const parsedStateFromUrl = JSON.parse(jsonState);
            if (isValidAppState(parsedStateFromUrl)) {
                console.log("Successfully parsed state from URL for merging/loading.");
                let existingStateFromStorage: AppState = { loans: [], selectedLoanId: null };
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
                
                loadedStateCore = {
                    loans: mergedLoans,
                    selectedLoanId: parsedStateFromUrl.loans.length > 0 ? parsedStateFromUrl.loans[0].id : (mergedLoans.length > 0 ? mergedLoans[0].id : null)
                };
            } else {
                console.warn("Invalid AppState structure from loadState URL parameter.");
            }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash); 
        } else {
            try {
              const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (storedState) {
                const parsedState = JSON.parse(storedState);
                 if (isValidAppState(parsedState)) {
                    console.log("Successfully loaded state from localStorage.");
                    loadedStateCore = parsedState;
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
         try {
            const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                if (isValidAppState(parsedState)) loadedStateCore = parsedState;
            }
        } catch (e) { /* ignore */ }
    }
    
    // Combine loaded core state with initial editingLoanId
    return { ...initial, ...loadedStateCore, editingLoanId: initial.editingLoanId }; 
  });

  useEffect(() => {
    // Save only the AppState part to localStorage
    const { editingLoanId, ...stateToSave } = state; 
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
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

// useAppState now returns AppStateWithEdit for internal use where needed (like App.tsx)
export const useAppStateWithEdit = (): AppStateWithEdit => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppStateWithEdit must be used within an AppProvider');
  }
  return context;
};

// Original useAppState for components that don't need editingLoanId
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  const { editingLoanId, ...appState } = context; // Exclude editingLoanId
  return appState;
};


export const useAppDispatch = (): React.Dispatch<AppAction> => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
