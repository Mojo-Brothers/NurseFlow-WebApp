import React from 'react';
import './TopAppBar.css';

const TopAppBar = () => {
  return (
    <header className="top-app-bar glass-header">
      <div className="flex items-center gap-3">
        <h1 className="brand-title text-primary">NurseFlow HIS</h1>
      </div>
      <div className="nav-links">
        <a href="#" className="nav-link active">Metrics</a>
        <a href="#" className="nav-link">Alerts</a>
        <a href="#" className="nav-link">Tasks</a>
        <a href="#" className="nav-link">Resources</a>
      </div>
    </header>
  );
};

export default TopAppBar;
