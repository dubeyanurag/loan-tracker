// src/components/ShareState.tsx
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useAppState } from '../contexts/AppContext';

const ShareContainer = styled.div`
  margin-top: 30px;
  padding: 15px;
  border: 1px dashed #ccc;
  border-radius: 5px;
  background-color: #f8f9fa;
`;

const ShareButton = styled.button`
  padding: 8px 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  margin-right: 10px;

  &:hover {
    background-color: #5a6268;
  }
`;

const ShareUrlInput = styled.input`
  width: calc(100% - 130px); /* Adjust width based on button size */
  padding: 8px;
  margin-right: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
`;

const CopyButton = styled(ShareButton)`
    background-color: #28a745;
     &:hover {
        background-color: #218838;
     }
`;

const ShareState: React.FC = () => {
  const state = useAppState();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateUrl = useCallback(() => {
    try {
      const jsonState = JSON.stringify(state);
      const base64State = btoa(jsonState);
      // Construct URL relative to the deployment base path
      const baseUrl = window.location.origin + (import.meta.env.BASE_URL || '/'); 
      const url = `${baseUrl}?loadState=${encodeURIComponent(base64State)}`;
      setShareUrl(url);
      setCopied(false); // Reset copied status
    } catch (error) {
      console.error("Error generating share URL:", error);
      alert("Failed to generate share URL.");
    }
  }, [state]);

  const copyUrl = useCallback(() => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Show "Copied!" for 2 seconds
      }).catch(err => {
        console.error('Failed to copy URL: ', err);
        alert('Failed to copy URL to clipboard.');
      });
    }
  }, [shareUrl]);

  return (
    <ShareContainer>
      <h4>Share Current State</h4>
      <p style={{fontSize: '0.85em', color: '#555'}}>Generate a link to share the current loan data with others or bookmark it.</p>
      <ShareButton onClick={generateUrl}>Generate Share Link</ShareButton>
      {shareUrl && (
        <div style={{marginTop: '10px'}}>
          <ShareUrlInput type="text" value={shareUrl} readOnly />
          <CopyButton onClick={copyUrl}>
            {copied ? 'Copied!' : 'Copy URL'}
          </CopyButton>
        </div>
      )}
    </ShareContainer>
  );
};

export default ShareState;
