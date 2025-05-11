// src/components/ShareState.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';

const FloatingShareButton = styled.button`
  position: fixed;
  bottom: 30px; 
  left: 30px;  
  width: 50px;   // Slightly smaller than main FAB
  height: 50px;
  border-radius: 50%;
  background-color: #6c757d; // Secondary button color (e.g., grey)
  color: white;
  font-size: 20px; // For icon
  border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1040; // Below main FAB if they could overlap, but positioned differently
  transition: background-color 0.2s, transform 0.1s ease-out;

  &:hover {
    background-color: #545b62;
    transform: translateY(-1px);
  }
   &:active {
    transform: translateY(0px);
  }
`;

const TooltipText = styled.span`
  visibility: hidden;
  width: 120px;
  background-color: #555;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  position: absolute;
  z-index: 1;
  bottom: 125%; // Position above the button
  left: 50%;
  margin-left: -60px; // Use half of the width to center the tooltip
  opacity: 0;
  transition: opacity 0.3s;

  &::after { // Tooltip arrow
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #555 transparent transparent transparent;
  }

  ${FloatingShareButton}:hover & {
    visibility: visible;
    opacity: 1;
  }
`;


const ShareState: React.FC = () => {
  const appState = useAppState();
  const [tooltipMessage, setTooltipMessage] = useState('Copy Shareable Link');

  const handleShare = async () => {
    const stateToShare = {
      loans: appState.loans,
      selectedLoanId: appState.selectedLoanId,
      // Do not include editingLoanId or other transient UI state
    };
    const jsonState = JSON.stringify(stateToShare);
    const base64State = btoa(jsonState);
    const shareUrl = `${window.location.origin}${window.location.pathname}?loadState=${encodeURIComponent(base64State)}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setTooltipMessage('Link Copied!');
      setTimeout(() => setTooltipMessage('Copy Shareable Link'), 2000); // Reset after 2s
    } catch (err) {
      console.error('Failed to copy shareable link: ', err);
      setTooltipMessage('Failed to copy!');
      setTimeout(() => setTooltipMessage('Copy Shareable Link'), 2000);
    }
  };

  return (
    <FloatingShareButton onClick={handleShare} title="Share current loan setup">
      🔗
      {/* Using a link emoji. Could be replaced with an SVG share icon */}
      <TooltipText>{tooltipMessage}</TooltipText>
    </FloatingShareButton>
  );
};

export default ShareState;
