import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import StockAdjustmentTab from '../components/StockAdjustmentTab.jsx';
import { getStockAdjustments, getDepoItems } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function StockAdjustmentPage() {
  const [adjustments, setAdjustments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adj, it] = await Promise.all([getStockAdjustments(), getDepoItems()]);
      setAdjustments(adj);
      setItems(it);
    } catch (err) {
      toast.error(`Gagal memuat stock adjustment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100 font-sans">
      <InventoryHeader
        title="Stock Adjustment (Penyesuaian Opname)"
        subtitle="Form Penyesuaian Kuantitas Fisik vs Sistem (Opname, Kerusakan, Kadaluarsa, & Defisit)"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Stock Adjustment...</div>
      ) : (
        <StockAdjustmentTab adjustments={adjustments} items={items} />
      )}
    </div>
  );
}
