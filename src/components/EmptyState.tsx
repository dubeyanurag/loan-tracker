// src/components/EmptyState.tsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  border-radius: 8px;
  background-color: #f9f9f9; // Light background for the empty state itself
  margin: 20px; // Give it some margin if it's replacing a section
  animation: ${fadeIn} 0.5s ease-out;
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem; // Large icon
  color: #1976d2; // Theme color
  margin-bottom: 20px;
  // Simple piggy bank or document icon using text/emoji
  // For a more professional look, an SVG would be better.
`;

const EmptyStateTitle = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 10px;
`;

const EmptyStateMessage = styled.p`
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  max-width: 400px;
`;

const EmptyState: React.FC = () => {
  return (
    <EmptyStateContainer>
      <EmptyStateIcon>
        {/* Using a simple document with plus, or piggy bank emoji */}
        {/* For better visuals, replace with an SVG icon */}
        📄+ 
        {/* Alternative: 🐖💰 */}
      </EmptyStateIcon>
      <EmptyStateTitle>Welcome to Your Loan Tracker!</EmptyStateTitle>
      <EmptyStateMessage>
        It looks like you haven't added any loans yet. 
        Click the <strong>+</strong> button at the bottom-right to add your first loan and start tracking!
      </EmptyStateMessage>
    </EmptyStateContainer>
  );
};

export default EmptyState;
