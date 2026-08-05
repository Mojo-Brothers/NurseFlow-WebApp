import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import ReceiveMutasiTab from '../components/ReceiveMutasiTab.jsx';
import { getReceiveMutations } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function ReceiveMutasiPage() {
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const mut = await getReceiveMutations();
      setMutations(mut);
    } catch (err) {
      toast.error(`Gagal memuat receive mutasi: ${err.message}`);
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
        title="Receive Mutasi (Penerimaan Transfer)"
        subtitle="Verifikasi Kuantitas Fisik Barang Transfer Inter-Depo & Goods Receipt Confirmation"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Receive Mutasi...</div>
      ) : (
        <ReceiveMutasiTab mutations={mutations} onRefresh={loadData} />
      )}
    </div>
  );
}
