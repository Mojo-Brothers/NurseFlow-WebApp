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
      if (value.length < 5 || value.includes('.')) { // Allow up to 5 chars (e.g. 120.5)
         onChange(value + key);
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
    if (e.key === '.') handleKeyPress('.');
    if (e.key === 'Backspace') handleKeyPress('DEL');
    if (e.key === 'Enter') setIsFocused(false);
  };

  const numValue = parseFloat(value);
  const isCritical = (numValue <= criticalLow || numValue >= criticalHigh) && value !== '';
  const isWarning = !isCritical && (numValue <= criticalLow * 1.2 || numValue >= criticalHigh * 0.8) && value !== '';

  return (
    <div 
      className={`keypad-container ${isCritical ? 'border-error' : isWarning ? 'border-warning' : ''}`}
      tabIndex="0"
      onKeyDown={onKeyDown}
      onFocus={() => setIsFocused(true)}
      style={{ outline: 'none' }}
    >
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
              onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
              onClick={() => handleKeyPress(k)}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
