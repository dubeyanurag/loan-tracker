// src/components/AddDisbursementForm.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../contexts/AppContext'; // Removed useAppState
import { Disbursement } from '../types';

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 0; // Padding will be handled by Modal
  /* border: 1px solid #e0e0e0; // Handled by Modal
  border-radius: 8px; // Handled by Modal
  background-color: #fdfdfd; // Handled by Modal
  margin-top: 20px; // Handled by Modal placement */
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
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;

const CancelButtonModal = styled(Button)`
  background-color: #6c757d;
  &:hover {
    background-color: #545b62;
  }
`;

const ButtonBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
`;

interface AddDisbursementFormProps {
  loanId: string;
  onClose: () => void;
}

const AddDisbursementForm: React.FC<AddDisbursementFormProps> = ({ loanId, onClose }) => { 
  const dispatch = useAppDispatch();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); 
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
    dispatch({ type: 'ADD_DISBURSEMENT', payload: { loanId: loanId, disbursement: newDisbursement as Disbursement } });

    // Reset form and close modal
    setAmount('');
    setRemarks('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose(); 
  };
  
  return (
    <FormContainer onSubmit={handleSubmit}>
      {/* Removed generic heading, modal will have title */}
      <FormGroup>
        <Label htmlFor="disbursementAmountModal">Amount (₹):</Label> {/* Changed id for uniqueness if multiple forms exist */}
        <Input type="number" id="disbursementAmountModal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="disbursementDateModal">Date:</Label>
        <Input type="date" id="disbursementDateModal" value={date} onChange={(e) => setDate(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="disbursementRemarksModal">Remarks (Optional):</Label>
        <Input type="text" id="disbursementRemarksModal" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </FormGroup>
      <ButtonBar>
        <CancelButtonModal type="button" onClick={onClose}>Cancel</CancelButtonModal>
        <Button type="submit">Add Disbursement</Button>
      </ButtonBar>
    </FormContainer>
  );
};

export default AddDisbursementForm;
