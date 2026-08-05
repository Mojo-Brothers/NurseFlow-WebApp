import React, { useState, useEffect } from 'react';
import InventoryHeader from '../components/InventoryHeader.jsx';
import InternalUseTab from '../components/InternalUseTab.jsx';
import { getInternalUses, getDepoItems } from '../services/enterpriseInventory.service.js';
import toast from 'react-hot-toast';

export default function InternalUsePage() {
  const [uses, setUses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [us, it] = await Promise.all([getInternalUses(), getDepoItems()]);
      setUses(us);
      setItems(it);
    } catch (err) {
      toast.error(`Gagal memuat pemakaian internal: ${err.message}`);
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
        title="Internal Use (Pemakaian Operasional)"
        subtitle="Pencatatan Pemakaian BMHP/Alkes Non-Billing Untuk Operasional Ruangan & Cost Center Audit"
        onRefresh={loadData}
        loading={loading}
      />
      {loading ? (
        <div className="py-20 text-center text-xs font-bold opacity-60">Memuat Internal Use...</div>
      ) : (
        <InternalUseTab uses={uses} items={items} />
      )}
    </div>
  );
}
