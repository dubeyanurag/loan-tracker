// src/components/LoanChart.tsx
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
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
import zoomPlugin from 'chartjs-plugin-zoom';
import { AmortizationEntry, Loan } from '../types';
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
  zoomPlugin
);

const ChartWrapper = styled.div` // Renamed from ChartContainer for clarity with fullscreen
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
  position: relative; 
  height: 400px; 

  @media (max-width: 768px) {
    height: 300px; 
  }

  @media (max-width: 480px) {
    height: 250px; 
  }

  &.fullscreen { // Styles for when chart is fullscreen
    padding: 10px; // Reduce padding in fullscreen
    height: 100vh !important; // Override inline style/other heights
    width: 100vw !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    z-index: 2000 !important; // Ensure it's above everything
    background-color: #fff !important; // Ensure background
  }
`;

const ChartControls = styled.div`
  position: absolute;
  top: 10px; // Adjusted for less padding in fullscreen
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 5px;
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


interface LoanChartProps {
  schedule: AmortizationEntry[];
  loan: Loan; 
}

const LoanChart: React.FC<LoanChartProps> = ({ schedule, loan }) => {
  const chartRef = React.useRef<ChartJS<'line'>>(null); 
  const chartWrapperRef = React.useRef<HTMLDivElement>(null); // Ref for the container to go fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;

    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  const resetZoom = () => {
    chartRef.current?.resetZoom();
  };

  if (!schedule || schedule.length === 0) {
    return null; 
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); 
  let currentMonthIndex = -1;
  const eventAnnotations: any = {}; 

  const findScheduleIndex = (eventDateStr: string): number => {
    const eventDate = new Date(eventDateStr);
    return schedule.findIndex(entry => new Date(entry.paymentDate) >= eventDate);
  };

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

  loan.details.disbursements.forEach((d, idx) => {
      if (idx === 0 && d.date === loan.details.startDate) return; 
      const index = findScheduleIndex(d.date);
      if (index !== -1) {
          eventAnnotations[`disburse_${idx}`] = {
              type: 'line' as const, scaleID: 'x', value: index,
              borderColor: 'cyan', borderWidth: 1, borderDash: [2, 2],
              label: { display: true, content: `Disburse: ${d.amount.toLocaleString()}`, position: 'end', 
                       backgroundColor: 'rgba(0,255,255,0.7)', color: 'black', font: { size: 9 } }
          };
      }
  });

  const labels = schedule.map(entry => `Month ${entry.monthNumber}`);
  const balanceData = schedule.map(entry => entry.closingBalance);
  const principalData = schedule.map(entry => entry.principalPaid);
  const interestData = schedule.map(entry => entry.interestPaid);
  const emiData = schedule.map(entry => entry.emi); 

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      { label: 'Outstanding Balance (₹)', data: balanceData, borderColor: 'rgb(53, 162, 235)', backgroundColor: 'rgba(53, 162, 235, 0.5)', yAxisID: 'yBalance', tension: 0.1, pointRadius: 1, },
      { label: 'Principal Paid (₹)', data: principalData, borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)', yAxisID: 'yPayments', tension: 0.1, pointRadius: 1, borderDash: [5, 5], },
      { label: 'Interest Paid (₹)', data: interestData, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', yAxisID: 'yPayments', tension: 0.1, pointRadius: 1, borderDash: [5, 5], },
      { label: 'EMI Paid (₹)', data: emiData, borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)', yAxisID: 'yPayments', tension: 0.1, pointRadius: 1, borderDash: [2, 2], },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, 
    interaction: { mode: 'index', intersect: false, },
    plugins: { 
      legend: { position: 'bottom' as const, },
      title: { display: true, text: 'Loan Details Over Time (Zoom/Pan Enabled)', },
      tooltip: { callbacks: { label: function(context: any) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) { label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed.y); } return label; } } },
      annotation: { annotations: eventAnnotations },
      zoom: { pan: { enabled: true, mode: 'x' as const, }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' as const, } }
    }, 
    scales: { 
        x: { type: 'category' as const, min: 0, max: currentMonthIndex !== -1 ? Math.min(currentMonthIndex + 12, schedule.length - 1) : schedule.length -1 },
        yBalance: { type: 'linear' as const, display: true, position: 'left' as const, title: { display: true, text: 'Outstanding Balance (₹)'}, ticks: { callback: (value) => '₹' + Number(value).toLocaleString() } },
        yPayments: { type: 'linear' as const, display: true, position: 'right' as const, title: { display: true, text: 'Monthly Payment (₹)'}, grid: { drawOnChartArea: false }, ticks: { callback: (value) => '₹' + Number(value).toLocaleString() } }
    } 
  };

  return (
    <ChartWrapper ref={chartWrapperRef} className={isFullscreen ? 'fullscreen' : ''}>
      <ChartControls>
        <ControlButton onClick={resetZoom}>Reset Zoom</ControlButton>
        <ControlButton onClick={toggleFullscreen}>
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </ControlButton>
      </ChartControls>
      <Line ref={chartRef} options={options} data={data} />
    </ChartWrapper>
  );
};

export default LoanChart;
