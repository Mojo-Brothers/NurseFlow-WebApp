
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp, collection } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain: "nurseflow-309c7.firebaseapp.com",
  projectId: "nurseflow-309c7",
  storageBucket: "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId: "1:381014626562:web:be60f5d1d3d7d25038b21b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
      title: 'Struktur Ruangan & Bed',
      icon: 'bed',
      description: 'Konfigurasi Instalasi (IGD, Rawat Inap, Poliklinik) dan Bed Management.',
      items: ['Area Resusitasi (P1)', 'VVIP Presidency Suite', 'ICU/NICU', 'Poli Penyakit Dalam']
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
    { id: 'lasa', items: [
      { drug1: 'AMITRIPTYLINE', drug2: 'AMLODIPINE' },
      { drug1: 'CEFOTAXIME', drug2: 'CEFTRIAXONE' },
      { drug1: 'DOPAMINE', drug2: 'DOBUTAMINE' },
      { drug1: 'GLIPIZIDE', drug2: 'GLYBURIDE' },
      { drug1: 'HYDRALAZINE', drug2: 'HYDROXYZINE' }
    ]}
  ]
};

async function runSeeding() {
  console.log("🚀 [ANTIGRAVITY] INITIATING ENTERPRISE SEEDING (JCI STANDARDS)...");
  
  try {
    for (const [colName, data] of Object.entries(collections)) {
      console.log(`📡 Seeding collection: ${colName}...`);
      for (const item of data) {
        const docRef = doc(db, colName, item.id);
        await setDoc(docRef, {
          ...item,
          _v: 1,
          _last_modified: serverTimestamp(),
          _created_by: 'ANTIGRAVITY_AUDITOR'
        });
        console.log(`   ✅ Created ${colName}/${item.id}`);
      }
    }
    
    // Create Audit Log for Seeding
    const auditRef = doc(collection(db, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'SYSTEM_INITIALIZATION',
      resource_type: 'MASTER_DATA',
      timestamp: serverTimestamp(),
      user: 'SYSTEM_AUDITOR',
      delta: { message: 'Full JCI Master Data seeded successfully.' }
    });

    console.log("\n✨ [SUCCESS] DATABASE NURSEFLOW TELAH BERHASIL DI-ISI!");
    console.log("Silakan cek Firebase Console Anda sekarang.");
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error.message);
  }
  process.exit();
}

runSeeding();
