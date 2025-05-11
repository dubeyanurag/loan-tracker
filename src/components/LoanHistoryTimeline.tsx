// src/components/LoanHistoryTimeline.tsx
import React from 'react';
import styled from 'styled-components';
import { Loan, AmortizationEntry } from '../types'; // Added AmortizationEntry

const TimelineContainer = styled.div`
  margin-top: 20px;
  h4 {
    margin-bottom: 10px;
    color: #3f51b5; 
  }
`;

const TimelineList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  position: relative;
  border-left: 2px solid #1976d2; 
  margin-left: 10px; 
`;

const TimelineItem = styled.li`
  margin-bottom: 15px;
  padding-left: 25px; 
  position: relative;

  &:before { 
    content: '';
    position: absolute;
    left: -9px; 
    top: 5px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid #1976d2; 
  }
`;

const EventDate = styled.strong`
  display: block;
  color: #555;
  margin-bottom: 3px;
  font-size: 0.9em;
`;

const EventDetails = styled.p`
  margin: 0;
  font-size: 0.95em;
  color: #333;
  line-height: 1.4;

  span { 
    font-weight: bold;
    color: #007bff;
  }
`;

interface LoanHistoryTimelineProps {
  loan: Loan;
  schedule: AmortizationEntry[]; // Added schedule prop
}

type TimelineEvent = {
  date: string;
  type: 'Disbursement' | 'Prepayment' | 'ROI Change' | 'Custom EMI' | 'Loan Start';
  details: string;
  icon: string;
  originalEvent: any; 
};

const LoanHistoryTimeline: React.FC<LoanHistoryTimelineProps> = ({ loan, schedule }) => {
  const events: TimelineEvent[] = [];

  events.push({
    date: loan.details.startDate,
    type: 'Loan Start',
    details: `Loan started with initial rate <span>${loan.details.originalInterestRate}%</span> for <span>${loan.details.originalTenureMonths}</span> months.`,
    icon: '🏁',
    originalEvent: loan.details,
  });
  
  loan.details.disbursements.forEach((d, index) => {
    if (index === 0 && d.date === loan.details.startDate && d.remarks === 'Initial Disbursement') {
        const firstDisbursementDetail = events.find(e => e.type === 'Loan Start');
        if (firstDisbursementDetail) {
            firstDisbursementDetail.details += ` Initial disbursement: <span>₹${d.amount.toLocaleString()}</span>.`;
        }
    } else {
        events.push({
            date: d.date,
            type: 'Disbursement',
            details: `Disbursed: <span>₹${d.amount.toLocaleString()}</span>. ${d.remarks || ''}`,
            icon: '💸',
            originalEvent: d,
        });
    }
  });

  loan.paymentHistory?.filter(p => p.type === 'Prepayment').forEach(p => {
    let detailString = `Prepayment: <span>₹${p.amount.toLocaleString()}</span>. ${p.remarks || ''}`;
    if (p.adjustmentPreference) {
      detailString += ` (Preference: ${p.adjustmentPreference})`;
      // Find the schedule entry for the month of or after this prepayment
      const eventDate = new Date(p.date);
      const scheduleEntryAfterEvent = schedule.find(entry => {
        const entryDate = new Date(entry.paymentDate);
        // Check if entryDate is in the same month as eventDate or the next month
        return entryDate.getFullYear() > eventDate.getFullYear() ||
               (entryDate.getFullYear() === eventDate.getFullYear() && entryDate.getMonth() >= eventDate.getMonth());
      });

      if (scheduleEntryAfterEvent) {
        if (p.adjustmentPreference === 'adjustEMI') {
          detailString += `. New EMI: <span>₹${scheduleEntryAfterEvent.emi.toLocaleString()}</span>.`;
        } else { // adjustTenure
          detailString += `. EMI maintained at ~<span>₹${scheduleEntryAfterEvent.emi.toLocaleString()}</span>. Tenure adjusted.`;
        }
      }
    }
    events.push({
      date: p.date,
      type: 'Prepayment',
      details: detailString,
      icon: '💰',
      originalEvent: p,
    });
  });

  loan.interestRateChanges?.forEach(c => {
    let detailString = `Interest rate changed to <span>${c.newRate}%</span>.`;
    if (c.adjustmentPreference) {
      detailString += ` (Preference: ${c.adjustmentPreference})`;
      const eventDate = new Date(c.date);
      const scheduleEntryAfterEvent = schedule.find(entry => {
        const entryDate = new Date(entry.paymentDate);
        return entryDate.getFullYear() > eventDate.getFullYear() ||
               (entryDate.getFullYear() === eventDate.getFullYear() && entryDate.getMonth() >= eventDate.getMonth());
      });
      
      if (scheduleEntryAfterEvent) {
        if (c.adjustmentPreference === 'adjustEMI' || c.adjustmentPreference === 'customEMI') {
          detailString += `. New EMI: <span>₹${scheduleEntryAfterEvent.emi.toLocaleString()}</span>.`;
        } else { // adjustTenure
          detailString += `. EMI maintained at ~<span>₹${scheduleEntryAfterEvent.emi.toLocaleString()}</span>. Tenure adjusted.`;
        }
      }
    }
    events.push({
      date: c.date,
      type: 'ROI Change',
      details: detailString,
      icon: '📈',
      originalEvent: c,
    });
  });

  loan.customEMIChanges?.forEach(c => {
    events.push({
      date: c.date,
      type: 'Custom EMI',
      details: `EMI set to <span>₹${c.newEMI.toLocaleString()}</span>. ${c.remarks || ''}`,
      icon: '⚙️',
      originalEvent: c,
    });
  });

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length <= 1 && events[0]?.type === 'Loan Start' && !events[0].details.includes('Initial disbursement')) {
    return (
      <TimelineContainer>
        <h4>Loan Event History</h4>
        <p>No significant events recorded beyond loan initiation terms.</p>
      </TimelineContainer>
    );
  }

  return (
    <TimelineContainer>
      <h4>Loan Event History</h4>
      <TimelineList>
        {events.map((event, index) => (
          <TimelineItem key={index}>
            <EventDate>{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {event.type}</EventDate>
            <EventDetails dangerouslySetInnerHTML={{ __html: `${event.icon} ${event.details}` }} />
          </TimelineItem>
        ))}
      </TimelineList>
    </TimelineContainer>
  );
};

export default LoanHistoryTimeline;
