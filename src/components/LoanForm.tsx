// src/components/LoanForm.tsx
import React, { useState } from 'react'; // Removed useEffect
import { useAppDispatch } from '../contexts/AppContext'; // Removed useAppState as loans.length not needed here directly
import { Loan, LoanDetails, Disbursement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import styled from 'styled-components';
import Modal from './Modal'; // Import the Modal component

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
  /* Removed padding, border, margin, background-color as it's now in a modal */
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
  padding: 0.6rem 1.2rem; 
  margin-top: 0.5rem; 
  background-color: #1976d2; 
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

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

const FloatingAddButton = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #1976d2; 
  color: white;
  font-size: 28px; 
  line-height: 60px; // Center the "+" vertically
  text-align: center; // Center the "+" horizontally
  border: none;
  box-shadow: 0 4px 10px rgba(0,0,0,0.25);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; // Higher than modal overlay if modal is 1000
  transition: background-color 0.2s, transform 0.1s ease-out;

  &:hover {
    background-color: #0056b3;
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(0px);
  }
`;


const LoanForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [initialDisbursementAmount, setInitialDisbursementAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [startedWithPreEMI, setStartedWithPreEMI] = useState(false); 
  const [emiStartDate, setEmiStartDate] = useState(''); 
  const [emiDebitDay, setEmiDebitDay] = useState(''); 
  const [isTaxDeductible, setIsTaxDeductible] = useState(true); 
  const [principalLimit, setPrincipalLimit] = useState('150000'); 
  const [interestLimit, setInterestLimit] = useState('200000'); 

  const resetForm = () => {
    setName('');
    setInitialDisbursementAmount(''); 
    setInterestRate('');
    setTenureMonths('');
    setStartDate('');
    setStartedWithPreEMI(false); 
    setEmiStartDate(''); 
    setEmiDebitDay(''); 
    setIsTaxDeductible(true); 
    setPrincipalLimit('150000'); 
    setInterestLimit('200000');
  };

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
    const debitDay = emiDebitDay ? parseInt(emiDebitDay, 10) : undefined;
    if (debitDay !== undefined && (isNaN(debitDay) || debitDay < 1 || debitDay > 31)) {
        alert('Please enter a valid EMI Debit Day (1-31), or leave blank to use loan start day.');
        return;
    }

    const initialDisbursement: Disbursement = {
        id: uuidv4(),
        date: startDate,
        amount: initialAmount,
        remarks: 'Initial Disbursement'
    };

    const loanDetails: LoanDetails = {
      disbursements: [initialDisbursement], 
      originalInterestRate: parseFloat(interestRate),
      originalTenureMonths: parseInt(tenureMonths),
      startDate: startDate, 
      startedWithPreEMI: startedWithPreEMI,
      emiStartDate: startedWithPreEMI ? emiStartDate : undefined,
      emiDebitDay: debitDay, 
      isTaxDeductible: isTaxDeductible,
      principalDeductionLimit: isTaxDeductible ? parseFloat(principalLimit) || 150000 : undefined,
      interestDeductionLimit: isTaxDeductible ? parseFloat(interestLimit) || 200000 : undefined,
    };

    if (!name || 
        isNaN(loanDetails.originalInterestRate) || loanDetails.originalInterestRate < 0 || // Allow 0%
        isNaN(loanDetails.originalTenureMonths) || loanDetails.originalTenureMonths <= 0 ||
        !loanDetails.startDate ||
        (startedWithPreEMI && !emiStartDate) ) { 
      alert('Please fill in all fields correctly (Interest rate can be 0). Ensure EMI Start Date is provided if Pre-EMI is selected.');
      return;
    }

    const newLoan: Loan = {
      id: uuidv4(),
      name,
      details: loanDetails,
      paymentHistory: [],
      interestRateChanges: [],
      customEMIChanges: [],
    };

    dispatch({ type: 'ADD_LOAN', payload: newLoan });
    resetForm();
    setIsModalOpen(false); // Close modal on successful submit
  };

  return (
    <>
      <FloatingAddButton onClick={() => setIsModalOpen(true)} type="button" title="Add New Loan">
        +
      </FloatingAddButton>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Loan">
        <FormContainer onSubmit={handleSubmit}>
          {/* FormGroups remain the same as before */}
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
            <Label htmlFor="startDate">Loan Start Date (Initial Disbursement Date):</Label>
            <Input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="emiDebitDay">EMI Debit Day of Month (1-31):</Label>
            <Input 
                type="number" 
                id="emiDebitDay" 
                value={emiDebitDay} 
                onChange={(e) => setEmiDebitDay(e.target.value)} 
                placeholder="e.g., 5 (Defaults to loan start day if blank)" 
                min="1" 
                max="31" 
            />
          </FormGroup>
          <FormGroup style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}> 
            <Input 
              type="checkbox" 
              id="startedWithPreEMI" 
              checked={startedWithPreEMI} 
              onChange={(e) => setStartedWithPreEMI(e.target.checked)} 
              style={{ width: 'auto' }} 
            />
            <Label htmlFor="startedWithPreEMI" style={{ marginBottom: 0 }} title="Check if you only paid interest for an initial period before regular EMIs began.">Did loan start with a Pre-EMI period?</Label>
          </FormGroup>
          
          {startedWithPreEMI && (
            <FormGroup>
              <Label htmlFor="emiStartDate">Full EMI Start Date:</Label>
              <Input 
                type="date" 
                id="emiStartDate" 
                value={emiStartDate} 
                onChange={(e) => setEmiStartDate(e.target.value)} 
                required={startedWithPreEMI} 
              />
            </FormGroup>
          )}

          <FormGroup style={{ borderTop: '1px solid #e0e0e0', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Input 
                  type="checkbox" 
                  id="isTaxDeductible" 
                  checked={isTaxDeductible} 
                  onChange={(e) => setIsTaxDeductible(e.target.checked)} 
                  style={{ width: 'auto' }} 
                />
                <Label htmlFor="isTaxDeductible" style={{ marginBottom: 0 }} title="Check if principal (Sec 80C) and interest (Sec 24b) payments qualify for tax deductions.">Is loan eligible for tax deductions?</Label>
            </div>
            {isTaxDeductible && (
                <>
                    <FormGroup style={{marginBottom: '10px'}}>
                        <Label htmlFor="principalLimit" title="Maximum principal amount deductible under Section 80C per financial year (Default: ₹1,50,000)">Principal Deduction Limit (₹) (Sec 80C):</Label>
                        <Input 
                            type="number" 
                            id="principalLimit" 
                            value={principalLimit} 
                            onChange={(e) => setPrincipalLimit(e.target.value)} 
                            placeholder="e.g., 150000" 
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label htmlFor="interestLimit" title="Maximum interest amount deductible under Section 24(b) per financial year (Default: ₹2,00,000 for self-occupied)">Interest Deduction Limit (₹) (Sec 24b):</Label>
                        <Input 
                            type="number" 
                            id="interestLimit" 
                            value={interestLimit} 
                            onChange={(e) => setInterestLimit(e.target.value)} 
                            placeholder="e.g., 200000" 
                        />
                    </FormGroup>
                </>
            )}
          </FormGroup>
          <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px'}}>
            <CancelButtonModal type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</CancelButtonModal>
            <Button type="submit">Add Loan</Button>
          </div>
        </FormContainer>
      </Modal>
    </>
  );
};

export default LoanForm;
