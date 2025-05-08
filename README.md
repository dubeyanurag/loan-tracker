# Loan Tracker

A web application built with React and TypeScript to track loans (like home loans), visualize amortization schedules, and manage dynamic changes like interest rate adjustments and multiple principal disbursements.

## Features

*   **Multi-Loan Management:** Add, view, select, and delete multiple home loan accounts.
*   **Data Persistence:** Loan data is saved locally in the browser's `localStorage`.
*   **Detailed Tracking:** Log initial and subsequent principal disbursements.
*   **Payment Logging:** Record EMI and Prepayment transactions via the Amortization Table actions.
*   **Dynamic Adjustments:**
    *   Record Rate of Interest (ROI) changes and choose whether to adjust tenure or EMI.
    *   Record voluntary custom EMI changes.
    *   Log adjustments directly against the relevant month in the Amortization Table.
    *   Edit past ROI/EMI change events.
*   **Amortization Schedule:** View a detailed month-by-month breakdown of payments, principal, interest, and balance, reflecting all logged events.
*   **Event Highlighting:** Rows in the Amortization Table with significant events (prepayments, ROI changes, etc.) are highlighted.
*   **Event Deletion:** Remove specific logged events (disbursements, prepayments, ROI/EMI changes) directly from the Amortization Table.
*   **Prepayment Simulator:** Estimate the impact of hypothetical prepayments on loan tenure and interest saved (Note: Uses simplified calculations currently).
*   **Summaries:** View Annual and overall Loan Lifespan summaries based on the calculated schedule.
*   **Visualization:** Interactive line chart displaying Outstanding Balance, Principal Paid, Interest Paid, and EMI Paid over time, with annotations for key events and zoom/pan functionality.

## Technology Stack

*   **Framework:** React 18+
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Styling:** Styled Components
*   **State Management:** React Context API + `useReducer`
*   **Charting:** Chart.js with `react-chartjs-2`, `chartjs-plugin-annotation`, `chartjs-plugin-zoom`
*   **IDs:** UUID
*   **Testing:** Vitest, React Testing Library (To be added)

## Local Setup & Usage

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dubeyanurag/home-loan-tracker.git
    cd loan-tracker 
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

## Build for Production

```bash
npm run build
```
This will create a `dist` folder with the production-ready static assets.

## Deployment

This application is deployed using GitHub Pages at:
**https://dubeyanurag.github.io/home-loan-tracker/**
