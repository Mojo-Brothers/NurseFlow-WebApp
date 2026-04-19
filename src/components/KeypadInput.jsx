import React, { useState } from 'react';
import './KeypadInput.css';

export default function KeypadInput({ value, onChange, label, unit, criticalLow, criticalHigh }) {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyPress = (key) => {
    if (key === 'DEL') {
      onChange(value.slice(0, -1));
    } else if (key === '.') {
      if (!value.includes('.')) onChange(value + key);
    } else {
      // Bounding to max 3 digits usually
      if (value.length < 3 || value.includes('.')) {
         onChange(value + key);
      }
    }
  };

  const numValue = parseFloat(value);
  const isCritical = (numValue <= criticalLow || numValue >= criticalHigh) && value !== '';
  const isWarning = !isCritical && (numValue <= criticalLow * 1.2 || numValue >= criticalHigh * 0.8) && value !== '';

  return (
    <div className={`keypad-container ${isCritical ? 'border-error' : isWarning ? 'border-warning' : ''}`}>
      <div 
        className="keypad-display" 
        onClick={() => setIsFocused(!isFocused)}
      >
        <span className="metric-label">{label}</span>
        <div className="flex-row items-baseline gap-2 mt-2">
          <span className={`text-4xl font-extrabold ${isCritical ? 'text-error' : ''}`}>
            {value || '--'}
          </span>
          <span className="text-on-surface-variant font-bold">{unit}</span>
        </div>
      </div>

      {isFocused && (
        <div className="keypad-grid card mt-2">
          {['1','2','3','4','5','6','7','8','9','.', '0', 'DEL'].map(k => (
            <button 
              key={k} 
              type="button" 
              className={`keypad-btn ${k === 'DEL' ? 'btn-del' : ''}`}
              onClick={() => handleKeyPress(k)}
            >
              {k}
            </button>
          ))}
          <button 
            type="button" 
            className="btn-primary" 
            style={{ gridColumn: 'span 3' }}
            onClick={() => setIsFocused(false)}
          >
            CONFIRM
          </button>
        </div>
      )}
    </div>
  );
}
