import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Boxes, FileText, Package, Truck, Building, BookOpen, 
  Scale, Download, RefreshCw, AlertTriangle, ShieldCheck, ArrowRightLeft
} from 'lucide-react';
import { 
  getDepoItems, getMaterialRequests, getReceiveMutations, 
  getInternalUses, getStockLedger, getStockAdjustments 
} from '../services/enterpriseInventory.service.js';

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
    if (path.includes('/item-department')) return 'item_department';
    if (path.includes('/mutasi-barang')) return 'mutasi_barang';
    if (path.includes('/receive-mutasi')) return 'receive_mutasi';
    if (path.includes('/internal-use')) return 'internal_use';
    if (path.includes('/kartu-stock')) return 'kartu_stock';
    if (path.includes('/stock-adjustment')) return 'stock_adjustment';
    return localStorage.getItem('nurseflow_inventory_active_tab') || 'material_request';
  });

  const [loading, setLoading] = useState(true);

  // Sync activeTab from URL pathname on route change
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/material-request')) setActiveTab('material_request');
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

      setItems(it);
      setRequests(req);
      setMutations(mut);
      setUses(us);
      setLedger(led);
      setAdjustments(adj);
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
    { id: 'material_request', label: 'Material Request', icon: FileText, count: requests.filter(r => r.status === 'PENDING_APPROVAL').length },
    { id: 'item_department', label: 'Item Departement', icon: Boxes, count: items.filter(i => i.stockQty <= i.minStock).length },
    { id: 'mutasi_barang', label: 'Mutasi Barang', icon: ArrowRightLeft, count: null },
    { id: 'receive_mutasi', label: 'Receive Mutasi', icon: Truck, count: mutations.filter(m => m.status === 'IN_TRANSIT').length },
    { id: 'internal_use', label: 'Internal Use', icon: Building, count: null },
    { id: 'kartu_stock', label: 'Kartu Stock', icon: BookOpen, count: null },
    { id: 'stock_adjustment', label: 'Stock Adjustment', icon: Scale, count: null }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 font-sans">
      
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-inner border border-primary/20">
            <Boxes size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Manajemen Inventaris Medis & Logistik</h1>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">
              Enterprise Supply Chain System: Material Request, Item Depo, Mutasi, Pemakaian Internal, Kartu Stok, & Opname
            </p>
          </div>
        </div>

        <button
          onClick={loadAllInventoryData}
          className="px-3.5 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>



      {/* ACTIVE TAB CONTENT */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold text-on-surface-variant/70">Memuat Sistem Inventaris Medis...</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
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
