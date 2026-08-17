import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [
    {
      id: 'NOTIF-001',
      type: 'CRITICAL_PANIC_VALUE',
      category: 'LABORATORY',
      severity: 'CRITICAL',
      title: '🚨 NILAI KRITIS LABORATORIUM (PANIC VALUE)',
      message: 'Tn. Hendra (Mr. X) - Laktat Darah: 5.2 mmol/L (Severe Shock / Tissue Hypoperfusion).',
      patientId: 'P-1003',
      patientName: 'Tn. Hendra (Mr. X)',
      mrn: 'MRX-2026-A1',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      read: false
    },
    {
      id: 'NOTIF-002',
      type: 'NEW_PRESCRIPTION_ORDER',
      category: 'PHARMACY',
      severity: 'WARNING',
      title: '💊 RESEP OBAT BARU MASUK DARI DPJP',
      message: 'dr. Surya Johnson, Sp.PD menerbitkan resep Cito Ceftriaxone 1g IV & Infus RL untuk Ny. Siti Nurhaliza.',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      read: false
    },
    {
      id: 'NOTIF-003',
      type: 'BLOOD_CROSSMATCH_READY',
      category: 'BLOOD_BANK',
      severity: 'SUCCESS',
      title: '🩸 DARAH TRANSFUSI SIAP DIAMBIL (BDRS)',
      message: '1 Kantong PRC Golongan B+ (No. Kantong BD-2026-0817-01) Lolos Uji Crossmatch Kompatibel.',
      patientId: 'P-1001',
      patientName: 'Ny. Siti Nurhaliza',
      mrn: 'MRN-2026-001001',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false
    },
    {
      id: 'NOTIF-004',
      type: 'ICU_BED_READY',
      category: 'CRITICAL_CARE',
      severity: 'INFO',
      title: '🛏️ BED ICU SIAP UNTUK TRANSFER PASIEN',
      message: 'Bed ICU-01 (Ruang Rawat Intensif) telah disterilisasi & siap menerima pasien paska operasi.',
      patientId: 'P-1003',
      patientName: 'Tn. Hendra (Mr. X)',
      mrn: 'MRX-2026-A1',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      read: true
    }
  ],
  isNotificationPanelOpen: false,

  togglePanel: () => set(state => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  closePanel: () => set({ isNotificationPanelOpen: false }),

  markAsRead: (id) => set(state => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set(state => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  addNotification: (notif) => set(state => ({
    notifications: [
      {
        id: `NOTIF-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
        ...notif
      },
      ...state.notifications
    ]
  }))
}));
