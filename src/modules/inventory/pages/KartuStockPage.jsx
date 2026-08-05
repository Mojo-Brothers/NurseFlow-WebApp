import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import KartuStockTab from '../components/KartuStockTab.jsx';
import { getStockLedger, getDepoItems } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function KartuStockPage() {
  const [ledger, setLedger] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [led, it] = await Promise.all([getStockLedger(), getDepoItems()]);
      setLedger(led);
      setItems(it);
    } catch (err) {
      toast.error(`Gagal memuat kartu stok: ${err.message}`);
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
        title="Kartu Stock (Buku Besar Stok)"
        subtitle="Buku Besar Jejak Alur Pergerakan Fisik Stok Barang & No. Batch (Masuk, Keluar, & Saldo Akhir)"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Kartu Stock...</div>
      ) : (
        <KartuStockTab ledger={ledger} items={items} />
      )}
    </div>
  );
}
