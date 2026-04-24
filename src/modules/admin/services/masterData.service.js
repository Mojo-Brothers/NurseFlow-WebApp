import {
  collection, doc, getDocs, setDoc, updateDoc,
  arrayUnion, arrayRemove, runTransaction, query, orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../core/firebase.js';
import { createAuditLog } from '../../../core/audit/audit.service.js';
import { AUDIT_ACTIONS } from '../../../core/constants.js';

const COLLECTION_NAME = 'master_data';

export const getMasterCategories = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('id', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[MasterDataService] Failed to fetch categories:', error);
    throw error;
  }
};

export const seedMasterData = async () => {
  const collections = {
    master_data: [
      {
        id: 'professions',
        title: 'Profesi & Kredensial',
        icon: 'badge',
        description: 'Manajemen jabatan medis, spesialisasi, dan sub-spesialisasi.',
        items: ['Dokter Spesialis', 'Perawat Klinik IV', 'Apoteker Klinis', 'Radiografer', 'Fisioterapis']
      },
      {
        id: 'rooms',
        title: 'Struktur Ruangan & Bangsal',
        icon: 'bed',
        description: 'Konfigurasi Bangsal Keperawatan (Penamaan berbasis Bunga).',
        items: ['Paviliun Anggrek (VVIP/VIP)', 'Bangsal Melati (Kelas 1 & 2)', 'Bangsal Mawar (Maternitas & Anak)', 'Ruang Teratai (ICU/NICU)', 'Poliklinik Flamboyan']
      },
      {
        id: 'roles',
        title: 'Role & Kewenangan (RBAC)',
        icon: 'shield_lock',
        description: 'Pengaturan hak akses berdasarkan standar Need-to-Know JCI.',
        items: ['Super Admin', 'DPJP Primary', 'Head Nurse', 'Billing Clerk']
      },
      {
        id: 'categorization',
        title: 'Pengkategorian Klinis',
        icon: 'account_tree',
        description: 'Master data Triage, Status Pasien, dan Jenis Asuransi.',
        items: ['Level Triage (Esi 1-5)', 'Status Pulang', 'Kategori Asuransi', 'Flagging JCI']
      },
      // JCI Extended Standards
      {
        id: 'fms_building_risk',
        title: 'Manajemen Fasilitas (FMS)',
        icon: 'domain',
        description: 'Area risiko tinggi dan standar keselamatan bangunan.',
        items: ['Ruang Radiasi Tinggi', 'Lab Biohazard Level 2', 'Ruang Isolasi Tekanan Negatif', 'Area Steril Bedah']
      },
      {
        id: 'fms_device_calibration',
        title: 'Status Kalibrasi (FMS)',
        icon: 'build',
        description: 'Manajemen status kalibrasi dan kelayakan alat medis.',
        items: ['Tersertifikasi Kelayakan', 'Dalam Perawatan Berkala', 'Rusak / Karantina', 'Menunggu Kalibrasi']
      },
      {
        id: 'pci_isolation',
        title: 'Pencegahan Infeksi (PCI)',
        icon: 'coronavirus',
        description: 'Kategori isolasi pasien sesuai rute transmisi penyakit.',
        items: ['Isolasi Airborne', 'Isolasi Droplet', 'Isolasi Contact', 'Protective (Immunocompromised)']
      },
      {
        id: 'pci_sterilization',
        title: 'Metode Sterilisasi (PCI)',
        icon: 'sanitizer',
        description: 'Standar sterilisasi alat medis (CSSD).',
        items: ['Autoclave (Steam)', 'Ethylene Oxide (EtO)', 'Plasma (H2O2)', 'Desinfeksi Tingkat Tinggi (DTT)']
      },
      {
        id: 'pfr_languages',
        title: 'Bahasa & Komunikasi (PFR)',
        icon: 'translate',
        description: 'Daftar bahasa yang didukung untuk edukasi pasien.',
        items: ['Bahasa Indonesia', 'English', 'Mandarin', 'Bahasa Isyarat (Sign Language)']
      },
      {
        id: 'pfr_spiritual',
        title: 'Kebutuhan Spiritual (PFR)',
        icon: 'self_improvement',
        description: 'Layanan dukungan spiritual dan keyakinan pasien.',
        items: ['Konseling Lintas Agama', 'Panduan Ibadah', 'Pendampingan Akhir Hayat', 'Diet Khusus Agama']
      },
      {
        id: 'cop_fall_risk',
        title: 'Risiko Jatuh (COP)',
        icon: 'personal_injury',
        description: 'Standar asesmen risiko jatuh pasien (IPSG 6).',
        items: ['Morse Fall Scale - Risiko Tinggi', 'Humpty Dumpty - Risiko Rendah', 'Ontario Modified (Geriatri)', 'Edmonson (Psikiatri)']
      },
      {
        id: 'cop_allergy_severity',
        title: 'Tingkat Alergi (COP)',
        icon: 'medical_information',
        description: 'Klasifikasi keparahan reaksi alergi obat/makanan.',
        items: ['Mild (Ruam Ringan)', 'Moderate (Sesak Napas)', 'Severe (Anafilaktik)', 'Unknown / Perlu Observasi']
      }
    ],
    service_catalog: [
      { id: '1', description: 'Konsultasi Dokter Umum',  unit_price: 150000 },
      { id: '2', description: 'Konsultasi Dokter Spesialis', unit_price: 350000 },
      { id: '3', description: 'Asesmen Triage IGD',       unit_price: 75000  },
      { id: '4', description: 'Tindakan Infus (per hari)', unit_price: 200000 },
      { id: '5', description: 'Rawat Inap (per hari)',     unit_price: 500000 },
      { id: '6', description: 'Pemeriksaan Lab Darah',     unit_price: 120000 },
      { id: '7', description: 'Pemeriksaan Rontgen',       unit_price: 250000 },
      { id: '8', description: 'ECG',                       unit_price: 150000 },
    ],
    medication_safety: [
      { id: 'high_alert', list: ['INSULIN', 'HEPARIN', 'MORPHINE', 'POTASSIUM CHLORIDE', 'WARFARIN', 'EPINEPHRINE', 'DIGOXIN', 'CEFTRIAXONE'] },
      { id: 'lasa', pairs: [
        { d1: 'AMITRIPTYLINE', d2: 'AMLODIPINE' },
        { d1: 'CEFOTAXIME', d2: 'CEFTRIAXONE' },
        { d1: 'DOPAMINE', d2: 'DOBUTAMINE' },
        { d1: 'GLIPIZIDE', d2: 'GLYBURIDE' },
        { d1: 'HYDRALAZINE', d2: 'HYDROXYZINE' }
      ]}
    ]
  };

  try {
    for (const [colName, data] of Object.entries(collections)) {
      console.log(`[MasterDataService] Seeding collection: ${colName}...`);
      for (const item of data) {
        const docRef = doc(db, colName, item.id);
        await setDoc(docRef, item);
      }
    }
    console.log('[MasterDataService] Seeding completed successfully.');
    return true;
  } catch (error) {
    console.error(`[MasterDataService] Seeding failed at collection: ${error.message}`, error);
    throw new Error(`Seeding failed: ${error.message}`);
  }
};

