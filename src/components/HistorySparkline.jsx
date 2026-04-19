import React from 'react';
import './HistorySparkline.css';

/**
 * HistorySparkline — V5 Clinical Continuity Edition
 * A lightweight SVG sparkline for visualizing vitals trends.
 */
const HistorySparkline = ({ data, color = 'var(--primary)', height = 30, width = 100 }) => {
  if (!data || data.length < 2) return <div className="sparkline-empty">--</div>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="sparkline-container" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Latest point indicator */}
        <circle 
          cx={width} 
          cy={height - ((data[data.length - 1] - min) / range) * (height - padding * 2) - padding} 
          r="3" 
          fill={color} 
        />
      </svg>
    </div>
  );
};

export default HistorySparkline;
