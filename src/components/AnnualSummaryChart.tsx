// src/components/AnnualSummaryChart.tsx
import React, { useState, useEffect, useRef } from 'react'; // Added back useState, useEffect, useRef
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

const ChartWrapper = styled.div`
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9; 
  height: 350px; 
  position: relative;

  @media (max-width: 768px) {
    height: 280px; 
  }

  @media (max-width: 480px) {
    height: 220px; 
    padding: 10px; 
  }
  
  &.fullscreen {
    padding: 10px;
    height: 100vh !important;
    width: 100vw !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 2000 !important;
    background-color: #fff !important;
  }
`;

const ChartControls = styled.div`
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 10;
`;

const ControlButton = styled.button`
    padding: 3px 8px;
    font-size: 0.8em;
    cursor: pointer;
    background-color: #eee;
    border: 1px solid #ccc;
    border-radius: 4px;
     &:hover {
        background-color: #ddd;
     }
`;

interface AnnualSummaryChartProps {
  annualSummaries: AnnualSummary[];
}

const AnnualSummaryChart: React.FC<AnnualSummaryChartProps> = ({ annualSummaries }) => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement = document.fullscreenElement || 
                        (document as any).webkitFullscreenElement || 
                        (document as any).mozFullScreenElement || 
                        (document as any).msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    const element = chartWrapperRef.current as any;

    const fsElement = document.fullscreenElement || 
                      (document as any).webkitFullscreenElement || 
                      (document as any).mozFullScreenElement || 
                      (document as any).msFullscreenElement;

    if (!fsElement) {
      const requestFS = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
      if (requestFS) {
        requestFS.call(element).catch((err: Error) => {
          console.error("Fullscreen request failed (AnnualSummaryChart):", err);
          alert(`Error requesting fullscreen: ${err.name} - ${err.message}`);
        });
      } else {
        alert('Fullscreen API is not supported by this browser.');
        console.warn('Fullscreen API is not supported by this browser. (AnnualSummaryChart)');
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

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
    maintainAspectRatio: false, 
    plugins: {
      legend: {
        position: 'bottom' as const, 
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
        stacked: false, 
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
    <ChartWrapper ref={chartWrapperRef} className={isFullscreen ? 'fullscreen' : ''}> 
      <ChartControls>
        <ControlButton onClick={toggleFullscreen}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </ControlButton>
      </ChartControls>
      <Bar options={options} data={data} />
    </ChartWrapper>
  );
};

export default AnnualSummaryChart;
