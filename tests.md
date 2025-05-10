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
`https://dubeyanurag.github.io/loan-tracker/?testCase=eyJ0ZXN0TmFtZSI6IkJhc2ljIExvYW4gd2l0aCBPbmUgUk9JIENoYW5nZSAoQWRqdXN0IFRlbnVyZSkiLCJpbml0aWFsTG9hbkRldGFpbHMiOnsiZGlzYnVyc2VtZW50cyI6W3siaWQiOiJkMSIsImRhdGUiOiIyMDI0LTAxLTAxIiwiYW1vdW50IjoxMDAwMDAsInJlbWFya3MiOiJJbml0aWFsIn1dLCJvcmlnaW5hbEludGVyZXN0UmF0ZSI6MTAsIm9yaWdpbmFsVGVudXJlTW9udGhzIjozNiwic3RhcnREYXRlIjoiMjAyNC0wMS0wMSIsInN0YXJ0ZWRXaXRoUHJlRU1JIjpmYWxzZSwiZW1pRGViaXREYXkiOjV9LCJldmVudHMiOlt7ImV2ZW50VHlwZSI6IlJPSV9DSEFOR0UiLCJkYXRlIjoiMjAyNC0wMy0wMSIsIm5ld1JhdGUiOjEyLCJhZGp1c3RtZW50UHJlZmVyZW5jZSI6ImFkanVzdFRlbnVyZSJ9XSwiZXhwZWN0ZWRSZXN1bHRzIjp7ImZpbmFsVGVudXJlIjozNiwic2NoZWR1bGVFbnRyeUNoZWNrcyI6W3sibW9udGhOdW1iZXIiOjEsImludGVyZXN0UGFpZCI6ODMzLjMzLCJwcmluY2lwYWxQYWlkIjoyMzk1LjU5fSx7Im1vbnRoTnVtYmVyIjoyLCJpbnRlcmVzdFBhaWQiOjgxMy4zNywicHJpbmNpcGFsUGFpZCI6MjQxNS41NX0seyJtb250aE51bWJlciI6MywiaW50ZXJlc3RQYWlkIjo5NzQuMDgsInByaW5jaXBhbFBhaWQiOjIyNTQuODR9XX19`

**Instructions to generate the encoded string (example for `test-scenario-1.json`):**
1.  Get the content of the respective `.json` file.
2.  Base64 encode the JSON string. For example, in a browser console: `btoa(JSON.stringify(yourJsonDataObject))` or use an online tool. (Ensure the JSON is a valid, compact string before encoding).
3.  URL-encode the resulting Base64 string. For example, in a browser console: `encodeURIComponent(yourBase64String)` or use an online tool.
4.  Replace the placeholder in the URL template with this generated string.

---

## Test Case 2: Pre-EMI, Multiple Disbursements, ROI Change

**Description:** Loan starts with Pre-EMI. Multiple disbursements occur during Pre-EMI. An ROI change also happens during Pre-EMI. Then regular EMIs start.

