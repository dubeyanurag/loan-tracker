// src/components/LoanChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom'; // Import zoom plugin
import { AmortizationEntry, Loan } from '../types'; // Import Loan type
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin,
  zoomPlugin // Register zoom plugin
);

const ChartContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
  position: relative; /* Needed for reset button positioning */
`;

const ResetZoomButton = styled.button`
    position: absolute;
    top: 45px; /* Adjust as needed */
    right: 20px;
    padding: 3px 8px;
    font-size: 0.8em;
    cursor: pointer;
    z-index: 10; /* Ensure it's above the chart */
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
     &:hover {
        background-color: #ddd;
     }
`;


interface LoanChartProps {
  schedule: AmortizationEntry[];
  loan: Loan; // Need full loan for events
}

const LoanChart: React.FC<LoanChartProps> = ({ schedule, loan }) => {
  const chartRef = React.useRef<ChartJS<'line'>>(null); // Ref to access chart instance

  if (!schedule || schedule.length === 0) {
    return null; 
  }

  // --- Find current month index ---
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); 
  let currentMonthIndex = -1;
  // --- Find event indices ---
  const eventAnnotations: any = {}; // Using 'any' for annotation config flexibility

  // Helper to find schedule index for an event date
  const findScheduleIndex = (eventDateStr: string): number => {
    const eventDate = new Date(eventDateStr);
    // Find the first schedule entry whose date is >= event date
    return schedule.findIndex(entry => new Date(entry.paymentDate) >= eventDate);
  };

  // Current Month Annotation
  for(let i = 0; i < schedule.length; i++) {
      const entryDate = new Date(schedule[i].paymentDate);
      if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
          currentMonthIndex = i;
          break;
      }
      if (entryDate > now && i > 0) break; 
  }
  if (currentMonthIndex !== -1) {
      eventAnnotations['currentMonthLine'] = {
          type: 'line' as const, scaleID: 'x', value: currentMonthIndex,
          borderColor: 'red', borderWidth: 1, borderDash: [6, 6],
          label: { display: true, content: 'Current', position: 'start', 
                   backgroundColor: 'rgba(255,0,0,0.7)', color: 'white', font: { size: 9 } }
      };
  }

  // Prepayment Annotations
  loan.paymentHistory.filter(p => p.type === 'Prepayment').forEach((p, idx) => {
      const index = findScheduleIndex(p.date);
      if (index !== -1) {
          eventAnnotations[`prepay_${idx}`] = {
              type: 'line' as const, scaleID: 'x', value: index,
              borderColor: 'green', borderWidth: 1, borderDash: [3, 3],
              label: { display: true, content: `Prepay: ${p.amount.toLocaleString()}`, position: 'end', 
                       backgroundColor: 'rgba(0,128,0,0.7)', color: 'white', font: { size: 9 } }
          };
      }
  });

  // ROI Change Annotations
  loan.interestRateChanges.forEach((c, idx) => {
      const index = findScheduleIndex(c.date);
      if (index !== -1) {
          eventAnnotations[`roi_${idx}`] = {
              type: 'line' as const, scaleID: 'x', value: index,
              borderColor: 'orange', borderWidth: 1, borderDash: [4, 4],
              label: { display: true, content: `ROI: ${c.newRate}%`, position: 'end', 
                       backgroundColor: 'rgba(255,165,0,0.7)', color: 'black', font: { size: 9 } }
          };
      }
  });

    // Custom EMI Change Annotations
  loan.customEMIChanges.forEach((c, idx) => {
      const index = findScheduleIndex(c.date);
      if (index !== -1) {
          eventAnnotations[`emi_${idx}`] = {
              type: 'line' as const, scaleID: 'x', value: index,
              borderColor: 'purple', borderWidth: 1, borderDash: [5, 5],
              label: { display: true, content: `EMI: ${c.newEMI.toLocaleString()}`, position: 'end', 
                       backgroundColor: 'rgba(128,0,128,0.7)', color: 'white', font: { size: 9 } }
          };
      }
  });


  // --- Prepare Chart Data ---
  const labels = schedule.map(entry => `Month ${entry.monthNumber}`);
  const balanceData = schedule.map(entry => entry.closingBalance);
  const principalData = schedule.map(entry => entry.principalPaid);
  const interestData = schedule.map(entry => entry.interestPaid);

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Outstanding Balance (₹)',
        data: balanceData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'yBalance', // Assign to primary y-axis
        tension: 0.1, 
        pointRadius: 1, 
      },
      {
        label: 'Principal Paid (₹)',
        data: principalData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'yPayments', // Assign to secondary y-axis
        tension: 0.1,
        pointRadius: 1,
        borderDash: [5, 5], // Dashed line for P/I
      },
      {
        label: 'Interest Paid (₹)',
        data: interestData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'yPayments', // Assign to secondary y-axis
        tension: 0.1,
        pointRadius: 1,
        borderDash: [5, 5], // Dashed line for P/I
      },
    ],
  };

  // --- Prepare Chart Options ---
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { // Enable interaction for tooltips etc.
        mode: 'index',
        intersect: false,
    },
    plugins: { 
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Loan Details Over Time (Zoom/Pan Enabled)',
      },
      tooltip: {
          callbacks: {
              label: function(context: any) { 
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                  }
                  return label;
              }
          }
      },
      annotation: { 
        annotations: eventAnnotations // Use dynamically generated annotations
      },
      zoom: { // Zoom plugin configuration
          pan: {
              enabled: true,
              mode: 'x' as const, // Allow panning only on x-axis
          },
          zoom: {
              wheel: { enabled: true }, // Enable zooming with mouse wheel
              pinch: { enabled: true }, // Enable zooming with pinch gesture
              mode: 'x' as const, // Allow zooming only on x-axis
          }
      }
    }, 
    scales: { 
        x: { // Ensure x-axis is defined for scaleID reference
            type: 'category' as const, 
        },
        yBalance: { // Primary Y-axis for Balance
            type: 'linear' as const,
            display: true,
            position: 'left' as const,
            title: { display: true, text: 'Outstanding Balance (₹)'},
            ticks: { callback: (value) => '₹' + Number(value).toLocaleString() }
        },
        yPayments: { // Secondary Y-axis for P/I Payments
            type: 'linear' as const,
            display: true,
            position: 'right' as const,
            title: { display: true, text: 'Monthly Payment (₹)'},
            grid: { drawOnChartArea: false }, // only want the grid lines for one axis to show up
            ticks: { callback: (value) => '₹' + Number(value).toLocaleString() }
        }
    } 
  };

  const resetZoom = () => {
    chartRef.current?.resetZoom();
  };

  return (
    <ChartContainer>
      <h4>Visualizations</h4>
      <ResetZoomButton onClick={resetZoom}>Reset Zoom</ResetZoomButton>
      <Line ref={chartRef} options={options} data={data} />
    </ChartContainer>
  );
};

export default LoanChart;
