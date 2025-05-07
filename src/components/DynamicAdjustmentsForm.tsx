// src/components/DynamicAdjustmentsForm.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { InterestRateChange, CustomEMIChange } from '../types';
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
  background-color: #ffc107; /* Yellow for adjustments */
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0a800;
  }
`;

const Fieldset = styled.fieldset`
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
`;

const Legend = styled.legend`
  font-weight: bold;
  padding: 0 5px;
`;


const DynamicAdjustmentsForm: React.FC = () => {
  const { selectedLoanId, loans } = useAppState();
  const dispatch = useAppDispatch();

  // State for ROI Change
  const [newRoi, setNewRoi] = useState('');
  const [roiChangeDate, setRoiChangeDate] = useState(new Date().toISOString().split('T')[0]);
  const [adjustmentPreference, setAdjustmentPreference] = useState<'adjustTenure' | 'adjustEMI' | 'customEMI'>('adjustTenure');
  const [customNewEmiForRoi, setCustomNewEmiForRoi] = useState('');

  // State for Custom EMI Change (Voluntary)
  const [customEmi, setCustomEmi] = useState('');
  const [customEmiDate, setCustomEmiDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEmiRemarks, setCustomEmiRemarks] = useState('');

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  const handleRoiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Please select a loan first.');
      return;
    }
    const rate = parseFloat(newRoi);
    if (isNaN(rate) || rate <= 0) {
      alert('Please enter a valid new interest rate.');
      return;
    }
    if (!roiChangeDate) {
      alert('Please select the date of ROI change.');
      return;
    }

    let newEmiForRoiPayload: number | undefined = undefined;
    if (adjustmentPreference === 'customEMI') {
        newEmiForRoiPayload = parseFloat(customNewEmiForRoi);
        if(isNaN(newEmiForRoiPayload) || newEmiForRoiPayload <=0) {
            alert('Please enter a valid custom EMI for ROI change.');
            return;
        }
    }


    const roiChangeData: Omit<InterestRateChange, 'id'> = {
      date: roiChangeDate,
      newRate: rate,
      adjustmentPreference,
      newEMIIfApplicable: newEmiForRoiPayload,
    };

    dispatch({ type: 'ADD_INTEREST_RATE_CHANGE', payload: { loanId: selectedLoanId, change: roiChangeData as InterestRateChange } });
    
    setNewRoi('');
    // setRoiChangeDate(new Date().toISOString().split('T')[0]);
    setCustomNewEmiForRoi('');
  };

  const handleCustomEmiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) {
      alert('Please select a loan first.');
      return;
    }
    const emi = parseFloat(customEmi);
    if (isNaN(emi) || emi <= 0) {
      alert('Please enter a valid new EMI amount.');
      return;
    }
    if (!customEmiDate) {
      alert('Please select the date of EMI change.');
      return;
    }

    const customEmiData: Omit<CustomEMIChange, 'id'> = {
      date: customEmiDate,
      newEMI: emi,
      remarks: customEmiRemarks,
    };
    dispatch({ type: 'ADD_CUSTOM_EMI_CHANGE', payload: { loanId: selectedLoanId, change: customEmiData as CustomEMIChange } });

    setCustomEmi('');
    // setCustomEmiDate(new Date().toISOString().split('T')[0]);
    setCustomEmiRemarks('');
  };
  
  if (!selectedLoanId) {
    return null; // Don't show form if no loan is selected
  }

  return (
    <div>
      <FormContainer onSubmit={handleRoiSubmit}>
        <Fieldset>
          <Legend>Record Rate of Interest (ROI) Change for "{selectedLoan?.name}"</Legend>
          <FormGroup>
            <Label htmlFor="newRoi">New Annual ROI (%):</Label>
            <Input type="number" step="0.01" id="newRoi" value={newRoi} onChange={(e) => setNewRoi(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="roiChangeDate">Date of Change:</Label>
            <Input type="date" id="roiChangeDate" value={roiChangeDate} onChange={(e) => setRoiChangeDate(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="adjustmentPreference">Recalculation Preference:</Label>
            <Select id="adjustmentPreference" value={adjustmentPreference} onChange={(e) => setAdjustmentPreference(e.target.value as 'adjustTenure' | 'adjustEMI' | 'customEMI')}>
              <option value="adjustTenure">Keep EMI Same, Adjust Tenure</option>
              <option value="adjustEMI">Keep Tenure Same, Adjust EMI</option>
              <option value="customEMI">Set New Custom EMI, Adjust Tenure</option>
            </Select>
          </FormGroup>
          {adjustmentPreference === 'customEMI' && (
            <FormGroup>
              <Label htmlFor="customNewEmiForRoi">New Custom EMI (₹) for this ROI change:</Label>
              <Input type="number" id="customNewEmiForRoi" value={customNewEmiForRoi} onChange={(e) => setCustomNewEmiForRoi(e.target.value)} required />
            </FormGroup>
          )}
          <Button type="submit">Record ROI Change</Button>
        </Fieldset>
      </FormContainer>

      <FormContainer onSubmit={handleCustomEmiSubmit}>
        <Fieldset>
          <Legend>Record Voluntary EMI Change for "{selectedLoan?.name}"</Legend>
          <FormGroup>
            <Label htmlFor="customEmi">New EMI Amount (₹):</Label>
            <Input type="number" id="customEmi" value={customEmi} onChange={(e) => setCustomEmi(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="customEmiDate">Date of Change:</Label>
            <Input type="date" id="customEmiDate" value={customEmiDate} onChange={(e) => setCustomEmiDate(e.target.value)} required />
          </FormGroup>
          <FormGroup>
            <Label htmlFor="customEmiRemarks">Remarks (Optional):</Label>
            <Input type="text" id="customEmiRemarks" value={customEmiRemarks} onChange={(e) => setCustomEmiRemarks(e.target.value)} />
          </FormGroup>
          <Button type="submit">Record Custom EMI Change</Button>
        </Fieldset>
      </FormContainer>
    </div>
  );
};

export default DynamicAdjustmentsForm;