**JSON Definition (`test-scenario-2.json`):**
```json
{
  "testName": "Pre-EMI, Multiple Disbursements, ROI Change",
  "initialLoanDetails": {
    "disbursements": [
      { "id": "d1", "date": "2024-01-15", "amount": 1000000, "remarks": "Initial 1M" }
    ],
    "originalInterestRate": 8.0,
    "originalTenureMonths": 120,
    "startDate": "2024-01-15",
    "startedWithPreEMI": true,
    "emiStartDate": "2024-04-01",
    "emiDebitDay": 5
  },
  "events": [
    { 
      "eventType": "DISBURSEMENT", 
      "date": "2024-01-20", 
      "amount": 500000,
      "remarks": "Disb 500k"
    },
    { 
      "eventType": "DISBURSEMENT", 
      "date": "2024-02-10", 
      "amount": 300000,
      "remarks": "Disb 300k"
    },
    { 
      "eventType": "ROI_CHANGE", 
      "date": "2024-03-01", 
      "newRate": 9.0, 
      "adjustmentPreference": "adjustTenure" 
    }
  ],
  "expectedResults": {
    "scheduleEntryChecks": [
      { 
        "monthNumber": 1, 
        "paymentDate": "2024-02-05", 
        "isPreEMIPeriod": true, 
        "openingBalance": 1000000, 
        "interestPaid": 10000.00, 
        "principalPaid": 0 
      },
      { 
        "monthNumber": 2, 
        "paymentDate": "2024-03-05", 
        "isPreEMIPeriod": true,
        "openingBalance": 1800000, 
        "interestPaid": 12000.00, 
        "principalPaid": 0 
      },
      { 
        "monthNumber": 3, 
        "paymentDate": "2024-04-05", 
        "isPreEMIPeriod": false,
        "openingBalance": 1800000,
        "interestPaid": 13500.00, 
        "principalPaid": 8786.52 
      }
    ],
    "finalTenure": 120 
  }
}
```

**Test URL:**
`https://dubeyanurag.github.io/loan-tracker/?testCase=eyJ0ZXN0TmFtZSI6IlByZS1FTUksIE11bHRpcGxlIERpc2J1cnNlbWVudHMsIFJPSSBDaGFuZ2UiLCJpbml0aWFsTG9hbkRldGFpbHMiOnsiZGlzYnVyc2VtZW50cyI6W3siaWQiOiJkMSIsImRhdGUiOiIyMDI0LTAxLTE1IiwiYW1vdW50IjoxMDAwMDAwLCJyZW1hcmtzIjoiSW5pdGlhbCAxTSJ9XSwib3JpZ2luYWxJbnRlcmVzdFJhdGUiOjguMCwib3JpZ2luYWxUZW51cmVNb250aHMiOjEyMCwic3RhcnREYXRlIjoiMjAyNC0wMS0xNSIsInN0YXJ0ZWRXaXRoUHJlRU1JIjp0cnVlLCJlbWlTdGFydERhdGUiOiIyMDI0LTA0LTAxIiwiZW1pRGViaXREYXkiOjV9LCJldmVudHMiOlt7ImV2ZW50VHlwZSI6IkRJU0JVUlNFTUVOVCIsImRhdGUiOiIyMDI0LTAxLTIwIiwiYW1vdW50Ijo1MDAwMDAsInJlbWFya3MiOiJEaXNiIDUwMGsifSx7ImV2ZW50VHlwZSI6IkRJU0JVUlNFTUVOVCIsImRhdGUiOiIyMDI0LTAyLTEwIiwiYW1vdW50IjozMDAwMDAsInJlbWFya3MiOiJEaXNiIDMwMGsifSx7ImV2ZW50VHlwZSI6IlJPSV9DSEFOR0UiLCJkYXRlIjoiMjAyNC0wMy0wMSIsIm5ld1JhdGUiOjkuMCwiYWRqdXN0bWVudFByZWZlcmVuY2UiOiJhZGp1c3RUZW51cmUifV0sImV4cGVjdGVkUmVzdWx0cyI6eyJzY2hlZHVsZUVudHJ5Q2hlY2tzIjpbeyJtb250aE51bWJlciI6MSwicGF5bWVudERhdGUiOiIyMDI0LTAyLTA1IiwiaXNQcmVFTUlQZXJpb2QiOnRydWUsIm9wZW5pbmdCYWxhbmNlIjoxMDAwMDAwLCJpbnRlcmVzdFBhaWQiOjEwMDAwLjAsInByaW5jaXBhbFBhaWQiOjB9LHsibW9udGhOdW1iZXIiOjIsInBheW1lbnREYXRlIjoiMjAyNC0wMy0wNSIsImlzUHJlRU1JUGVyaW9kIjp0cnVlLCJvcGVuaW5nQmFsYW5jZSI6MTgwMDAwMCwiaW50ZXJlc3RQYWlkIjoxMjAwMC4wLCJwcmluY2lwYWxQYWlkIjowfSx7Im1vbnRoTnVtYmVyIjozLCJwYXltZW50RGF0ZSI6IjIwMjQtMDQtMDUiLCJpc1ByZUVNSVBlcmlvZCI6ZmFsc2UsIm9wZW5pbmdCYWxhbmNlIjoxODAwMDAwLCJpbnRlcmVzdFBhaWQiOjEzNTAwLjAsInByaW5jaXBhbFBhaWQiOjg3ODYuNTJ9XSwiZmluYWxUZW51cmUiOjEyMH19`

