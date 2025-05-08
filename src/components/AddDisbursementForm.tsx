// src/components/AddDisbursementForm.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { Disbursement } from '../types';
// import { v4 as uuidv4 } from 'uuid'; // Removed unused import

// Reusing styles from PaymentForm - consider moving to a shared styles file later
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

const Button = styled.button`
  padding: 10px 15px;
  background-color: #007bff; /* Blue for adding */
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

const AddDisbursementForm: React.FC = () => { 
  const { selectedLoanId, loans } = useAppState();
  const dispatch = useAppDispatch();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [remarks, setRemarks] = useState('');

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Please select a loan first.');
      return;
    }

    const disbursementAmount = parseFloat(amount);
    if (isNaN(disbursementAmount) || disbursementAmount <= 0) {
      alert('Please enter a valid disbursement amount.');
      return;
    }
    if (!date) {
      alert('Please select a disbursement date.');
      return;
    }

    const newDisbursement: Omit<Disbursement, 'id'> = {
      date,
      amount: disbursementAmount,
      remarks,
    };
    dispatch({ type: 'ADD_DISBURSEMENT', payload: { loanId: selectedLoanId, disbursement: newDisbursement as Disbursement } });

    // Reset form
    setAmount('');
    setRemarks('');
  };
  
  if (!selectedLoanId) {
    return null; // Don't render if no loan selected
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h4>Add New Disbursement</h4> {/* Made heading generic */}
      <FormGroup>
        <Label htmlFor="disbursementAmount">Amount (₹):</Label>
        <Input type="number" id="disbursementAmount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="disbursementDate">Date:</Label>
        <Input type="date" id="disbursementDate" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="disbursementRemarks">Remarks (Optional):</Label>
        <Input type="text" id="disbursementRemarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </FormGroup>
      <Button type="submit">Add Disbursement</Button>
    </FormContainer>
  );
};

export default AddDisbursementForm;
