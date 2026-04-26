import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme === 'dark' || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <div 
      className={`theme-toggle-container ${isDark ? 'dark' : ''}`}
      onClick={toggleTheme}
      role="button"
      aria-label={t('common.theme.toggle')}
      title={isDark ? t('common.theme.switch_light') : t('common.theme.switch_dark')}
    >
      <div className="theme-toggle-glow" />
      <div className="theme-toggle-orb">
        <span className="material-symbols-outlined theme-toggle-icon sun-icon">
          light_mode
        </span>
        <span className="material-symbols-outlined theme-toggle-icon moon-icon">
          dark_mode
        </span>
      </div>
    </div>
  );
};

export default ThemeToggle;