---

## Test Case 3: Multiple Prepayments with Different Preferences

**Description:** A loan with several prepayments. One prepayment adjusts tenure, another adjusts EMI.

**JSON Definition (`test-scenario-3.json`):**
```json
{
  "testName": "Multiple Prepayments with Different Preferences",
  "initialLoanDetails": {
    "disbursements": [
      { "id": "d1", "date": "2024-01-01", "amount": 2000000, "remarks": "Initial 2M" }
    ],
    "originalInterestRate": 9.0,
    "originalTenureMonths": 60,
    "startDate": "2024-01-01",
    "startedWithPreEMI": false,
    "emiDebitDay": 1
  },
  "events": [
    { 
      "eventType": "PREPAYMENT", 
      "date": "2024-06-01", 
      "amount": 100000,
      "adjustmentPreference": "adjustTenure",
      "remarks": "Prepay 100k (Adj Tenure)"
    },
    { 
      "eventType": "PREPAYMENT", 
      "date": "2024-12-01", 
      "amount": 150000,
      "adjustmentPreference": "adjustEMI",
      "remarks": "Prepay 150k (Adj EMI)"
    }
  ],
  "expectedResults": {
    "scheduleEntryChecks": [
      { 
        "monthNumber": 1, 
        "paymentDate": "2024-01-01",
        "openingBalance": 2000000,
        "emi": 41516.95 
      },
      { 
        "monthNumber": 6, 
        "paymentDate": "2024-06-01", 
        "emi": 141516.95 
      },
      { 
        "monthNumber": 7,
        "paymentDate": "2024-07-01",
        "emi": 41516.95 
      },
      { 
        "monthNumber": 12, 
        "paymentDate": "2024-12-01",
        "emi": 190057.00 
      },
      {
        "monthNumber": 13,
        "paymentDate": "2025-01-01",
        "emi": 38557.00 
      }
    ],
    "finalTenure": 55 
  }
}
```

