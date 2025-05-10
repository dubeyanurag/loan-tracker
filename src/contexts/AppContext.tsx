// src/contexts/AppContext.tsx
import React, { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { AppState, AppAction, Loan, Payment, InterestRateChange, CustomEMIChange, Disbursement, TestCaseJson } from '../types'; 
import { v4 as uuidv4 } from 'uuid'; 

const LOCAL_STORAGE_KEY = 'homeLoanTrackerAppState';

// Define the shape of the context state, including testCaseData
interface AppContextShape extends AppState {
  testCaseData?: TestCaseJson | null;
}

// Initial state should conform to AppContextShape
export const initialContextState: AppContextShape = { 
  loans: [],
  selectedLoanId: null,
  testCaseData: null, // Initialize testCaseData
};

// Reducer now manages AppContextShape
export const appReducer = (state: AppContextShape, action: AppAction): AppContextShape => { 
  switch (action.type) {
    case 'LOAD_STATE':
      // When loading state, ensure it's compatible with AppContextShape
      return { ...initialContextState, ...action.payload, testCaseData: state.testCaseData }; // Preserve testCaseData if already set
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
        principalPaid: 0, // Placeholder, will be calculated by schedule
        interestPaid: 0,  // Placeholder
        balanceAfterPayment: 0, // Placeholder
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

const AppStateContext = createContext<AppContextShape | undefined>(undefined);
const AppDispatchContext = createContext<React.Dispatch<AppAction> | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

const isValidAppState = (data: any): data is AppState => {
    return data && typeof data === 'object' && Array.isArray(data.loans) && 
           (data.selectedLoanId === null || typeof data.selectedLoanId === 'string');
};

const isValidTestCaseJson = (data: any): data is TestCaseJson => {
    return data && typeof data.testName === 'string' && 
           data.initialLoanDetails && typeof data.initialLoanDetails === 'object' &&
           Array.isArray(data.events) &&
           data.expectedResults && typeof data.expectedResults === 'object';
};


export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialContextState, (initial) => {
    let loadedState: AppState = { loans: initial.loans, selectedLoanId: initial.selectedLoanId };
    let parsedTestCase: TestCaseJson | null = null;
    const urlParams = new URLSearchParams(window.location.search); // Define urlParams here

    // 1. Check for testCase URL parameter
    try {
        // const urlParams = new URLSearchParams(window.location.search); // Moved up
        const base64TestCase = urlParams.get('testCase');
        if (base64TestCase) {
            console.log("Found testCase in URL parameter.");
            const jsonTestCase = atob(base64TestCase);
            const tempParsedTestCase = JSON.parse(jsonTestCase);
            if (isValidTestCaseJson(tempParsedTestCase)) {
                parsedTestCase = tempParsedTestCase;
                console.log("Successfully parsed testCase from URL.", parsedTestCase);
            } else {
                console.warn("Invalid TestCaseJson structure from URL.");
            }
            // Clear the URL parameter after attempting to load
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash); 
        }
    } catch (error) {
        console.error("Error processing testCase from URL parameter:", error);
    }

    // 2. If not in test mode, check for loadState URL parameter
    if (!parsedTestCase) {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const base64State = urlParams.get('loadState');
            if (base64State) {
                console.log("Found loadState in URL parameter.");
                const jsonState = atob(base64State);
                const parsedStateFromUrl = JSON.parse(jsonState);
                if (isValidAppState(parsedStateFromUrl)) {
                    console.log("Successfully parsed state from URL for merging/loading.");
                    // Merge logic (simplified: URL state takes precedence for shared loans)
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
            }
        } catch (error) {
            console.error("Error processing loadState from URL parameter:", error);
        }
    }

    // 3. If no URL parameters handled state, fallback to localStorage
    if (!parsedTestCase && !urlParams.get('loadState')) { // Check if loadState was processed
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
    
    return { ...initial, ...loadedState, testCaseData: parsedTestCase };
  });

  useEffect(() => {
    // Save only the AppState part, not testCaseData to localStorage
    const { testCaseData, ...stateToSave } = state;
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

// Custom Hooks for AppState (not AppContextShape directly for external consumers)
export const useAppState = (): AppState => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  // Exclude testCaseData for general app consumption
  const { testCaseData, ...appState } = context;
  return appState;
};

// Hook to get the full context shape including testCaseData (for App.tsx)
export const useAppContextShape = (): AppContextShape => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
      throw new Error('useAppContextShape must be used within an AppProvider');
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
