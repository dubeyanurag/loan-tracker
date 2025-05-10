# Loan Tracker Test Scenarios

This file contains URLs for running predefined test scenarios against the Loan Tracker application.

## How to Use
1. Copy the full URL.
2. Paste it into your browser.
3. The application will load in test mode and display the results for that scenario.

---

## Test Case 1: Basic Loan with One ROI Change (Adjust Tenure)

**Description:** A simple loan with an initial disbursement, followed by an ROI change where the tenure is adjusted.

**JSON Definition (`test-scenario-1.json`):**
```json
{
  "testName": "Basic Loan with One ROI Change (Adjust Tenure)",
  "initialLoanDetails": {
    "disbursements": [
      { "id": "d1", "date": "2024-01-01", "amount": 100000, "remarks": "Initial" }
    ],
    "originalInterestRate": 10,
    "originalTenureMonths": 36,
    "startDate": "2024-01-01",
    "startedWithPreEMI": false,
    "emiDebitDay": 5
  },
  "events": [
    { 
      "eventType": "ROI_CHANGE", 
      "date": "2024-03-01", 
      "newRate": 12, 
      "adjustmentPreference": "adjustTenure" 
    }
  ],
  "expectedResults": {
    "finalTenure": 36, 
    "scheduleEntryChecks": [
      { "monthNumber": 1, "interestPaid": 833.33, "principalPaid": 2395.59 },
      { "monthNumber": 2, "interestPaid": 813.37, "principalPaid": 2415.55 },
      { "monthNumber": 3, "interestPaid": 974.08, "principalPaid": 2254.84 } 
    ]
  }
}
```

**Test URL:**
`https://dubeyanurag.github.io/loan-tracker/?testCase=[[YOUR_URL_ENCODED_BASE64_STRING_FOR_TEST_SCENARIO_1_JSON_GOES_HERE]]`

**Instructions to generate the encoded string:**
1.  Get the content of `test-scenario-1.json`.
2.  Base64 encode the JSON string. For example, in a browser console: `btoa(JSON.stringify(yourJsonDataObject))` or use an online tool.
3.  URL-encode the resulting Base64 string. For example, in a browser console: `encodeURIComponent(yourBase64String)` or use an online tool.
4.  Replace `[[YOUR_URL_ENCODED_BASE64_STRING_FOR_TEST_SCENARIO_1_JSON_GOES_HERE]]` in the URL above with this generated string.

---
