// src/components/PaymentForm.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { PreEMIInterestPayment } from '../types'; // Only need this type now
import { v4 as uuidv4 } from 'uuid';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fdfdfd;
  margin-top: 20px;
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

const Select = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  background-color: white;
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #218838;
  }
`;

// Renamed component for clarity
const PreEmiPaymentForm: React.FC = () => { 
  const { selectedLoanId, loans } = useAppState();
  const dispatch = useAppDispatch();

  // Only need state for Pre-EMI payments
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [remarks, setRemarks] = useState('');

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      // This check might be redundant if the component isn't rendered when no loan is selected
      alert('Please select a loan first.');
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (!date) {
      alert('Please select a payment date.');
      return;
    }

    const preEMIPayment: Omit<PreEMIInterestPayment, 'id'> = {
      date,
      amount: paymentAmount,
      remarks,
    };
    dispatch({ type: 'ADD_PRE_EMI_PAYMENT', payload: { loanId: selectedLoanId, payment: preEMIPayment as PreEMIInterestPayment } });

    // Reset form
    setAmount('');
    setRemarks('');
  };
  
  // Only render if a loan is selected AND it started with Pre-EMI
  if (!selectedLoan || !selectedLoan.details.startedWithPreEMI) {
    return null; 
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h4>Add Pre-EMI Interest Payment for "{selectedLoan.name}"</h4>
      {/* Removed Payment Type dropdown */}
      <FormGroup>
        <Label htmlFor="preEmiAmount">Amount (₹):</Label>
        <Input type="number" id="preEmiAmount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="preEmiDate">Date:</Label>
        <Input type="date" id="preEmiDate" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="preEmiRemarks">Remarks (Optional):</Label>
        <Input type="text" id="preEmiRemarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </FormGroup>
      <Button type="submit">Add Pre-EMI Payment</Button>
    </FormContainer>
  );
};

export default PreEmiPaymentForm; // Export the renamed component
