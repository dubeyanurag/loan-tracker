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
} from 'chart.js';
import { AmortizationEntry } from '../types';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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

  const labels = schedule.map(entry => `Month ${entry.monthNumber}`);
  const dataPoints = schedule.map(entry => entry.closingBalance);

  const data = {
    labels,
    datasets: [
      {
        label: 'Outstanding Balance (₹)',
        data: dataPoints,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1, // Smoothens the line slightly
        pointRadius: 1, // Smaller points
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Loan Balance Over Time',
      },
      tooltip: {
          callbacks: {
              label: function(context: any) {
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
      }
    },
    scales: {
        y: {
            ticks: {
                // Include a currency sign in the ticks
                callback: function(value: any, index: any, ticks: any) {
                    return '₹' + value.toLocaleString();
                }
            }
        }
    }
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
