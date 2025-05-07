// src/components/LoanForm.tsx
import React, { useState }
from 'react';
import { useAppDispatch } from '../contexts/AppContext';
import { Loan, LoanDetails } from '../types';
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

const LoanForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState(''); // Changed state name
  const [startDate, setStartDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const loanDetails: LoanDetails = {
      principal: parseFloat(principal),
      originalInterestRate: parseFloat(interestRate),
      originalTenureMonths: parseInt(tenureMonths), // Use directly
      startDate: startDate,
    };

    // Basic validation (can be expanded)
    if (!name || isNaN(loanDetails.principal) || loanDetails.principal <= 0 ||
        isNaN(loanDetails.originalInterestRate) || loanDetails.originalInterestRate <= 0 ||
        isNaN(loanDetails.originalTenureMonths) || loanDetails.originalTenureMonths <= 0 ||
        !loanDetails.startDate) {
      alert('Please fill in all fields correctly.');
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
    setPrincipal('');
    setInterestRate('');
    setTenureMonths(''); // Reset months state
    setStartDate('');
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h3>Add New Loan</h3>
      <FormGroup>
        <Label htmlFor="loanName">Loan Name:</Label>
        <Input type="text" id="loanName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., My HDFC Loan" required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="principal">Principal Amount (₹):</Label>
        <Input type="number" id="principal" value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="e.g., 5000000" required />
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
      <Button type="submit">Add Loan</Button>
    </FormContainer>
  );
};

export default LoanForm;
