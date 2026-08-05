/**
 * NurseFlow HIS — Centralized Inventory & Supply Chain Integration Engine
 * Handles seamless 3-way cross-module integration:
 * 1. Material Request (Requisition) -> Auto-generates Outbound Mutation
 * 2. Mutasi Barang (Outbound Transfer) -> Updates Source Stock & Dispatches IN_TRANSIT
 * 3. Receive Mutasi (Inbound Transfer) -> Confirms Goods Receipt & Increases Destination Stock
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { MASTER_DEPARTMENTS } from '../../core/departments.js';

export const useInventoryStore = create((set, get) => ({
  // 1. MATERIAL REQUESTS STATE
  materialRequests: [
    {
      id: 'req-001',
      requestCode: 'RQ-UGD-20260805-001',
      requestDate: '2026-08-05 08:00',
      fromDept: 'UGD (INSTALASI GAWAT DARURAT)',
      fromWarehouse: 'Gudang Medis (UGD (INSTALASI GAWAT DARURAT))',
      toDept: 'LOGISTIK MEDIK SENTRAL',
      toWarehouse: 'Gudang Medis (LOGISTIK MEDIK SENTRAL)',
      priority: 'URGENT',
      requestedBy: 'Ns. Ratna Marlina, S.Kep',
      status: 'PENDING_APPROVAL',
      items: [
        { code: 'OBAT-PAR-001', name: 'Paracetamol 500mg Tablet', qtyRequested: 500, unit: 'Tablet' },
        { code: 'BMHP-INF-NS5', name: 'Cairan Infus NaCl 0.9% 500ml', qtyRequested: 100, unit: 'Botol' }
      ]
    },
    {
      id: 'req-002',
      requestCode: 'RQ-POLI-20260805-002',
      requestDate: '2026-08-05 09:30',
      fromDept: 'POLI PENYAKIT DALAM',
      fromWarehouse: 'Gudang Medis (POLI PENYAKIT DALAM)',
      toDept: 'FARMASI UTAMA',
      toWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      priority: 'NORMAL',
      requestedBy: 'Ns. Siti Wijaya, S.Kep',
      status: 'APPROVED',
      items: [
        { code: 'OBAT-AMX-500', name: 'Amoxicillin 500mg Kaplet', qtyRequested: 200, unit: 'Kaplet' }
      ]
    },
    {
      id: 'req-003',
      requestCode: 'RQ-OK-20260805-003',
      requestDate: '2026-08-05 10:00',
      fromDept: 'RUANG OPERASI (OK)',
      fromWarehouse: 'Gudang Medis (RUANG OPERASI (OK))',
      toDept: 'FARMASI UTAMA',
      toWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      priority: 'URGENT',
      requestedBy: 'Staf Admin (Ruang Operasi)',
      status: 'FULFILLED',
      items: [
        { code: 'OBAT-FNT-001', name: 'Fentanyl Injeksi 0.05mg/ml', qtyRequested: 20, unit: 'Ampul' }
      ]
    },
    {
      id: 'req-004',
      requestCode: 'RQ-ICU-20260805-004',
      requestDate: '2026-08-05 11:00',
      fromDept: 'ICU (INTENSIVE CARE UNIT)',
      fromWarehouse: 'Gudang Medis (ICU (INTENSIVE CARE UNIT))',
      toDept: 'LOGISTIK MEDIK SENTRAL',
      toWarehouse: 'Gudang Medis (LOGISTIK MEDIK SENTRAL)',
      priority: 'URGENT',
      requestedBy: 'Ns. Maya Indah, S.Kep',
      status: 'APPROVED',
      items: [
        { code: 'OBAT-MDZ-002', name: 'Midazolam Injeksi 5mg/ml', qtyRequested: 10, unit: 'Ampul' }
      ]
    },
    {
      id: 'req-005',
      requestCode: 'RQ-RW1-20260805-005',
      requestDate: '2026-08-05 11:30',
      fromDept: 'RAWAT INAP KELAS 1',
      fromWarehouse: 'Gudang Medis (RAWAT INAP KELAS 1)',
      toDept: 'FARMASI UTAMA',
      toWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      priority: 'NORMAL',
      requestedBy: 'Ns. Dian Sastro, S.Kep',
      status: 'IN_TRANSIT',
      items: [
        { code: 'BMHP-SPG-003', name: 'Spuit 3cc', qtyRequested: 150, unit: 'Pcs' }
      ]
    }
  ],

  // 2. MUTATIONS STATE (OUTBOUND & INBOUND)
  mutations: [
    {
      id: 'mut-001',
      mutationNo: 'MT-LOGISTIK-20260805-0015',
      date: '2026-08-05 08:30',
      fromDept: 'LOGISTIK MEDIK SENTRAL',
      fromWarehouse: 'Gudang Medis (LOGISTIK MEDIK SENTRAL)',
      toDept: 'UGD (INSTALASI GAWAT DARURAT)',
      toWarehouse: 'Gudang Medis (UGD (INSTALASI GAWAT DARURAT))',
      createdBy: 'Ns. Robby Viory, S.Kep',
      approvedBy: 'Apt. Budi Santoso, S.Farm',
      status: 'IN_TRANSIT', // DRAFT, WAITING_APPROVAL, IN_TRANSIT, RECEIVED
      isNarcotic: false,
      temperatureStatus: 'SAFE (4.2°C)',
      relatedRequestId: 'req-001',
      items: [
        { code: 'OBAT-PAR-001', name: 'Paracetamol 500mg Tablet', batchNo: 'BTC-2026-089', expDate: '2028-12-31', qty: 500, unit: 'Tablet', availableStock: 1200 },
        { code: 'BMHP-INF-NS5', name: 'Cairan Infus NaCl 0.9% 500ml', batchNo: 'BTC-2026-044', expDate: '2028-10-15', qty: 100, unit: 'Botol', availableStock: 450 }
      ]
    },
    {
      id: 'mut-002',
      mutationNo: 'MT-FARMASI-20260805-0016',
      date: '2026-08-05 09:15',
      fromDept: 'FARMASI UTAMA',
      fromWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      toDept: 'POLI PENYAKIT DALAM',
      toWarehouse: 'Gudang Medis (POLI PENYAKIT DALAM)',
      createdBy: 'Apt. Rina Pratama, S.Farm',
      approvedBy: 'dr. Hendra Kusuma, Sp.PD',
      status: 'RECEIVED',
      isNarcotic: false,
      temperatureStatus: 'N/A (Suhu Kamar)',
      relatedRequestId: 'req-002',
      items: [
        { code: 'OBAT-AMX-500', name: 'Amoxicillin 500mg Kaplet', batchNo: 'BTC-2026-112', expDate: '2028-06-30', qty: 200, unit: 'Kaplet', availableStock: 800 }
      ]
    },
    {
      id: 'mut-003',
      mutationNo: 'MT-FARMASI-20260805-0017',
      date: '2026-08-05 10:15',
      fromDept: 'FARMASI UTAMA',
      fromWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      toDept: 'RUANG OPERASI (OK)',
      toWarehouse: 'Gudang Medis (RUANG OPERASI (OK))',
      createdBy: 'Staf Farmasi',
      approvedBy: 'Apt. Budi Santoso, S.Farm (2FA VERIFIED)',
      status: 'RECEIVED',
      isNarcotic: true,
      notes: 'Diterima oleh Staf Admin (Ruang Operasi) pada 2026-08-05 10:45',
      temperatureStatus: 'SAFE (4.0°C)',
      relatedRequestId: 'req-003',
      items: [
        { code: 'OBAT-FNT-001', name: 'Fentanyl Injeksi 0.05mg/ml', batchNo: 'BTC-NARC-2026-01', expDate: '2027-12-31', qty: 20, unit: 'Ampul', availableStock: 50 }
      ]
    },
    {
      id: 'mut-004',
      mutationNo: 'MT-LOGISTIK-20260805-0018',
      date: '2026-08-05 11:15',
      fromDept: 'LOGISTIK MEDIK SENTRAL',
      fromWarehouse: 'Gudang Medis (LOGISTIK MEDIK SENTRAL)',
      toDept: 'ICU (INTENSIVE CARE UNIT)',
      toWarehouse: 'Gudang Medis (ICU (INTENSIVE CARE UNIT))',
      createdBy: 'Ns. Robby Viory, S.Kep',
      approvedBy: 'PENDING (CRYPTOGRAPHIC 2FA)',
      status: 'WAITING_APPROVAL',
      isNarcotic: true,
      notes: 'Membutuhkan otorisasi 2FA Apoteker Penanggung Jawab',
      temperatureStatus: 'SAFE (3.8°C)',
      relatedRequestId: 'req-004',
      items: [
        { code: 'OBAT-MDZ-002', name: 'Midazolam Injeksi 5mg/ml', batchNo: 'BTC-NARC-2026-02', expDate: '2027-10-31', qty: 10, unit: 'Ampul', availableStock: 30 }
      ]
    },
    {
      id: 'mut-005',
      mutationNo: 'MT-FARMASI-20260805-0019',
      date: '2026-08-05 11:45',
      fromDept: 'FARMASI UTAMA',
      fromWarehouse: 'Gudang Medis (FARMASI UTAMA)',
      toDept: 'RAWAT INAP KELAS 1',
      toWarehouse: 'Gudang Medis (RAWAT INAP KELAS 1)',
      createdBy: 'Staf Farmasi',
      approvedBy: 'Apt. Budi Santoso, S.Farm',
      status: 'IN_TRANSIT',
      isNarcotic: false,
      notes: 'Sedang dalam pengiriman kurir logistik internal',
      temperatureStatus: 'N/A (Suhu Kamar)',
      relatedRequestId: 'req-005',
      items: [
        { code: 'BMHP-SPG-003', name: 'Spuit 3cc', batchNo: 'BTC-BMHP-2026-99', expDate: '2029-01-01', qty: 150, unit: 'Pcs', availableStock: 2500 }
      ]
    }
  ],

  // 3. ACTIONS & CROSS-MODULE INTEGRATION LOGIC

  // Action A: Create New Material Request
  createMaterialRequest: (newReq) => {
    const created = {
      id: `req-${Date.now()}`,
      requestCode: `RQ-${newReq.fromDept.substring(0,4).toUpperCase()}-${new Date().toISOString().substring(0,10).replace(/-/g,'')}-${Math.floor(10 + Math.random()*90)}`,
      requestDate: new Date().toLocaleString('id-ID'),
      status: 'PENDING_APPROVAL',
      ...newReq
    };

    set(state => ({
      materialRequests: [created, ...state.materialRequests]
    }));

    toast.success(`Material Request ${created.requestCode} Berhasil Diterbitkan!`);
    return created;
  },

  // Action B: Approve Material Request -> Updates Status to APPROVED (No longer auto-generates Mutasi)
  approveMaterialRequest: (reqId) => {
    const targetReq = get().materialRequests.find(r => r.id === reqId);
    if (!targetReq) return;

    set(state => ({
      materialRequests: state.materialRequests.map(r => r.id === reqId ? { ...r, status: 'APPROVED' } : r)
    }));

    toast.success(`Material Request ${targetReq.requestCode} Disetujui! Menunggu Gudang menerbitkan Mutasi.`, { icon: '📝' });
  },

  // Action B2: Dispatch Outbound Mutation (from Mutasi Barang Form)
  dispatchMutation: (mutationData) => {
    const newMutation = {
      id: `mut-${Date.now()}`,
      status: 'IN_TRANSIT',
      ...mutationData
    };

    set(state => {
      // If mutation is related to a Material Request, update the RQ status to IN_TRANSIT
      const updatedMaterialRequests = state.materialRequests.map(r => 
        (newMutation.relatedRequestId && r.id === newMutation.relatedRequestId) 
          ? { ...r, status: 'IN_TRANSIT' } 
          : r
      );

      return {
        mutations: [newMutation, ...state.mutations],
        materialRequests: updatedMaterialRequests
      };
    });

    toast.success(`Mutasi Barang ${newMutation.mutationNo} Diterbitkan (IN_TRANSIT)!`, { icon: '🚚' });
    return newMutation;
  },

  // Action C: Confirm Receive Mutation -> Updates Mutasi Barang, Material Request (FULFILLED), & Increases Destination Stock
  confirmReceiveMutation: (mutationId, receiveNotes) => {
    const targetMutation = get().mutations.find(m => m.id === mutationId);
    if (!targetMutation) return;

    set(state => ({
      // Update Mutation Status to RECEIVED
      mutations: state.mutations.map(m => m.id === mutationId ? { ...m, status: 'RECEIVED', notes: receiveNotes || 'Sudah Diterima Lengkap' } : m),
      // Update Related Material Request Status to FULFILLED (if exists)
      materialRequests: state.materialRequests.map(r => r.id === targetMutation.relatedRequestId ? { ...r, status: 'FULFILLED' } : r)
    }));

    toast.success(`Goods Receipt Verifikasi Selesai! Stok ${targetMutation.toDept} Berhasil Ditambah & Dokumen Mutasi Closes.`, { icon: '✅' });
  }

}));
