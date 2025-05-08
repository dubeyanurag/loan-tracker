// src/components/EditLoanDetailsForm.tsx
import React, { useState } from 'react'; 
import styled from 'styled-components';
import { useAppDispatch } from '../contexts/AppContext';
import { Loan, LoanDetails } from '../types';

// Reusing styles - consider shared components/styles later
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Use rem */
  padding: 1.5rem; /* Use rem */
  background-color: #ffffff; /* White background for modal content */
  border: none; /* Remove border if inside modal */
  border-radius: 8px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  margin-bottom: 0.3rem; /* Use rem */
  font-weight: 500; /* Slightly bolder labels */
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.6rem; /* Use rem */
  border: 1px solid #ccc; /* Lighter border */
  border-radius: 4px;
  font-size: 1rem;
`;

const Button = styled.button` // Inherits base button styles from index.css
  padding: 0.6rem 1.2rem; 
  margin-top: 0.5rem; 
  margin-right: 0.5rem; /* Add right margin */
`;

const SaveButton = styled(Button)`
  background-color: #4caf50; /* Material Green */
  color: white;
  &:hover { background-color: #388e3c; }
`;

const CancelButton = styled(Button)`
  background-color: #6c757d; /* Grey */
  color: white;
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

    // Validate inputs 
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
      ...loan.details, 
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
    onClose(); 
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
      <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}> 
        <Input 
          type="checkbox" 
          id="editStartedWithPreEMI" 
          checked={startedWithPreEMI} 
          onChange={(e) => setStartedWithPreEMI(e.target.checked)} 
          style={{ width: 'auto', height: 'auto', marginRight: '0.5rem' }} 
        />
        <Label htmlFor="editStartedWithPreEMI" style={{ marginBottom: 0, fontWeight: 'normal' }} title="Check if you only paid interest for an initial period before regular EMIs began.">Started with Pre-EMI period?</Label>
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
      <FormGroup style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginTop: '0.5rem' }}>
         <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Input 
              type="checkbox" 
              id="editIsTaxDeductible" 
              checked={isTaxDeductible} 
              onChange={(e) => setIsTaxDeductible(e.target.checked)} 
              style={{ width: 'auto', height: 'auto', marginRight: '0.5rem' }} 
            />
            <Label htmlFor="editIsTaxDeductible" style={{ marginBottom: 0, fontWeight: 'normal' }} title="Check if principal (Sec 80C) and interest (Sec 24b) payments qualify for tax deductions.">Eligible for tax deductions?</Label>
         </div>
         {isTaxDeductible && (
            <>
                <FormGroup style={{marginBottom: '0.75rem'}}>
                    <Label htmlFor="editPrincipalLimit" title="Maximum principal amount deductible under Section 80C per financial year (Default: ₹1,50,000)">Principal Deduction Limit (₹):</Label>
                    <Input 
                        type="number" 
                        id="editPrincipalLimit" 
                        value={principalLimit} 
                        onChange={(e) => setPrincipalLimit(e.target.value)} 
                    />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="editInterestLimit" title="Maximum interest amount deductible under Section 24(b) per financial year (Default: ₹2,00,000 for self-occupied)">Interest Deduction Limit (₹):</Label>
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

      <div style={{marginTop: '1rem'}}>
          <SaveButton type="submit">Save Changes</SaveButton>
          <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
      </div>
    </FormContainer>
  );
};

export default EditLoanDetailsForm;
