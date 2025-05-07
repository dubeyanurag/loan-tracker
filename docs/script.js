document.addEventListener('DOMContentLoaded', () => {
    const principalInput = document.getElementById('principal');
    const interestRateInput = document.getElementById('interestRate');
    const tenureYearsInput = document.getElementById('tenureYears');
    const startDateInput = document.getElementById('startDate');
    const calculateEmiBtn = document.getElementById('calculateEmiBtn');
    const emiResultDiv = document.getElementById('emiResult');

    const loanSummaryCard = document.getElementById('loanSummaryCard');
    const summaryEmiSpan = document.getElementById('summaryEmi');
    const summaryPrincipalSpan = document.getElementById('summaryPrincipal');
    const summaryTotalInterestSpan = document.getElementById('summaryTotalInterest');
    const summaryTotalAmountSpan = document.getElementById('summaryTotalAmount');

    let loanData = {}; // To store all loan related data

    // Load data from localStorage if available
    loadLoanData();

    calculateEmiBtn.addEventListener('click', () => {
        const principal = parseFloat(principalInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const tenureYears = parseInt(tenureYearsInput.value);
        const startDate = startDateInput.value;

        if (isNaN(principal) || principal <= 0) {
            alert('Please enter a valid principal amount.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate <= 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(tenureYears) || tenureYears <= 0) {
            alert('Please enter a valid loan tenure in years.');
            return;
        }
        if (!startDate) {
            alert('Please select a loan start date.');
            return;
        }

        const monthlyInterestRate = annualInterestRate / 12 / 100;
        const tenureMonths = tenureYears * 12;

        const emi = calculateEMI(principal, monthlyInterestRate, tenureMonths);
        const totalAmountPayable = emi * tenureMonths;
        const totalInterestPayable = totalAmountPayable - principal;

        emiResultDiv.innerHTML = `Calculated EMI: ₹${emi.toFixed(2)}`;

        loanData = {
            loanDetails: {
                principal: principal,
                originalInterestRate: annualInterestRate,
                originalTenureMonths: tenureMonths,
                startDate: startDate,
                currentEMI: emi,
                outstandingBalance: principal // Initially, outstanding is full principal
            },
            paymentHistory: [],
            interestRateChanges: [],
            customEMIChanges: []
        };

        updateLoanSummaryDisplay(loanData.loanDetails);
        saveLoanData();
    });

    function calculateEMI(p, r, n) {
        // EMI = P × r × (1 + r)^n / ((1 + r)^n – 1)
        if (r === 0) { // Interest-free loan
            return p / n;
        }
        const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        return emi;
    }

    function updateLoanSummaryDisplay(details) {
        if (details && details.currentEMI) {
            summaryEmiSpan.textContent = `₹${details.currentEMI.toFixed(2)}`;
            summaryPrincipalSpan.textContent = `₹${details.principal.toFixed(2)}`;
            
            const totalInterest = (details.currentEMI * details.originalTenureMonths) - details.principal;
            const totalAmount = details.currentEMI * details.originalTenureMonths;

            summaryTotalInterestSpan.textContent = `₹${totalInterest.toFixed(2)}`;
            summaryTotalAmountSpan.textContent = `₹${totalAmount.toFixed(2)}`;
            loanSummaryCard.style.display = 'block';
        } else {
            loanSummaryCard.style.display = 'none';
        }
    }
    
    function saveLoanData() {
        localStorage.setItem('homeLoanTrackerData', JSON.stringify(loanData));
        console.log('Loan data saved to localStorage.');
    }

    function loadLoanData() {
        const storedData = localStorage.getItem('homeLoanTrackerData');
        if (storedData) {
            loanData = JSON.parse(storedData);
            console.log('Loan data loaded from localStorage:', loanData);
            // Populate input fields if data exists
            if (loanData.loanDetails) {
                principalInput.value = loanData.loanDetails.principal;
                interestRateInput.value = loanData.loanDetails.originalInterestRate;
                tenureYearsInput.value = loanData.loanDetails.originalTenureMonths / 12;
                startDateInput.value = loanData.loanDetails.startDate;
                updateLoanSummaryDisplay(loanData.loanDetails);
                 if (loanData.loanDetails.currentEMI) {
                    emiResultDiv.innerHTML = `Loaded EMI: ₹${loanData.loanDetails.currentEMI.toFixed(2)}`;
                }
            }
        } else {
            console.log('No loan data found in localStorage.');
        }
    }

});
