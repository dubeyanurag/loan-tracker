// src/components/LoanHistoryTimeline.tsx
import React from 'react';
import styled from 'styled-components';
import { Loan, Disbursement, Payment, InterestRateChange, CustomEMIChange } from '../types';

const TimelineContainer = styled.div`
  margin-top: 20px;
  h4 {
    margin-bottom: 10px;
    color: #3f51b5; // Similar to other subheadings
  }
`;

const TimelineList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  position: relative;
  border-left: 2px solid #1976d2; // Timeline main line
  margin-left: 10px; // Space for icons
`;

const TimelineItem = styled.li`
  margin-bottom: 15px;
  padding-left: 25px; // Space for icon and line
  position: relative;

  &:before { // Circle on the timeline
    content: '';
    position: absolute;
    left: -9px; // Adjust to center on the border-left of TimelineList
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

  span { // For highlighting amounts or rates
    font-weight: bold;
    color: #007bff;
  }
`;

const EventIcon = styled.span`
  position: absolute;
  left: -20px; // Adjust to be slightly left of the circle
  top: 3px;
  font-size: 1.2em;
`;


interface LoanHistoryTimelineProps {
  loan: Loan;
}

type TimelineEvent = {
  date: string;
  type: 'Disbursement' | 'Prepayment' | 'ROI Change' | 'Custom EMI' | 'Loan Start';
  details: string;
  icon: string;
  originalEvent: any; // Store original event for potential future use (e.g., editing from timeline)
};

const LoanHistoryTimeline: React.FC<LoanHistoryTimelineProps> = ({ loan }) => {
  const events: TimelineEvent[] = [];

  // Loan Start
  events.push({
    date: loan.details.startDate,
    type: 'Loan Start',
    details: `Loan started with initial rate <span>${loan.details.originalInterestRate}%</span> for <span>${loan.details.originalTenureMonths}</span> months.`,
    icon: '🏁',
    originalEvent: loan.details,
  });
  
  // Disbursements
  loan.details.disbursements.forEach((d, index) => {
    // Avoid duplicating the very first disbursement if it's the same as loan start
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

  // Prepayments
  loan.paymentHistory?.filter(p => p.type === 'Prepayment').forEach(p => {
    events.push({
      date: p.date,
      type: 'Prepayment',
      details: `Prepayment: <span>₹${p.amount.toLocaleString()}</span>. ${p.remarks || ''} ${p.adjustmentPreference ? `(Preference: ${p.adjustmentPreference})` : ''}`,
      icon: '💰',
      originalEvent: p,
    });
  });

  // ROI Changes
  loan.interestRateChanges?.forEach(c => {
    events.push({
      date: c.date,
      type: 'ROI Change',
      details: `Interest rate changed to <span>${c.newRate}%</span>. ${c.adjustmentPreference ? `(Preference: ${c.adjustmentPreference})` : ''}`,
      icon: '📈',
      originalEvent: c,
    });
  });

  // Custom EMI Changes
  loan.customEMIChanges?.forEach(c => {
    events.push({
      date: c.date,
      type: 'Custom EMI',
      details: `EMI set to <span>₹${c.newEMI.toLocaleString()}</span>. ${c.remarks || ''}`,
      icon: '⚙️', // Using gear for custom/set
      originalEvent: c,
    });
  });

  // Sort all events by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (events.length <= 1 && events[0]?.type === 'Loan Start' && !events[0].details.includes('Initial disbursement')) { // Only loan start without disbursement info
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
            {/* <EventIcon>{event.icon}</EventIcon> */} {/* Icon can be part of details or styled differently */}
            <EventDate>{new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} - {event.type}</EventDate>
            <EventDetails dangerouslySetInnerHTML={{ __html: `${event.icon} ${event.details}` }} />
          </TimelineItem>
        ))}
      </TimelineList>
    </TimelineContainer>
  );
};

export default LoanHistoryTimeline;