**Test URL:**
`https://dubeyanurag.github.io/loan-tracker/?testCase=eyJ0ZXN0TmFtZSI6Ik11bHRpcGxlIFByZXBheW1lbnRzIHdpdGggRGlmZmVyZW50IFByZWZlcmVuY2VzIiwiaW5pdGlhbExvYW5EZXRhaWxzIjp7ImRpc2J1cnNlbWVudHMiOlt7ImlkIjoiZDEiLCJkYXRlIjoiMjAyNC0wMS0wMSIsImFtb3VudCI6MjAwMDAwMCwicmVtYXJrcyI6IkluaXRpYWwgMk0ifV0sIm9yaWdpbmFsSW50ZXJlc3RSYXRlIjo5LjAsIm9yaWdpbmFsVGVudXJlTW9udGhzIjo2MCwic3RhcnREYXRlIjoiMjAyNC0wMS0wMSIsInN0YXJ0ZWRXaXRoUHJlRU1JIjpmYWxzZSwiZW1pRGViaXREYXkiOjF9LCJldmVudHMiOlt7ImV2ZW50VHlwZSI6IlBSRVBBWU1FTlQiLCJkYXRlIjoiMjAyNC0wNi0wMSIsImFtb3VudCI6MTAwMDAwLCJhZGp1c3RtZW50UHJlZmVyZW5jZSI6ImFkanVzdFRlbnVyZSIsInJlbWFya3MiOiJQcmVwYXkgMTAwayAoQWRqIFRlbnVyZSkifSx7ImV2ZW50VHlwZSI6IlBSRVBBWU1FTlQiLCJkYXRlIjoiMjAyNC0xMi0wMSIsImFtb3VudCI6MTUwMDAwLCJhZGp1c3RtZW50UHJlZmVyZW5jZSI6ImFkanVzdEVNSSIsInJlbWFya3MiOiJQcmVwYXkgMTUwayAoQWRqIEVNSSkifV0sImV4cGVjdGVkUmVzdWx0cyI6eyJzY2hlZHVsZUVudHJ5Q2hlY2tzIjpbeyJtb250aE51bWJlciI6MSwicGF5bWVudERhdGUiOiIyMDI0LTAxLTAxIiwib3BlbmluZ0JhbGFuY2UiOjIwMDAwMDAsImVtaSI6NDE1MTYuOTV9LHsibW9udGhOdW1iZXIiOjYsInBheW1lbnREYXRlIjoiMjAyNC0wNi0wMSIsImVtaSI6MTQxNTE2Ljk1fSx7Im1vbnRoTnVtYmVyIjo3LCJwYXltZW50RGF0ZSI6IjIwMjQtMDctMDEiLCJlbWkiOjQxNTE2Ljk1fSx7Im1vbnRoTnVtYmVyIjoxMiwicGF5bWVudERhdGUiOiIyMDI0LTEyLTAxIiwiZW1pIjoxOTAwNTcuMH0seyJtb250aE51bWJlciI6MTMsInBheW1lbnREYXRlIjoiMjAyNS0wMS0wMSIsImVtaSI6Mzg1NTcuMH1dLCJmaW5hbFRlbnVyZSI6NTV9fQ%3D%3D`

---

## Test Case 4: Custom EMIs Interacting with ROI Changes

**Description:** A loan where the user sets custom EMIs, and there are also ROI changes (one adjusting tenure, one adjusting EMI).

**JSON Definition (`test-scenario-4.json`):**
```json
{
  "testName": "Custom EMIs Interacting with ROI Changes",
  "initialLoanDetails": {
    "disbursements": [
      { "id": "d1", "date": "2024-01-01", "amount": 500000, "remarks": "Initial 500k" }
    ],
    "originalInterestRate": 10.0,
    "originalTenureMonths": 48,
    "startDate": "2024-01-01",
    "startedWithPreEMI": false,
    "emiDebitDay": 1
  },
  "events": [
    { 
      "eventType": "CUSTOM_EMI", 
      "date": "2024-03-01", 
      "newEMI": 12000,
      "remarks": "Set Custom EMI to 12k"
    },
    { 
      "eventType": "ROI_CHANGE", 
      "date": "2024-05-01", 
      "newRate": 11.0, 
      "adjustmentPreference": "adjustTenure",
      "remarks": "ROI to 11% (Adj Tenure)"
    },
    { 
      "eventType": "CUSTOM_EMI", 
      "date": "2024-07-01", 
      "newEMI": 11500,
      "remarks": "Set Custom EMI to 11.5k"
    },
    { 
      "eventType": "ROI_CHANGE", 
      "date": "2024-09-01", 
      "newRate": 9.0, 
      "adjustmentPreference": "adjustEMI",
      "remarks": "ROI to 9% (Adj EMI)"
    }
  ],
  "expectedResults": {
    "scheduleEntryChecks": [
      { "monthNumber": 1, "paymentDate": "2024-01-01", "emi": 12681.32 },
      { "monthNumber": 3, "paymentDate": "2024-03-01", "emi": 12000.00 },
      { "monthNumber": 5, "paymentDate": "2024-05-01", "emi": 12000.00, "interestPaid": 4484.81 },
      { "monthNumber": 7, "paymentDate": "2024-07-01", "emi": 11500.00 },
      { "monthNumber": 9, "paymentDate": "2024-09-01", "emi": 11207.65 }
    ],
    "finalTenure": 48 
  }
}
```

