// src/components/LoanForm.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { Loan, LoanDetails, Disbursement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import styled from 'styled-components';

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

const ToggleButton = styled(Button)`
  background-color: #607d8b; 
  margin-bottom: 1rem; 
  align-self: flex-start; 
  &:hover {
    background-color: #455a64;
  }
`;

const LoanForm: React.FC = () => {
  const { loans } = useAppState(); 
  const dispatch = useAppDispatch();
  const [isCollapsed, setIsCollapsed] = useState(loans.length > 0); 

  useEffect(() => {
    setIsCollapsed(loans.length > 0);
  }, [loans.length]);

  const [name, setName] = useState('');
  const [initialDisbursementAmount, setInitialDisbursementAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [startDate, setStartDate] = useState(''); 
  const [startedWithPreEMI, setStartedWithPreEMI] = useState(false); 
  const [emiStartDate, setEmiStartDate] = useState(''); 
  const [emiDebitDay, setEmiDebitDay] = useState(''); // New state for EMI Debit Day
  const [isTaxDeductible, setIsTaxDeductible] = useState(true); 
  const [principalLimit, setPrincipalLimit] = useState('150000'); 
  const [interestLimit, setInterestLimit] = useState('200000'); 


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
      emiDebitDay: debitDay, // Add emiDebitDay
      isTaxDeductible: isTaxDeductible,
      principalDeductionLimit: isTaxDeductible ? parseFloat(principalLimit) || 150000 : undefined,
      interestDeductionLimit: isTaxDeductible ? parseFloat(interestLimit) || 200000 : undefined,
    };

    if (!name || 
        isNaN(loanDetails.originalInterestRate) || loanDetails.originalInterestRate <= 0 ||
        isNaN(loanDetails.originalTenureMonths) || loanDetails.originalTenureMonths <= 0 ||
        !loanDetails.startDate ||
        (startedWithPreEMI && !emiStartDate) ) { 
      alert('Please fill in all fields correctly, including EMI Start Date if applicable.');
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

    setName('');
    setInitialDisbursementAmount(''); 
    setInterestRate('');
    setTenureMonths('');
    setStartDate('');
    setStartedWithPreEMI(false); 
    setEmiStartDate(''); 
    setEmiDebitDay(''); // Reset emiDebitDay
    setIsTaxDeductible(true); 
    setPrincipalLimit('150000'); 
    setInterestLimit('200000');
    setIsCollapsed(true); 
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Add New Loan</h3>
        {loans.length > 0 && 
            <ToggleButton type="button" onClick={() => setIsCollapsed(true)} style={{marginBottom: 0, padding: '0.4rem 0.8rem', marginTop: 0}}> 
                Collapse [-]
            </ToggleButton>
        }
      </div>
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

      <Button type="submit">Add Loan</Button>
    </FormContainer>
  );
};

export default LoanForm;
