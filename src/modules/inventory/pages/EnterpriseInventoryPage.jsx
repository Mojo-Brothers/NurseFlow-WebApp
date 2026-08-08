/**
 * EnterpriseInventoryPage.jsx
 * ─────────────────────────────────────────────────────────────
 * Central Hospital Inventory Management System Main Page
 * NurseFlow HIS 2026 — Ocean Teal Visual Identity
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Boxes, FileText, Package, Truck, Building, BookOpen, 
  Scale, Download, RefreshCw, AlertTriangle, ShieldCheck, ArrowRightLeft,
  LayoutDashboard, MapPin, Layers
} from 'lucide-react';
import { 
  getDepoItems, getMaterialRequests, getReceiveMutations, 
  getInternalUses, getStockLedger, getStockAdjustments 
} from '../services/enterpriseInventory.service.js';

import CentralInventoryDashboard from '../components/CentralInventoryDashboard.jsx';
import ItemMasterWorkspace from '../components/ItemMasterWorkspace.jsx';
import WarehouseLocationWorkspace from '../components/WarehouseLocationWorkspace.jsx';

import MaterialRequestTab from '../components/MaterialRequestTab.jsx';
import ItemDepartmentTab from '../components/ItemDepartmentTab.jsx';
import MutasiBarangTab from '../components/MutasiBarangTab.jsx';
import ReceiveMutasiTab from '../components/ReceiveMutasiTab.jsx';
import InternalUseTab from '../components/InternalUseTab.jsx';
import KartuStockTab from '../components/KartuStockTab.jsx';
import StockAdjustmentTab from '../components/StockAdjustmentTab.jsx';

import toast from 'react-hot-toast';

export default function EnterpriseInventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/item-master')) return 'item_master';
    if (path.includes('/warehouse-locations')) return 'warehouse_locations';
    if (path.includes('/item-department')) return 'item_department';
    if (path.includes('/mutasi-barang')) return 'mutasi_barang';
    if (path.includes('/receive-mutasi')) return 'receive_mutasi';
    if (path.includes('/internal-use')) return 'internal_use';
    if (path.includes('/kartu-stock')) return 'kartu_stock';
    if (path.includes('/stock-adjustment')) return 'stock_adjustment';
    return localStorage.getItem('nurseflow_inventory_active_tab') || 'dashboard';
  });

  const [loading, setLoading] = useState(true);

  // Sync activeTab from URL pathname on route change
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/dashboard')) setActiveTab('dashboard');
    else if (path.includes('/item-master')) setActiveTab('item_master');
    else if (path.includes('/warehouse-locations')) setActiveTab('warehouse_locations');
    else if (path.includes('/material-request')) setActiveTab('material_request');
    else if (path.includes('/item-department')) setActiveTab('item_department');
    else if (path.includes('/mutasi-barang')) setActiveTab('mutasi_barang');
    else if (path.includes('/receive-mutasi')) setActiveTab('receive_mutasi');
    else if (path.includes('/internal-use')) setActiveTab('internal_use');
    else if (path.includes('/kartu-stock')) setActiveTab('kartu_stock');
    else if (path.includes('/stock-adjustment')) setActiveTab('stock_adjustment');
  }, [location.pathname]);

  // State Data for all sub-modules
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [uses, setUses] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const loadAllInventoryData = async () => {
    setLoading(true);
    try {
      const [it, req, mut, us, led, adj] = await Promise.all([
        getDepoItems(),
        getMaterialRequests(),
        getReceiveMutations(),
        getInternalUses(),
        getStockLedger(),
        getStockAdjustments()
      ]);

      setItems(it || []);
      setRequests(req || []);
      setMutations(mut || []);
      setUses(us || []);
      setLedger(led || []);
      setAdjustments(adj || []);
    } catch (err) {
      toast.error(`Gagal memuat data inventaris: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllInventoryData();
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('nurseflow_inventory_active_tab', tabId);

    const pathMap = {
      dashboard: '/inventory/dashboard',
      item_master: '/inventory/item-master',
      warehouse_locations: '/inventory/warehouse-locations',
      material_request: '/inventory/material-request',
      item_department: '/inventory/item-department',
      mutasi_barang: '/inventory/mutasi-barang',
      receive_mutasi: '/inventory/receive-mutasi',
      internal_use: '/inventory/internal-use',
      kartu_stock: '/inventory/kartu-stock',
      stock_adjustment: '/inventory/stock-adjustment'
    };

    if (pathMap[tabId]) {
      navigate(pathMap[tabId]);
    }
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard Operasional', icon: LayoutDashboard, count: null },
    { id: 'item_master', label: 'Item Master Enterprise', icon: Boxes, count: null },
    { id: 'warehouse_locations', label: 'Gudang & Lokasi Fisik', icon: MapPin, count: null },
    { id: 'material_request', label: 'Material Request', icon: FileText, count: requests.filter(r => r.status === 'PENDING_APPROVAL').length },
    { id: 'item_department', label: 'Stok Unit & Depo', icon: Layers, count: items.filter(i => i.stockQty <= i.minStock).length },
    { id: 'mutasi_barang', label: 'Mutasi Barang', icon: ArrowRightLeft, count: null },
    { id: 'receive_mutasi', label: 'Receive Mutasi', icon: Truck, count: mutations.filter(m => m.status === 'IN_TRANSIT').length },
    { id: 'internal_use', label: 'Internal Use', icon: Building, count: null },
    { id: 'kartu_stock', label: 'Kartu Stock (Ledger)', icon: BookOpen, count: null },
    { id: 'stock_adjustment', label: 'Stock Adjustment', icon: Scale, count: null }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007399]/10 text-[#007399] flex items-center justify-center font-black shadow-inner border border-[#007399]/20">
            <Boxes size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#007399]/10 text-[#007399] px-2.5 py-0.5 rounded-full border border-[#007399]/20">
                ENTERPRISE SUPPLY CHAIN ENGINE
              </span>
              <span className="text-[10px] font-bold text-slate-400">JCI MMU &amp; Permenkes RI</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              Central Hospital Inventory Management
            </h1>
          </div>
        </div>

        <button
          onClick={loadAllInventoryData}
          className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#007399] hover:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Engine Data</span>
        </button>
      </div>

      {/* ENTERPRISE NAVIGATION TABS BAR */}
      <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive 
                  ? 'bg-[#007399] text-white shadow-md shadow-[#007399]/20' 
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTIVE TAB CONTENT */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw size={32} className="animate-spin text-[#007399] mx-auto" />
          <p className="text-xs font-bold text-slate-400">Sinkronisasi Central Inventory Engine...</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {activeTab === 'dashboard' && (
            <CentralInventoryDashboard 
              items={items} 
              requests={requests} 
              mutations={mutations} 
              uses={uses} 
              adjustments={adjustments} 
              onNavigateTab={handleTabChange} 
            />
          )}
          {activeTab === 'item_master' && (
            <ItemMasterWorkspace items={items} onRefresh={loadAllInventoryData} />
          )}
          {activeTab === 'warehouse_locations' && (
            <WarehouseLocationWorkspace items={items} />
          )}
          {activeTab === 'material_request' && (
            <MaterialRequestTab requests={requests} items={items} onRefresh={loadAllInventoryData} />
          )}
          {activeTab === 'item_department' && (
            <ItemDepartmentTab items={items} />
          )}
          {activeTab === 'mutasi_barang' && (
            <MutasiBarangTab items={items} />
          )}
          {activeTab === 'receive_mutasi' && (
            <ReceiveMutasiTab mutations={mutations} onRefresh={loadAllInventoryData} />
          )}
          {activeTab === 'internal_use' && (
            <InternalUseTab uses={uses} items={items} />
          )}
          {activeTab === 'kartu_stock' && (
            <KartuStockTab ledger={ledger} items={items} />
          )}
          {activeTab === 'stock_adjustment' && (
            <StockAdjustmentTab adjustments={adjustments} items={items} />
          )}
        </div>
      )}

    </div>
  );
}
