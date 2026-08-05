import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import ItemDepartmentTab from '../components/ItemDepartmentTab.jsx';
import { getDepoItems } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function ItemDepartmentPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const it = await getDepoItems();
      setItems(it);
    } catch (err) {
      toast.error(`Gagal memuat stok barang: ${err.message}`);
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
        title="Item Departement (Stok Per Depo)"
        subtitle="Monitoring Katalog Persediaan Barang, Batas Reorder Point, & Expired Warning"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Item Departement...</div>
      ) : (
        <ItemDepartmentTab items={items} />
      )}
    </div>
  );
}
