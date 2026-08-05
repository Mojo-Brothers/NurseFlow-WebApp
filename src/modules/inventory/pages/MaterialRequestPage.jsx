import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import MaterialRequestTab from '../components/MaterialRequestTab.jsx';
import { getMaterialRequests, getDepoItems } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function MaterialRequestPage() {
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [req, it] = await Promise.all([getMaterialRequests(), getDepoItems()]);
      setRequests(req);
      setItems(it);
    } catch (err) {
      toast.error(`Gagal memuat material requests: ${err.message}`);
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
        title="Material Request (Permintaan Barang)"
        subtitle="Requisisi Barang & BMHP Inter-Depo dengan Workflow Persetujuan Multi-Level"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Material Request...</div>
      ) : (
        <MaterialRequestTab requests={requests} items={items} onRefresh={loadData} />
      )}
    </div>
  );
}
