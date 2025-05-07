// src/components/LoanForm.tsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import { useAppDispatch, useAppState } from '../contexts/AppContext'; // Import useAppState
import { Loan, LoanDetails, Disbursement } from '../types'; // Import Disbursement type
import { v4 as uuidv4 } from 'uuid';
import styled from 'styled-components';

// Basic Styled Components for the form
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0056b3;
  }
`;

// Simple button for toggling
const ToggleButton = styled(Button)`
  background-color: #6c757d;
  margin-bottom: 10px; // Add margin if needed when collapsed
  &:hover {
    background-color: #5a6268;
  }
`;

const LoanForm: React.FC = () => {
  const { loans } = useAppState(); // Get loans state
  const dispatch = useAppDispatch();
  const [isCollapsed, setIsCollapsed] = useState(loans.length > 0); // Collapse if loans exist

  // Update collapsed state if loans array changes (e.g., last loan deleted)
  useEffect(() => {
    setIsCollapsed(loans.length > 0);
  }, [loans.length]);

  const [name, setName] = useState('');
  const [initialDisbursementAmount, setInitialDisbursementAmount] = useState(''); // Renamed state
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState(''); // Loan agreement/disbursement start date
  const [startedWithPreEMI, setStartedWithPreEMI] = useState(false); 
  const [emiStartDate, setEmiStartDate] = useState(''); // State for the conditional EMI start date

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const initialAmount = parseFloat(initialDisbursementAmount);
    if (isNaN(initialAmount) || initialAmount <= 0) {
        alert('Please enter a valid initial disbursement amount.');
        return;
    }
    if (!startDate) {
        alert('Please enter the loan start/initial disbursement date.');
        return;
    }

    // Create the initial disbursement object
    const initialDisbursement: Disbursement = {
        id: uuidv4(),
        date: startDate,
        amount: initialAmount,
        remarks: 'Initial Disbursement'
    };

    const loanDetails: LoanDetails = {
      disbursements: [initialDisbursement], // Initialize with the first disbursement
      originalInterestRate: parseFloat(interestRate),
      originalTenureMonths: parseInt(tenureMonths),
      startDate: startDate, // Loan agreement start date
      startedWithPreEMI: startedWithPreEMI,
      // Only include emiStartDate if startedWithPreEMI is true
      emiStartDate: startedWithPreEMI ? emiStartDate : undefined, 
    };

    // Basic validation (can be expanded)
    // Note: principal validation is handled above by checking initialAmount
    if (!name || 
        isNaN(loanDetails.originalInterestRate) || loanDetails.originalInterestRate <= 0 ||
        isNaN(loanDetails.originalTenureMonths) || loanDetails.originalTenureMonths <= 0 ||
        !loanDetails.startDate ||
        // Add validation for emiStartDate if startedWithPreEMI is true
        (startedWithPreEMI && !emiStartDate) ) { 
      alert('Please fill in all fields correctly, including EMI Start Date if applicable.');
      return;
    }

    const newLoan: Loan = {
      id: uuidv4(),
      name,
      details: loanDetails,
      preEMIInterestPayments: [],
      paymentHistory: [],
      interestRateChanges: [],
      customEMIChanges: [],
    };

    dispatch({ type: 'ADD_LOAN', payload: newLoan });

    // Reset form
    setName('');
    setInitialDisbursementAmount(''); // Reset renamed state
    setInterestRate('');
    setTenureMonths('');
    setStartDate('');
    setStartedWithPreEMI(false); 
    setEmiStartDate(''); // Reset EMI start date state
    setIsCollapsed(true); // Collapse after adding
  };

  if (isCollapsed) {
    return (
      <ToggleButton onClick={() => setIsCollapsed(false)} type="button">
        [ + Add New Loan ]
      </ToggleButton>
    );
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      {/* Optionally add a collapse button here too */}
      {/* <button type="button" onClick={() => setIsCollapsed(true)}>Collapse</button> */}
      <h3>Add New Loan</h3>
      <FormGroup>
        <Label htmlFor="loanName">Loan Name:</Label>
        <Input type="text" id="loanName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My HDFC Loan" required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="initialDisbursementAmount">Initial Disbursement Amount (₹):</Label>
        <Input type="number" id="initialDisbursementAmount" value={initialDisbursementAmount} onChange={(e) => setInitialDisbursementAmount(e.target.value)} placeholder="e.g., 5000000" required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="interestRate">Annual Interest Rate (%):</Label>
        <Input type="number" step="0.01" id="interestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="e.g., 8.5" required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="tenureMonths">Loan Tenure (Months):</Label> 
        <Input type="number" id="tenureMonths" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} placeholder="e.g., 240" required /> 
      </FormGroup>
      <FormGroup>
        <Label htmlFor="startDate">Loan Start Date:</Label>
        <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </FormGroup>
      <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}> 
        <Input 
          type="checkbox" 
          id="startedWithPreEMI" 
          checked={startedWithPreEMI} 
          onChange={(e) => setStartedWithPreEMI(e.target.checked)} 
          style={{ width: 'auto' }} // Adjust checkbox width
        />
        <Label htmlFor="startedWithPreEMI" style={{ marginBottom: 0 }}>Did loan start with a Pre-EMI period?</Label>
      </FormGroup>
      
      {/* Conditionally render EMI Start Date input */}
      {startedWithPreEMI && (
        <FormGroup>
          <Label htmlFor="emiStartDate">Full EMI Start Date:</Label>
          <Input 
            type="date" 
            id="emiStartDate" 
            value={emiStartDate} 
            onChange={(e) => setEmiStartDate(e.target.value)} 
            required={startedWithPreEMI} // Make required only if checkbox is checked
          />
        </FormGroup>
      )}

      <Button type="submit">Add Loan</Button>
    </FormContainer>
  );
};

export default LoanForm;