**Test URL:**
`https://dubeyanurag.github.io/loan-tracker/?testCase=eyJ0ZXN0TmFtZSI6IkN1c3RvbSBFTUlzIEludGVyYWN0aW5nIHdpdGggUk9JIENoYW5nZXMiLCJpbml0aWFsTG9hbkRldGFpbHMiOnsiZGlzYnVyc2VtZW50cyI6W3siaWQiOiJkMSIsImRhdGUiOiIyMDI0LTAxLTAxIiwiYW1vdW50Ijo1MDAwMDAsInJlbWFya3MiOiJJbml0aWFsIDUwMGsifV0sIm9yaWdpbmFsSW50ZXJlc3RSYXRlIjoxMC4wLCJvcmlnaW5hbFRlbnVyZU1vbnRocyI6NDgsInN0YXJ0RGF0ZSI6IjIwMjQtMDEtMDEiLCJzdGFydGVkV2l0aFByZUVNSSI6ZmFsc2UsImVtaURlYml0RGF5IjoxfSwiZXZlbnRzIjpbeyJldmVudFR5cGUiOiJDVVNUT01fRU1JIiwiZGF0ZSI6IjIwMjQtMDMtMDEiLCJuZXdFTUkiOjEyMDAwLCJyZW1hcmtzIjoiU2V0IEN1c3RvbSBFTUkgdG8gMTJrIn0seyJldmVudFR5cGUiOiJST0lfQ0hBTkdFIiwiZGF0ZSI6IjIwMjQtMDUtMDEiLCJuZXdSYXRlIjoxMS4wLCJhZGp1c3RtZW50UHJlZmVyZW5jZSI6ImFkanVzdFRlbnVyZSIsInJlbWFya3MiOiJST0kgdG8gMTElIChBZGogVGVudXJlKSJ9LHsiZXZlbnRUeXBlIjoiQ1VTVE9NX0VNSSIsImRhdGUiOiIyMDI0LTA3LTAxIiwibmV3RU1JIjoxMTUwMCwicmVtYXJrcyI6IlNldCBDdXN0b20gRU1JIHRvIDExLjVrIn0seyJldmVudFR5cGUiOiJST0lfQ0hBTkdFIiwiZGF0ZSI6IjIwMjQtMDktMDEiLCJuZXdSYXRlIjo5LjAsImFkanVzdG1lbnRQcmVmZXJlbmNlIjoiYWRqdXN0RU1JIiwicmVtYXJrcyI6IlJPSSB0byA5JSAoQWRqIEVNSSkifV0sImV4cGVjdGVkUmVzdWx0cyI6eyJzY2hlZHVsZUVudHJ5Q2hlY2tzIjpbeyJtb250aE51bWJlciI6MSwicGF5bWVudERhdGUiOiIyMDI0LTAxLTAxIiwiZW1pIjoxMjY4MS4zMn0seyJtb250aE51bWJlciI6MywicGF5bWVudERhdGUiOiIyMDI0LTAzLTAxIiwiZW1pIjoxMjAwMC4wfSx7Im1vbnRoTnVtYmVyIjo1LCJwYXltZW50RGF0ZSI6IjIwMjQtMDUtMDEiLCJlbWkiOjEyMDAwLjAsImludGVyZXN0UGFpZCI6NDQ4NC44MX0seyJtb250aE51bWJlciI6NywicGF5bWVudERhdGUiOiIyMDI0LTA3LTAxIiwiZW1pIjoxMTUwMC4wfSx7Im1vbnRoTnVtYmVyIjo5LCJwYXltZW50RGF0ZSI6IjIwMjQtMDktMDEiLCJlbWkiOjExMjA3LjY1fV0sImZpbmFsVGVudXJlIjo0OH19`

---

## Test Case 5: Edge Case - Loan Paid Off Early by Large Prepayment

