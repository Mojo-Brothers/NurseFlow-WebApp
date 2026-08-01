import React from 'react';

/**
 * Standardized Empty State Component for NurseFlow Enterprise
 * 
 * @param {string} icon - Material Symbols Outlined icon name (e.g. 'inventory_2')
 * @param {string} title - The main title text
 * @param {string} description - The secondary description text
 * @param {string} colorClass - Tailwind color class for icon (default: 'text-primary')
 */
export default function EmptyState({ 
  icon = 'inbox', 
  title = 'Tidak Ada Data', 
  description = 'Belum ada item untuk ditampilkan pada area ini.',
  colorClass = 'text-on-surface-variant'
}) {
  return (
    <div className="w-full py-16 flex-column items-center justify-center text-center px-4">
      <div className={`w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6 shadow-inner ${colorClass}`}>
        <span className="material-symbols-outlined text-4xl opacity-80">{icon}</span>
      </div>
      <h3 className="text-xl font-black text-on-surface tracking-tight mb-2">{title}</h3>
      <p className="text-sm font-medium text-on-surface-variant opacity-80 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}
