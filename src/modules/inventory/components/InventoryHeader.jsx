import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Boxes, FileText, Truck, Building, BookOpen, Scale, RefreshCw 
} from 'lucide-react';

export const INVENTORY_SUBNAV = [
  { id: 'material-request', label: 'Material Request', path: '/inventory/material-request', icon: FileText },
  { id: 'item-department', label: 'Item Departement', path: '/inventory/item-department', icon: Boxes },
  { id: 'receive-mutasi', label: 'Receive Mutasi', path: '/inventory/receive-mutasi', icon: Truck },
  { id: 'internal-use', label: 'Internal Use', path: '/inventory/internal-use', icon: Building },
  { id: 'kartu-stock', label: 'Kartu Stock', path: '/inventory/kartu-stock', icon: BookOpen },
  { id: 'stock-adjustment', label: 'Stock Adjustment', path: '/inventory/stock-adjustment', icon: Scale }
];

export default function InventoryHeader({ title, subtitle, onRefresh, loading }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner border border-primary/20">
          <Boxes size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">{title}</h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      )}
    </div>
  );
}
