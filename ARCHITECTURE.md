# Loan Tracker - Architecture Overview

This document provides a high-level overview of the application's architecture.

## Core Concepts

*   **Component-Based UI:** Built using React functional components and hooks.
*   **Centralized State:** Application state (list of loans, selected loan ID) is managed globally using React Context API and a `useReducer` hook (`AppContext`).
*   **Data Persistence:** The application state is saved to the browser's `localStorage` on every change and loaded on initial startup.
*   **Utility Functions:** Core financial calculations (EMI, totals, amortization logic) are separated into utility functions (`loanCalculations.ts`, `amortizationCalculator.ts`).
*   **Event-Driven Updates:** User actions (adding loans, logging payments/adjustments) dispatch actions to the reducer, which updates the state, triggering re-renders of affected components.

## Block Diagram (Mermaid)

```mermaid
graph TD
    subgraph UI [User Interface (React Components)]
        App[App.tsx] --> CtxProvider(AppContext Provider);
        CtxProvider --> LoanForm[LoanForm.tsx];
        CtxProvider --> LoanList[LoanList.tsx];
        CtxProvider --> LoanDetailsDisplay[LoanDetailsDisplay.tsx];
        CtxProvider --> ShareState[ShareState.tsx]; %% Added ShareState
        CtxProvider --> OverallSummary[OverallSummary.tsx]; %% Added OverallSummary
        
        LoanDetailsDisplay --> AddDisbursementForm[AddDisbursementForm.tsx];
        %% LoanDetailsDisplay --> PrepaymentSimulator[PrepaymentSimulator.tsx]; %% Removed
        LoanDetailsDisplay --> LoanSummaries[LoanSummaries.tsx];
        LoanDetailsDisplay --> LoanChart[LoanChart.tsx];
        LoanDetailsDisplay --> AmortizationTable[AmortizationTable.tsx];
        LoanDetailsDisplay --> EditLoanDetailsForm[EditLoanDetailsForm.tsx]; %% Added Edit Form

        LoanForm -- dispatch ADD_LOAN --> Reducer;
        LoanList -- dispatch SELECT_LOAN/DELETE_LOAN --> Reducer;
        AddDisbursementForm -- dispatch ADD_DISBURSEMENT --> Reducer;
        AmortizationTable -- dispatch ADD_PAYMENT/ADD_INTEREST_RATE_CHANGE/ADD_CUSTOM_EMI_CHANGE --> Reducer;
        AmortizationTable -- dispatch UPDATE_LOAN --> Reducer; %% For Event Deletion
        LoanDetailsDisplay -- triggers Edit --> EditLoanDetailsForm; %% Edit Trigger
        EditLoanDetailsForm -- dispatch UPDATE_LOAN --> Reducer; %% Edit Save
    end

    subgraph StateMgmt [State Management]
        CtxProvider -- contains --> State(AppState: loans[], selectedLoanId);
        CtxProvider -- contains --> Reducer(appReducer);
        Reducer -- updates --> State;
        State -- persists --> LocalStorage[(localStorage)];
        LocalStorage -- loads --> State;
        App -- reads URL Param --> State; %% URL Load
        ShareState -- reads --> State; %% Share Button
    end
    
    subgraph Utils [Utilities]
        UtilsCalc[loanCalculations.ts];
        UtilsAmort[amortizationCalculator.ts];
    end

    %% Component Dependencies on Utilities/State
    LoanDetailsDisplay -- uses --> UtilsAmort;
    LoanDetailsDisplay -- uses --> UtilsCalc;
    LoanSummaries -- uses --> UtilsAmort;
    LoanChart -- uses --> UtilsAmort;
    AmortizationTable -- uses --> UtilsAmort; 
    %% PrepaymentSimulator -- uses --> UtilsCalc; %% Removed
    OverallSummary -- uses --> UtilsAmort;
    OverallSummary -- uses --> UtilsCalc;
    
    %% State Usage
    LoanForm -- reads --> State; 
    LoanList -- reads --> State;
    LoanDetailsDisplay -- reads --> State;
    AddDisbursementForm -- reads --> State;
    %% PrepaymentSimulator -- reads --> State; %% Removed
    AmortizationTable -- reads --> State; 
    LoanChart -- reads --> State; 
    LoanSummaries -- reads --> State; 
    ShareState -- reads --> State;
    OverallSummary -- reads --> State;

    %% Styling (Implicit)
    %% Components --> StyledComponents[styled-components];
```

## Data Flow Example (Adding a Prepayment via Table)

1.  User clicks "Prepay" button on a row in `AmortizationTable`.
2.  `handleAddPrepayment` handler in `AmortizationTable` is called.
3.  `window.prompt` gets the amount.
4.  `dispatch({ type: 'ADD_PAYMENT', payload: { ... } })` is called.
5.  `appReducer` in `AppContext` receives the action.
6.  Reducer finds the correct loan in the `loans` array and adds the new payment object to its `paymentHistory`.
7.  Reducer returns the new `AppState`.
8.  `AppProvider` updates its state, causing components consuming the context to re-render.
9.  `LoanDetailsDisplay` re-renders.
10. `useMemo` hook for `amortizationSchedule` re-runs `generateAmortizationSchedule` with the updated `loan` object.
11. `AmortizationTable`, `LoanSummaries`, `LoanChart` receive the new schedule and update their display.
12. The updated `AppState` is saved to `localStorage` via the `useEffect` hook in `AppProvider`.
