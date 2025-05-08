# Loan Tracker - Architecture Overview

This document provides a high-level overview of the application's architecture.

## Core Concepts

*   **Component-Based UI:** Built using React functional components and hooks.
*   **Centralized State:** Application state (list of loans, selected loan ID) is managed globally using React Context API and a `useReducer` hook (`AppContext`).
*   **Data Persistence:** The application state is saved to the browser's `localStorage` on every change and loaded on initial startup.
*   **Utility Functions:** Core financial calculations (EMI, totals, amortization logic) are separated into utility functions (`loanCalculations.ts`, `amortizationCalculator.ts`).
*   **Event-Driven Updates:** User actions (adding loans, logging payments/adjustments) dispatch actions to the reducer, which updates the state, triggering re-renders of affected components.

## Architecture Diagram (Text-Based)

```
+-------------------------------------------------+
| App.tsx (Main Layout)                           |
| +---------------------------------------------+ |
| | HeaderContainer                             | |
| | +-------------+   +-----------------------+ | |
| | | MainTitle   |   | ShareState.tsx        | | |
| | +-------------+   +-----------------------+ | |
| +---------------------------------------------+ |
| +---------------------------------------------+ |
| | OverallSummary.tsx                          | |
| +---------------------------------------------+ |
| +---------------------------------------------+ |
| | ContentLayout (Single Column)               | |
| | +-----------------------------------------+ | |
| | | Section 1                               | | |
| | | +-------------+   +-------------------+ | | |
| | | | LoanForm.tsx|   | LoanList.tsx      | | | |
| | | +-------------+   +-------------------+ | | |
| | +-----------------------------------------+ | |
| | +-----------------------------------------+ | |
| | | Section 2 (Selected Loan Details)       | | |
| | | +-------------------------------------+ | | |
| | | | LoanDetailsDisplay.tsx              | | | |
| | | | +-------------------------------+ | | | |
| | | | | Summary Info                  | | | | |
| | | | +-------------------------------+ | | | |
| | | | | Disbursement Row              | | | | |
| | | | | +---------------------------+ | | | | |
| | | | | | Disbursement List         | | | | | |
| | | | | +---------------------------+ | | | | |
| | | | | +---------------------------+ | | | | |
| | | | | | AddDisbursementForm.tsx   | | | | | |
| | | | | +---------------------------+ | | | | |
| | | | +-------------------------------+ | | | |
| | | | | History Lists (Payments, etc) | | | | |
| | | | +-------------------------------+ | | | |
| | | | | LoanSummaries.tsx             | | | | |
| | | | +-------------------------------+ | | | |
| | | | | LoanChart.tsx                 | | | | |
| | | | +-------------------------------+ | | | |
| | | | | AmortizationTable.tsx         | | | | |
| | | | +-------------------------------+ | | | |
| | | | | EditLoanDetailsForm.tsx(Modal)| | | | |
| | | | +-------------------------------+ | | | |
| | | +-------------------------------------+ | | |
| | +-----------------------------------------+ | |
| | +-----------------------------------------+ | |
| +---------------------------------------------+ |
+-------------------------------------------------+
       |                                         |
       | Wraps everything                        |
       V                                         V
+-------------------------------------------------+
| AppContext.tsx (Provider)                       |
|   - Holds State (loans[], selectedLoanId)       |
|   - Holds Dispatch Function                     |
|   - Contains appReducer (handles actions)       |
|   - Reads/Writes localStorage                 |
|   - Reads URL Param (?loadState=)               |
+-------------------------------------------------+
       ^                                         ^
       | Uses State/Dispatch                     | Uses Utils
       |                                         |
+------------------+      +---------------------------------------+
| Utility Functions|      | Components Using Utils                |
|------------------|      |---------------------------------------|
| loanCalculations.ts|----->| LoanDetailsDisplay, OverallSummary    |
| amortizationCalc.ts|----->| LoanDetailsDisplay, LoanSummaries,    |
|                  |      | LoanChart, AmortizationTable,         |
|                  |      | OverallSummary                        |
+------------------+      +---------------------------------------+

Key Data Flows:
- User Interaction -> Component Handler -> dispatch(Action) -> appReducer -> New State -> Component Re-render
- App Load -> AppContext checks URL -> AppContext checks localStorage -> AppContext initializes State -> Components Render
- State Change -> AppContext saves to localStorage
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
