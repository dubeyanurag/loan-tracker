// src/components/AnnualSummaryChart.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { AnnualSummary } from '../types';
import styled from 'styled-components';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ChartContainer = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9; // Slightly different background for chart section
`;

interface AnnualSummaryChartProps {
  annualSummaries: AnnualSummary[];
}

const AnnualSummaryChart: React.FC<AnnualSummaryChartProps> = ({ annualSummaries }) => {
  if (!annualSummaries || annualSummaries.length === 0) {
    return <p>No annual summary data available for chart.</p>;
  }

  const labels = annualSummaries.map(summary => summary.yearLabel);
  
  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: 'Total Principal Paid (₹)',
        data: annualSummaries.map(s => s.totalPrincipalPaid),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Interest Paid (₹) (Regular + Pre-EMI)',
        data: annualSummaries.map(s => s.totalInterestPaid + s.totalPreEMIInterestPaid),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Prepayments Made (₹)',
        data: annualSummaries.map(s => s.totalPrepaymentsMade),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Annual Loan Summary Overview',
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
      }
    },
    scales: {
      x: {
        stacked: false, // Set to true if you want bars for P, I, Prepay stacked for each year
      },
      y: {
        stacked: false,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount (₹)'
        },
        ticks: {
          callback: function(value) {
            return '₹' + Number(value).toLocaleString('en-IN');
          }
        }
      },
    },
  };

  return (
    <ChartContainer>
      <Bar options={options} data={data} />
    </ChartContainer>
  );
};

export default AnnualSummaryChart;
