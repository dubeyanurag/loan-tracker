// src/components/EditLoanDetailsForm.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loan, LoanDetails } from '../types';
import { useAppDispatch } from '../contexts/AppContext';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
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
`;

const Button = styled.button`
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: #0056b3;
  }
`;
const CancelButton = styled(Button)`
    background-color: #6c757d;
     &:hover {
        background-color: #545b62;
     }
`;

interface EditLoanDetailsFormProps {
  loan: Loan;
  onClose: () => void;
}

const EditLoanDetailsForm: React.FC<EditLoanDetailsFormProps> = ({ loan, onClose }) => {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<LoanDetails>(loan.details);
  const [loanName, setLoanName] = useState<string>(loan.name);

  useEffect(() => {
    setFormData(loan.details);
    setLoanName(loan.name);
  }, [loan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseFloat(value) }));
  };
  
  const handleIntChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : parseInt(value, 10) }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedLoanDetails: LoanDetails = {
        ...formData,
        originalInterestRate: parseFloat(String(formData.originalInterestRate)),
        originalTenureMonths: parseInt(String(formData.originalTenureMonths)),
        // Ensure disbursements is not undefined, though it should always exist
        disbursements: formData.disbursements || [], 
        // Optional fields
        principalDeductionLimit: formData.isTaxDeductible ? (parseFloat(String(formData.principalDeductionLimit)) || undefined) : undefined,
        interestDeductionLimit: formData.isTaxDeductible ? (parseFloat(String(formData.interestDeductionLimit)) || undefined) : undefined,
        emiStartDate: formData.startedWithPreEMI ? formData.emiStartDate : undefined,
        emiDebitDay: formData.emiDebitDay ? parseInt(String(formData.emiDebitDay), 10) : undefined,
    };
     if (updatedLoanDetails.emiDebitDay !== undefined && (isNaN(updatedLoanDetails.emiDebitDay) || updatedLoanDetails.emiDebitDay < 1 || updatedLoanDetails.emiDebitDay > 31)) {
        alert('Please enter a valid EMI Debit Day (1-31), or leave blank.');
        return;
    }


    dispatch({ 
        type: 'UPDATE_LOAN', 
        payload: { ...loan, name: loanName, details: updatedLoanDetails } 
    });
    onClose();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h3>Edit Loan: {loan.name}</h3>
      <FormGroup>
        <Label htmlFor="loanName">Loan Name:</Label>
        <Input type="text" id="loanName" value={loanName} onChange={(e) => setLoanName(e.target.value)} required />
      </FormGroup>
      {/* Initial Disbursement cannot be edited here, only subsequent ones via main UI */}
      <FormGroup>
        <Label htmlFor="originalInterestRate">Original Annual Interest Rate (%):</Label>
        <Input type="number" step="0.01" id="originalInterestRate" name="originalInterestRate" value={formData.originalInterestRate || ''} onChange={handleNumericChange} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="originalTenureMonths">Original Loan Tenure (Months):</Label>
        <Input type="number" id="originalTenureMonths" name="originalTenureMonths" value={formData.originalTenureMonths || ''} onChange={handleIntChange} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="startDate">Loan Start Date (Initial Disbursement Date):</Label>
        <Input type="date" id="startDate" name="startDate" value={formData.startDate || ''} onChange={handleChange} required />
      </FormGroup>
      <FormGroup>
        <Label htmlFor="emiDebitDay">EMI Debit Day of Month (1-31):</Label>
        <Input 
            type="number" 
            id="emiDebitDay" 
            name="emiDebitDay" 
            value={formData.emiDebitDay || ''} 
            onChange={handleIntChange} 
            placeholder="e.g., 5 (Defaults to loan start day if blank)" 
            min="1" 
            max="31" 
        />
      </FormGroup>
      <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
        <Input type="checkbox" id="startedWithPreEMI" name="startedWithPreEMI" checked={formData.startedWithPreEMI || false} onChange={handleChange} style={{width: 'auto'}} />
        <Label htmlFor="startedWithPreEMI" style={{marginBottom: 0}}>Started with Pre-EMI period?</Label>
      </FormGroup>
      {formData.startedWithPreEMI && (
        <FormGroup>
          <Label htmlFor="emiStartDate">Full EMI Start Date:</Label>
          <Input type="date" id="emiStartDate" name="emiStartDate" value={formData.emiStartDate || ''} onChange={handleChange} required={formData.startedWithPreEMI} />
        </FormGroup>
      )}
      <FormGroup style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Input type="checkbox" id="isTaxDeductible" name="isTaxDeductible" checked={formData.isTaxDeductible || false} onChange={handleChange} style={{width: 'auto'}} />
            <Label htmlFor="isTaxDeductible" style={{marginBottom: 0}}>Eligible for tax deductions?</Label>
        </div>
        {formData.isTaxDeductible && (
        <>
            <FormGroup style={{marginBottom: '10px'}}>
                <Label htmlFor="principalDeductionLimit">Principal Deduction Limit (₹):</Label>
                <Input type="number" id="principalDeductionLimit" name="principalDeductionLimit" value={formData.principalDeductionLimit || ''} onChange={handleNumericChange} placeholder="e.g., 150000" />
            </FormGroup>
            <FormGroup>
                <Label htmlFor="interestDeductionLimit">Interest Deduction Limit (₹):</Label>
                <Input type="number" id="interestDeductionLimit" name="interestDeductionLimit" value={formData.interestDeductionLimit || ''} onChange={handleNumericChange} placeholder="e.g., 200000" />
            </FormGroup>
        </>
        )}
      </FormGroup>
      <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
        <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
        <Button type="submit">Save Changes</Button>
      </div>
    </Form>
  );
};

export default EditLoanDetailsForm;
