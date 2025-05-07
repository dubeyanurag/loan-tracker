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
  ChartOptions, // Import ChartOptions type
  ChartData   // Import ChartData type
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation'; // Import annotation plugin
import { AmortizationEntry } from '../types';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  annotationPlugin // Register annotation plugin
);

const ChartContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
`;

interface LoanChartProps {
  schedule: AmortizationEntry[];
}

const LoanChart: React.FC<LoanChartProps> = ({ schedule }) => {
  if (!schedule || schedule.length === 0) {
    return null; // Don't render if no schedule
  }

  // Find index corresponding to the current month/year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January)
  
  let currentMonthIndex = -1;
  for(let i = 0; i < schedule.length; i++) {
      const entryDate = new Date(schedule[i].paymentDate);
      if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
          currentMonthIndex = i;
          break;
      }
      if (entryDate > now && i > 0) { 
          break; 
      }
  }

  const labels = schedule.map(entry => `Month ${entry.monthNumber}`);
  const dataPoints = schedule.map(entry => entry.closingBalance);

  // Explicitly type the data object
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Outstanding Balance (₹)',
        data: dataPoints,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1, 
        pointRadius: 1, 
      },
    ],
  };

  // Explicitly type the options object
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true, // Maintain aspect ratio
    plugins: { // Top-level plugins object
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Loan Balance Over Time',
      },
      tooltip: {
          callbacks: {
              label: function(context: any) { // Keep 'any' for simplicity or define specific context type
                  let label = context.dataset.label || '';
                  if (label) {
                      label += ': ';
                  }
                  if (context.parsed.y !== null) {
                      label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y);
                  }
                  return label;
              }
          }
      },
      // Annotation configuration nested within plugins
      annotation: { 
        annotations: {
          ...(currentMonthIndex !== -1 && { // Conditionally add annotation
            currentMonthLine: {
              type: 'line' as const,
              scaleID: 'x',
              value: currentMonthIndex, // X-axis index (category)
              borderColor: 'red',
              borderWidth: 2,
              borderDash: [6, 6], // Dashed line
              label: {
                display: true,
                content: 'Current Month',
                position: 'start',
                backgroundColor: 'rgba(255, 0, 0, 0.7)',
                color: 'white',
                font: {
                  size: 10
                }
              }
            }
          })
        }
      }
    }, // End of plugins object
    scales: { // Separate top-level scales object
        y: {
            ticks: {
                // Include a currency sign in the ticks
                callback: function(value: any, index: any, ticks: any) { // Keep 'any' or define specific types
                    return '₹' + value.toLocaleString();
                }
            }
        }
        // x scale is implicitly handled by CategoryScale
    } // End of scales object
  };

  return (
    <ChartContainer>
      <h4>Visualizations</h4>
      <Line options={options} data={data} />
      {/* We can add more charts here later, e.g., Principal vs Interest */}
    </ChartContainer>
  );
};

export default LoanChart;
