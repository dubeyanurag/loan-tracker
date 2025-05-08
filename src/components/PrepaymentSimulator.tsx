// src/components/PrepaymentSimulator.tsx
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';
import { calculateEMI, calculateNewTenureAfterPrepayment, calculateTotalInterestAndPayment, calculateTotalDisbursed } from '../utils/loanCalculations'; // Import helper

const SimulatorContainer = styled.div`
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f0f8ff; /* Light blue background */
  margin-top: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
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
  background-color: #17a2b8; /* Teal for simulator */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s;

  &:hover {
    background-color: #138496;
  }
`;

const ResultText = styled.p`
  font-size: 1.05em;
  color: #0056b3;
  margin-top: 10px;
`;

const PrepaymentSimulator: React.FC = () => {
  const { selectedLoanId, loans } = useAppState();
  const [prepaymentAmount, setPrepaymentAmount] = useState('');
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const selectedLoan = loans.find(loan => loan.id === selectedLoanId);

  // Calculate total disbursed amount
  const totalDisbursed = useMemo(() => 
    selectedLoan ? calculateTotalDisbursed(selectedLoan.details.disbursements) : 0, 
    [selectedLoan]
  );

  // Estimate current EMI based on total disbursed and original terms.
  // This remains a simplification for the simulator's baseline.
  const currentEMI = useMemo(() => {
    if (!selectedLoan || totalDisbursed <= 0) return 0;
    return calculateEMI(
      totalDisbursed, // Use total disbursed
      selectedLoan.details.originalInterestRate,
      selectedLoan.details.originalTenureMonths
    );
  }, [selectedLoan]);
  
  // Simplified outstanding principal for simulator baseline.
  // Uses total disbursed minus logged prepayments. Still inaccurate.
  const currentOutstandingPrincipal = useMemo(() => {
      if (!selectedLoan) return 0;
      let outstanding = totalDisbursed; // Start with total disbursed
      // Crude reduction based on logged prepayments only
      selectedLoan.paymentHistory.forEach(p => { 
          if (p.type === 'Prepayment') outstanding -= p.principalPaid;
      });
      return outstanding > 0 ? outstanding : 0;
  }, [selectedLoan]);


  const handleSimulate = () => {
    if (!selectedLoan) {
      alert('Please select a loan first.');
      return;
    }
    const prepayAmount = parseFloat(prepaymentAmount);
    if (isNaN(prepayAmount) || prepayAmount <= 0) {
      alert('Please enter a valid prepayment amount.');
      return;
    }

    if (prepayAmount >= currentOutstandingPrincipal) {
        setSimulationResult('This prepayment would close the loan.');
        return;
    }

    const principalAfterPrepayment = currentOutstandingPrincipal - prepayAmount;
    const monthlyInterestRate = selectedLoan.details.originalInterestRate / 12 / 100; // Simplified

    // Scenario 1: Keep EMI same, reduce tenure
    const newTenureMonths = calculateNewTenureAfterPrepayment(
      principalAfterPrepayment,
      monthlyInterestRate,
      currentEMI // Assuming current EMI is maintained
    );

    if (newTenureMonths === Infinity) {
        setSimulationResult(`With this prepayment, the current EMI (₹${currentEMI.toLocaleString()}) is too low to cover interest on the new principal of ₹${principalAfterPrepayment.toLocaleString()}.`);
        return;
    }
    
    const originalTotalPayment = calculateTotalInterestAndPayment(currentOutstandingPrincipal, currentEMI, selectedLoan.details.originalTenureMonths); // Simplified original tenure
    const newTotalPayment = calculateTotalInterestAndPayment(principalAfterPrepayment, currentEMI, newTenureMonths);
    const interestSaved = originalTotalPayment.totalInterest - newTotalPayment.totalInterest; // This is a rough estimate

    const years = Math.floor(newTenureMonths / 12);
    const months = newTenureMonths % 12;

    setSimulationResult(
      `With a prepayment of ₹${prepayAmount.toLocaleString()}:\n` +
      `New outstanding principal: ₹${principalAfterPrepayment.toLocaleString()}.\n` +
      `If EMI remains ₹${currentEMI.toLocaleString()}:\n` +
      `New tenure could be approx. ${years} years and ${months} months.\n` +
      `Approximate interest saved: ₹${interestSaved > 0 ? interestSaved.toLocaleString() : 'N/A (check inputs)'}. (Note: This is a simplified calculation)`
    );
  };

  if (!selectedLoanId) {
    return null; // Don't show if no loan selected
  }

  return (
    <SimulatorContainer>
      <h4>Prepayment Simulator for "{selectedLoan?.name}"</h4>
      <FormGroup>
        <Label htmlFor="prepaymentAmount">Hypothetical Prepayment Amount (₹):</Label>
        <Input 
          type="number" 
          id="prepaymentAmount" 
          value={prepaymentAmount} 
          onChange={(e) => setPrepaymentAmount(e.target.value)} 
        />
      </FormGroup>
      <Button onClick={handleSimulate}>Simulate Impact</Button>
      {simulationResult && <ResultText style={{whiteSpace: 'pre-line'}}>{simulationResult}</ResultText>}
      <p style={{fontSize: '0.8em', color: '#777', marginTop: '10px'}}>
        Note: This simulator currently uses simplified outstanding principal and initial EMI. 
        Accurate simulation requires full amortization history.
      </p>
    </SimulatorContainer>
  );
};

export default PrepaymentSimulator;
