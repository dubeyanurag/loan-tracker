// src/components/SettingsModal.tsx
import React from 'react';
import styled from 'styled-components';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import Modal from './Modal'; // Re-use the existing Modal component

const SettingsContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: bold;
  color: #333;
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: white;
  font-size: 1em;
  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
  }
`;

// Share section styles (can be enhanced later)
const ShareSection = styled.div`
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
`;

const ShareButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #28a745; // Green for share
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #218838;
  }
`;

const ShareFeedback = styled.span`
    margin-left: 10px;
    font-size: 0.9em;
    color: #28a745;
`;


interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  // Add more currencies as needed
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { loans, selectedLoanId, currency } = useAppState(); // Get currency from state
  const dispatch = useAppDispatch();
  const [shareFeedback, setShareFeedback] = React.useState('');


  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_CURRENCY', payload: event.target.value });
  };

  const handleShare = async () => {
    const stateToShare = {
      loans: loans,
      selectedLoanId: selectedLoanId,
      currency: currency, // Include currency in shared state
    };
    const jsonState = JSON.stringify(stateToShare);
    const base64State = btoa(jsonState); // Simple encoding
    const shareUrl = `${window.location.origin}${window.location.pathname}?loadState=${encodeURIComponent(base64State)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback('Link Copied!');
      setTimeout(() => setShareFeedback(''), 2500);
    } catch (err) {
      console.error('Failed to copy shareable link: ', err);
      setShareFeedback('Failed to copy. Try manual copy.');
      setTimeout(() => setShareFeedback(''), 3000);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <SettingsContent>
        <FormGroup>
          <Label htmlFor="currency-select">Display Currency:</Label>
          <Select id="currency-select" value={currency} onChange={handleCurrencyChange}>
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormGroup>

        <ShareSection>
          <h4>Share / Export State</h4>
          <p style={{fontSize: '0.85em', color: '#666'}}>
            Copy a shareable link containing your current loan data. Anyone with the link can view (but not edit) your setup.
          </p>
          <ShareButton onClick={handleShare}>
            🔗 Copy Shareable Link
          </ShareButton>
          {shareFeedback && <ShareFeedback>{shareFeedback}</ShareFeedback>}
        </ShareSection>

        {/* Add more settings here in the future */}
      </SettingsContent>
    </Modal>
  );
};

export default SettingsModal;
