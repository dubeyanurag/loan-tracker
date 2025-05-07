// src/components/PaymentForm.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { Payment, PreEMIInterestPayment } from '../types'; // Assuming PaymentType includes 'PreEMI' or similar
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

const PaymentForm: React.FC = () => {
  const { selectedLoanId, loans } = useAppState();
  const dispatch = useAppDispatch();

  const [paymentType, setPaymentType] = useState<'EMI' | 'Prepayment' | 'PreEMIInterest'>('EMI');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [remarks, setRemarks] = useState('');

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !selectedLoan) {
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

    if (paymentType === 'PreEMIInterest') {
      const preEMIPayment: Omit<PreEMIInterestPayment, 'id'> = {
        date,
        amount: paymentAmount,
        remarks,
      };
      dispatch({ type: 'ADD_PRE_EMI_PAYMENT', payload: { loanId: selectedLoanId, payment: preEMIPayment as PreEMIInterestPayment } });
    } else {
      // For EMI and Prepayment, we need to calculate principal and interest portions.
      // This is a simplified version for now. Accurate calculation requires knowing
      // the outstanding balance and current interest rate at the time of payment.
      // For now, let's assume EMI is as per original schedule and Prepayment is all principal.
      // This will be refined when we build the amortization logic.
      
      let principalPaid = 0;
      let interestPaid = 0;

      if (paymentType === 'EMI') {
        // Simplified: This needs to be calculated based on amortization schedule
        // For now, assume a rough split or use a placeholder.
        // A more accurate calculation would be:
        // interestForMonth = outstandingBalance * (annualRate / 12 / 100)
        // principalPaid = paymentAmount - interestForMonth
        // This will be complex to do here without the full amortization logic.
        // Let's make a placeholder assumption:
        // TODO: Replace with actual amortization logic
        const monthlyInterestRate = selectedLoan.details.originalInterestRate / 12 / 100;
        // This is a very rough estimate of interest for the first EMI, not accurate for subsequent ones
        interestPaid = selectedLoan.details.principal * monthlyInterestRate; 
        if (paymentAmount < interestPaid) interestPaid = paymentAmount; // Cap interest if payment is less
        principalPaid = paymentAmount - interestPaid;

      } else if (paymentType === 'Prepayment') {
        principalPaid = paymentAmount;
        interestPaid = 0;
      }
      
      const payment: Omit<Payment, 'id' | 'balanceAfterPayment'> = {
        date,
        amount: paymentAmount,
        type: paymentType as 'EMI' | 'Prepayment',
        principalPaid,
        interestPaid,
        remarks,
      };
      // The balanceAfterPayment will be set in the reducer or a utility function
      // that has access to the full loan state and can calculate it.
      // For now, the reducer just adds the payment.
      dispatch({ type: 'ADD_PAYMENT', payload: { loanId: selectedLoanId, payment: payment as Payment } });
    }

    // Reset form
    setAmount('');
    // setDate(new Date().toISOString().split('T')[0]); // Keep date or reset?
    setRemarks('');
  };
  
  if (!selectedLoanId) {
    return <p>Select a loan to add payments.</p>;
  }

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h4>Add Payment / Transaction for "{selectedLoan?.name}"</h4>
      <FormGroup>
        <Label htmlFor="paymentType">Payment Type:</Label>
        <Select id="paymentType" value={paymentType} onChange={(e) => setPaymentType(e.target.value as 'EMI' | 'Prepayment' | 'PreEMIInterest')}>
          <option value="EMI">EMI</option>
          <option value="Prepayment">Prepayment (Extra Principal)</option>
          <option value="PreEMIInterest">Pre-EMI Interest</option>
        </Select>
      </FormGroup>
      <FormGroup>
        <Label htmlFor="paymentAmount">Amount (₹):</Label>
        <Input type="number" id="paymentAmount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="paymentDate">Date:</Label>
        <Input type="date" id="paymentDate" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="paymentRemarks">Remarks (Optional):</Label>
        <Input type="text" id="paymentRemarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </FormGroup>
      <Button type="submit">Add Transaction</Button>
    </FormContainer>
  );
};

export default PaymentForm;
