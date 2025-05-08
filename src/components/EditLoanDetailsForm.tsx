// src/components/EditLoanDetailsForm.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../contexts/AppContext';
import { Loan, LoanDetails } from '../types';

// Reusing styles - consider shared components/styles later
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 8px;
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
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-right: 10px;
`;

const SaveButton = styled(Button)`
  background-color: #28a745;
  &:hover { background-color: #218838; }
`;

const CancelButton = styled(Button)`
  background-color: #6c757d;
   &:hover { background-color: #5a6268; }
`;


interface EditLoanDetailsFormProps {
  loan: Loan;
  onClose: () => void; // Function to close the form/modal
}

const EditLoanDetailsForm: React.FC<EditLoanDetailsFormProps> = ({ loan, onClose }) => {
  const dispatch = useAppDispatch();

  // Initialize state with existing loan details
  const [name, setName] = useState(loan.name);
  const [interestRate, setInterestRate] = useState(String(loan.details.originalInterestRate));
  const [tenureMonths, setTenureMonths] = useState(String(loan.details.originalTenureMonths));
  const [startDate, setStartDate] = useState(loan.details.startDate); 
  const [startedWithPreEMI, setStartedWithPreEMI] = useState(loan.details.startedWithPreEMI ?? false); 
  const [emiStartDate, setEmiStartDate] = useState(loan.details.emiStartDate ?? ''); 
  const [isTaxDeductible, setIsTaxDeductible] = useState(loan.details.isTaxDeductible ?? true); 
  const [principalLimit, setPrincipalLimit] = useState(String(loan.details.principalDeductionLimit ?? 150000)); 
  const [interestLimit, setInterestLimit] = useState(String(loan.details.interestDeductionLimit ?? 200000)); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs (similar to LoanForm, but allow 0 rate)
     if (!name || 
        isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0 ||
        isNaN(parseInt(tenureMonths)) || parseInt(tenureMonths) <= 0 ||
        !startDate ||
        (startedWithPreEMI && !emiStartDate) ) { 
      alert('Please fill in all required fields correctly.');
      return;
    }
     const principalLimitNum = parseFloat(principalLimit);
     const interestLimitNum = parseFloat(interestLimit);
     if (isTaxDeductible && (isNaN(principalLimitNum) || principalLimitNum < 0 || isNaN(interestLimitNum) || interestLimitNum < 0)) {
         alert('Please enter valid non-negative deduction limits if tax deductible is checked.');
         return;
     }


    const updatedDetails: LoanDetails = {
      ...loan.details, // Keep existing disbursements
      originalInterestRate: parseFloat(interestRate),
      originalTenureMonths: parseInt(tenureMonths),
      startDate: startDate, 
      startedWithPreEMI: startedWithPreEMI,
      emiStartDate: startedWithPreEMI ? emiStartDate : undefined,
      isTaxDeductible: isTaxDeductible,
      principalDeductionLimit: isTaxDeductible ? principalLimitNum : undefined,
      interestDeductionLimit: isTaxDeductible ? interestLimitNum : undefined,
    };

    const updatedLoan: Loan = {
      ...loan,
      name: name,
      details: updatedDetails,
    };

    dispatch({ type: 'UPDATE_LOAN', payload: updatedLoan });
    onClose(); // Close the form/modal after saving
  };

  return (
    <FormContainer onSubmit={handleSubmit}>
      <h3>Edit Loan Details: {loan.name}</h3>
       <FormGroup>
        <Label htmlFor="editLoanName">Loan Name:</Label>
        <Input type="text" id="editLoanName" value={name} onChange={(e) => setName(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="editInterestRate">Original Annual Interest Rate (%):</Label>
        <Input type="number" step="0.01" id="editInterestRate" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="editTenureMonths">Original Loan Tenure (Months):</Label> 
        <Input type="number" id="editTenureMonths" value={tenureMonths} onChange={(e) => setTenureMonths(e.target.value)} required /> 
      </FormGroup>
      <FormGroup>
        <Label htmlFor="editStartDate">Loan Start Date:</Label>
        <Input type="date" id="editStartDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </FormGroup>
      <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}> 
        <Input 
          type="checkbox" 
          id="editStartedWithPreEMI" 
          checked={startedWithPreEMI} 
          onChange={(e) => setStartedWithPreEMI(e.target.checked)} 
          style={{ width: 'auto' }} 
        />
        <Label htmlFor="editStartedWithPreEMI" style={{ marginBottom: 0 }}>Started with Pre-EMI period?</Label>
      </FormGroup>
      
      {startedWithPreEMI && (
        <FormGroup>
          <Label htmlFor="editEmiStartDate">Full EMI Start Date:</Label>
          <Input 
            type="date" 
            id="editEmiStartDate" 
            value={emiStartDate} 
            onChange={(e) => setEmiStartDate(e.target.value)} 
            required={startedWithPreEMI} 
          />
        </FormGroup>
      )}

      {/* Tax Deductibility Section */}
      <FormGroup style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
         <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Input 
              type="checkbox" 
              id="editIsTaxDeductible" 
              checked={isTaxDeductible} 
              onChange={(e) => setIsTaxDeductible(e.target.checked)} 
              style={{ width: 'auto' }} 
            />
            <Label htmlFor="editIsTaxDeductible" style={{ marginBottom: 0 }}>Eligible for tax deductions?</Label>
         </div>
         {isTaxDeductible && (
            <>
                <FormGroup style={{marginBottom: '10px'}}>
                    <Label htmlFor="editPrincipalLimit">Principal Deduction Limit (₹):</Label>
                    <Input 
                        type="number" 
                        id="editPrincipalLimit" 
                        value={principalLimit} 
                        onChange={(e) => setPrincipalLimit(e.target.value)} 
                    />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="editInterestLimit">Interest Deduction Limit (₹):</Label>
                    <Input 
                        type="number" 
                        id="editInterestLimit" 
                        value={interestLimit} 
                        onChange={(e) => setInterestLimit(e.target.value)} 
                    />
                </FormGroup>
            </>
         )}
      </FormGroup>

      <div>
          <SaveButton type="submit">Save Changes</SaveButton>
          <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
      </div>
    </FormContainer>
  );
};

export default EditLoanDetailsForm;