**Description:** A loan that is paid off much earlier than its original tenure due to a large prepayment that nearly clears the balance.

**JSON Definition (`test-scenario-5.json`):**
```json
{
  "testName": "Edge Case: Loan Paid Off Early by Large Prepayment",
  "initialLoanDetails": {
    "disbursements": [
      { "id": "d1", "date": "2024-01-01", "amount": 300000, "remarks": "Initial 300k" }
    ],
    "originalInterestRate": 7.0,
    "originalTenureMonths": 36,
    "startDate": "2024-01-01",
    "startedWithPreEMI": false,
    "emiDebitDay": 1
  },
  "events": [
    { 
      "eventType": "PREPAYMENT", 
      "date": "2024-03-01", 
      "amount": 280000,
      "adjustmentPreference": "adjustTenure",
      "remarks": "Large Prepay 280k"
    }
  ],
  "expectedResults": {
    "scheduleEntryChecks": [
      { "monthNumber": 1, "paymentDate": "2024-01-01", "emi": 9263.03 },
      { "monthNumber": 2, "paymentDate": "2024-02-01", "emi": 9263.03 },
      { 
        "monthNumber": 3, 
        "paymentDate": "2024-03-01", 
        "emi": 289263.03 
      },
      {
        "monthNumber": 4,
        "paymentDate": "2024-04-01",
        "closingBalance": 0 
      }
    ],
    "finalTenure": 4 
  }
}
```

**Test URL:**
`https://dubeyanurag.github.io/loan-tracker/?testCase=eyJ0ZXN0TmFtZSI6IkVkZ2UgQ2FzZTogTG9hbiBQYWlkIE9mZiBFYXJseSBieSBMYXJnZSBQcmVwYXltZW50IiwiaW5pdGlhbExvYW5EZXRhaWxzIjp7ImRpc2J1cnNlbWVudHMiOlt7ImlkIjoiZDEiLCJkYXRlIjoiMjAyNC0wMS0wMSIsImFtb3VudCI6MzAwMDAwLCJyZW1hcmtzIjoiSW5pdGlhbCAzMDBrIn1dLCJvcmlnaW5hbEludGVyZXN0UmF0ZSI6Ny4wLCJvcmlnaW5hbFRlbnVyZU1vbnRocyI6MzYsInN0YXJ0RGF0ZSI6IjIwMjQtMDEtMDEiLCJzdGFydGVkV2l0aFByZUVNSSI6ZmFsc2UsImVtaURlYml0RGF5IjoxfSwiZXZlbnRzIjpbeyJldmVudFR5cGUiOiJQUkVQQVlNRU5UIiwiZGF0ZSI6IjIwMjQtMDMtMDEiLCJhbW91bnQiOjI4MDAwMCwiYWRqdXN0bWVudFByZWZlcmVuY2UiOiJhZGp1c3RUZW51cmUiLCJyZW1hcmtzIjoiTGFyZ2UgUHJlcGF5IDI4MGsifV0sImV4cGVjdGVkUmVzdWx0cyI6eyJzY2hlZHVsZUVudHJ5Q2hlY2tzIjpbeyJtb250aE51bWJlciI6MSwicGF5bWVudERhdGUiOiIyMDI0LTAxLTAxIiwiZW1pIjo5MjYzLjAzfSx7Im1vbnRoTnVtYmVyIjoyLCJwYXltZW50RGF0ZSI6IjIwMjQtMDItMDEiLCJlbWkiOjkyNjMuMDN9LHsibW9udGhOdW1iZXIiOjMsInBheW1lbnREYXRlIjoiMjAyNC0wMy0wMSIsImVtaSI6Mjg5MjYzLjAzfSx7Im1vbnRoTnVtYmVyIjo0LCJwYXltZW50RGF0ZSI6IjIwMjQtMDQtMDEiLCJjbG9zaW5nQmFsYW5jZSI6MH1dLCJmaW5hbFRlbnVyZSI6NH19`

---
