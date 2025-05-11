// src/components/SettingsButton.tsx
import React from 'react';
import styled from 'styled-components';

const FloatingSettingsButton = styled.button`
  position: fixed;
  bottom: 30px; 
  left: 30px;  
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #6c757d; 
  color: white;
  font-size: 24px; // Icon size
  border: none;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1040;
  transition: background-color 0.2s, transform 0.1s ease-out;

  &:hover {
    background-color: #545b62;
    transform: translateY(-1px);
  }
   &:active {
    transform: translateY(0px);
  }
`;

interface SettingsButtonProps {
  onClick: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <FloatingSettingsButton onClick={onClick} title="Open Settings">
      ⚙️
    </FloatingSettingsButton>
  );
};

export default SettingsButton;
