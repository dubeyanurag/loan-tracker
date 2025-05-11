// src/components/Modal.tsx
import React, { ReactNode } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; // Ensure it's above other content
`;

const ModalContentWrapper = styled.div`
  background: white;
  padding: 25px;
  border-radius: 8px;
  max-width: 700px; // Max width of the modal
  width: 90%;      // Responsive width
  max-height: 90vh; // Max height
  overflow-y: auto;  // Scrollable if content overflows
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  position: relative; // For potential close button positioning
`;

const ModalTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  line-height: 1;
  padding: 0;

  &:hover {
    color: #333;
  }
`;


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalOverlay onClick={onClose}> {/* Close on overlay click */}
      <ModalContentWrapper onClick={e => e.stopPropagation()}> {/* Prevent closing when clicking inside content */}
        <CloseButton onClick={onClose} title="Close modal">&times;</CloseButton>
        {title && <ModalTitle>{title}</ModalTitle>}
        {children}
      </ModalContentWrapper>
    </ModalOverlay>
  );
};

export default Modal;
