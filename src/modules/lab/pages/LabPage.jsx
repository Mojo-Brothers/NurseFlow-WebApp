import React, { useState, useEffect } from 'react';
import { 
  Microscope, Search, Filter, CheckCircle2, Clock, AlertTriangle, 
  FileText, User, Calendar, RefreshCw, Send, Check, ShieldCheck, ChevronRight, Activity, Beaker
} from 'lucide-react';
import CoreRegistryService from '../../../core/services/coreRegistry.service.js';
import encounterEngine from '../../../core/services/encounterEngine.service.js';
import toast from 'react-hot-toast';

export default function LabPage() {
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, IN_PROGRESS, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Initial Worklist mock backed by Encounter Engine & Core Registry
  const [labOrders, setLabOrders] = useState([
    {
      id: 'LAB-2026-0810-001',
      encounterId: 'ENC-2026-0810-001',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      department: 'Poli Penyakit Dalam',
      orderedBy: 'dr. Surya Johnson, Sp.PD-KGEH',
      orderTime: '2026-08-10T08:15:00Z',
      status: 'PENDING', // PENDING, IN_PROGRESS, COMPLETED
      specimen: 'Darah Lengkap (EDTA)',
      priority: 'STAT', // ROUTINE, STAT
      testItems: [
        { code: 'LOINC-57021-8', name: 'Darah Lengkap (CBC)', result: '12.4', unit: 'g/dL', refRange: '12.0 - 15.5', isPanic: false },
        { code: 'LOINC-2345-7', name: 'Glukosa Darah Sewaktu (GDS)', result: '245', unit: 'mg/dL', refRange: '70 - 140', isPanic: true },
        { code: 'LOINC-2160-0', name: 'Kreatinin Serum', result: '1.1', unit: 'mg/dL', refRange: '0.6 - 1.2', isPanic: false }
      ]
    },
    {
      id: 'LAB-2026-0810-002',
      encounterId: 'ENC-2026-0810-002',
      patientId: 'P-1002',
      patientName: 'Tn. Bambang Pamungkas',
      mrn: 'MRN-2026-001002',
      department: 'Ruang Rawat Azalea Kamar 204',
      orderedBy: 'dr. Surya Johnson, Sp.PD-KGEH',
      orderTime: '2026-08-10T09:00:00Z',
      status: 'IN_PROGRESS',
      specimen: 'Serum & Plasma',
      priority: 'ROUTINE',
      testItems: [
        { code: 'LOINC-6768-6', name: 'SGOT (AST)', result: '38', unit: 'U/L', refRange: '< 35', isPanic: false },
        { code: 'LOINC-1742-6', name: 'SGPT (ALT)', result: '42', unit: 'U/L', refRange: '< 45', isPanic: false }
      ]
    }
  ]);

  const filteredOrders = labOrders.filter(order => {
    const matchesTab = activeTab === 'ALL' || order.status === activeTab;
    const matchesQuery = order.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const handleUpdateResult = (orderId, testIndex, val) => {
    setLabOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const newItems = [...o.testItems];
        newItems[testIndex].result = val;
        return { ...o, testItems: newItems };
      }
      return o;
    }));
  };

  const handleFinalizeLab = (orderId) => {
    setLabOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'COMPLETED' };
      }
      return o;
    }));
    toast.success(`Hasil Lab ${orderId} berhasil ditandatangani & dikirim ke EMR!`);
    setSelectedOrder(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 lg:p-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 rounded-2xl border border-teal-500/30 text-teal-400">
              <Microscope size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Worklist Laboratorium Klinik
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  JCI AOP.5 Accredited
                </span>
              </h1>
              <p className="text-sm font-medium text-slate-400 mt-0.5">
                Manajemen Spesimen, Input Hasil Analitikal, & Pelaporan Nilai Kritis
              </p>
            </div>
          </div>
        </div>

        {/* Tab & Stats */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/40' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {tab === 'ALL' && 'Semua Order'}
              {tab === 'PENDING' && 'Menunggu Spesimen'}
              {tab === 'IN_PROGRESS' && 'Dalam Analisis'}
              {tab === 'COMPLETED' && 'Selesai & Validasi'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Worklist Table */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Cari berdasarkan Nama Pasien, No. RM, atau ID Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedOrder?.id === order.id 
                    ? 'bg-slate-900 border-teal-500 ring-2 ring-teal-500/20' 
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
                      {order.id}
                    </span>
                    {order.priority === 'STAT' && (
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1">
                        <AlertTriangle size={12} /> CITO (STAT)
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    order.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{order.patientName}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      No. RM: {order.mrn} • {order.department}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <User size={12} className="text-teal-400" /> DPJP: {order.orderedBy}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-slate-600 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Workspace Details */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sticky top-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Beaker size={20} className="text-teal-400" />
                    Lembar Hasil Laboratorium
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">{selectedOrder.id}</p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
                  {selectedOrder.specimen}
                </span>
              </div>

              {/* Patient Banner */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 mb-6">
                <div className="font-bold text-white text-sm">{selectedOrder.patientName}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedOrder.mrn} | Encounter: {selectedOrder.encounterId}
                </div>
              </div>

              {/* Test Items Table */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameter Pemeriksaan</h4>
                {selectedOrder.testItems.map((item, idx) => (
                  <div key={item.code} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">LOINC: {item.code} | Nilai Rujukan: {item.refRange}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={item.result}
                        disabled={selectedOrder.status === 'COMPLETED'}
                        onChange={(e) => handleUpdateResult(selectedOrder.id, idx, e.target.value)}
                        className={`w-20 px-3 py-1.5 text-center font-bold text-sm rounded-lg border focus:outline-none ${
                          item.isPanic 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' 
                            : 'bg-slate-900 text-white border-slate-700 focus:border-teal-500'
                        }`}
                      />
                      <span className="text-xs font-mono text-slate-400 w-8">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              {selectedOrder.status !== 'COMPLETED' ? (
                <button
                  onClick={() => handleFinalizeLab(selectedOrder.id)}
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-900/40 transition-all flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Validasi & Kirim Hasil ke EMR
                </button>
              ) : (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-center font-bold text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Hasil Telah Diverifikasi & Terkirim ke EMR
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
              <Microscope size={48} className="mb-4 text-slate-700" />
              <p className="font-bold text-sm text-slate-400">Pilih Order Laboratorium di Samping</p>
              <p className="text-xs text-slate-600 mt-1">Pilih pasien untuk menginput nilai hasil analitikal & rujukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