export const getServiceCatalog = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'service_catalog'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[MasterDataService] Failed to fetch service catalog:', error);
    throw error;
  }
};

export const getMedicationSafety = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'medication_safety'));
    const data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    return data;
  } catch (error) {
    console.error('[MasterDataService] Failed to fetch medication safety:', error);
    throw error;
  }
};

export const addItemToCategory = async (categoryId, newItem, userEmail) => {
  const docRef = doc(db, COLLECTION_NAME, categoryId);
  const auditRef = doc(collection(db, 'audit_logs'));

  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(docRef);
    if (!sfDoc.exists()) throw new Error("Document does not exist!");

    const data = sfDoc.data();
    const items = data.items || [];
    
    // Integrity Check: Prevent duplicates at DB level
    if (items.includes(newItem)) throw new Error("Item already exists in this category.");

    transaction.update(docRef, {
      items: arrayUnion(newItem),
      _v: (data._v || 0) + 1,
      last_updated: serverTimestamp()
    });

    transaction.set(auditRef, {
      timestamp: serverTimestamp(),
      user: userEmail,
      action: AUDIT_ACTIONS.CREATE,
      resource_type: 'master_data',
      resource_id: categoryId,
      delta: { addedItem: newItem },
      source: 'WEB_APP_ADMIN',
      reason: 'ADMIN_MANUAL_ENTRY'
    });
  });
};

export const deleteItemFromCategory = async (categoryId, itemToRemove, userEmail) => {
  const docRef = doc(db, COLLECTION_NAME, categoryId);
  const auditRef = doc(collection(db, 'audit_logs'));

  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(docRef);
    if (!sfDoc.exists()) throw new Error("Document does not exist!");

    const data = sfDoc.data();
    
    transaction.update(docRef, {
      items: arrayRemove(itemToRemove),
      _v: (data._v || 0) + 1,
      last_updated: serverTimestamp()
    });

    transaction.set(auditRef, {
      timestamp: serverTimestamp(),
      user: userEmail,
      action: AUDIT_ACTIONS.DELETE,
      resource_type: 'master_data',
      resource_id: categoryId,
      delta: { removedItem: itemToRemove },
      source: 'WEB_APP_ADMIN',
      reason: 'ADMIN_MANUAL_DELETE'
    });
  });
};

export const updateItemInCategory = async (categoryId, oldItem, newItem, userEmail) => {
  const docRef = doc(db, COLLECTION_NAME, categoryId);
  const auditRef = doc(collection(db, 'audit_logs'));

  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(docRef);
    if (!sfDoc.exists()) throw new Error("Document does not exist!");
    
    const data = sfDoc.data();
    const items = [...(data.items || [])];
    const index = items.indexOf(oldItem);
    
    if (index === -1) throw new Error("Item was already changed or deleted by another user.");

    items[index] = newItem;
    
    transaction.update(docRef, { 
      items, 
      _v: (data._v || 0) + 1,
      last_updated: serverTimestamp()
    });

    transaction.set(auditRef, {
      timestamp: serverTimestamp(),
      user: userEmail,
      action: AUDIT_ACTIONS.UPDATE,
      resource_type: 'master_data',
      resource_id: categoryId,
      delta: { from: oldItem, to: newItem },
      source: 'WEB_APP_ADMIN',
      reason: 'ADMIN_MANUAL_EDIT'
    });
  });
};
