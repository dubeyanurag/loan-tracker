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
1.  Get the content of `test-scenario-1.json`.
2.  Base64 encode the JSON string. For example, in a browser console: `btoa(JSON.stringify(yourJsonDataObject))` or use an online tool.
3.  URL-encode the resulting Base64 string. For example, in a browser console: `encodeURIComponent(yourBase64String)` or use an online tool.
4.  Replace `[[YOUR_URL_ENCODED_BASE64_STRING_FOR_TEST_SCENARIO_1_JSON_GOES_HERE]]` in the URL above with this generated string.

---
