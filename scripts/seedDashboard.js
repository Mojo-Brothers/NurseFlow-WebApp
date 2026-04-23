import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc, writeBatch, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain: "nurseflow-309c7.firebaseapp.com",
  projectId: "nurseflow-309c7",
  storageBucket: "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId: "1:381014626562:web:be60f5d1d3d7d25038b21b",
  measurementId: "G-3S8W6X48ZB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Seeding Hospital Dashboard Data...");
  
  // 1. Seed Hospital Metrics
  console.log("Seeding hospital_metrics...");
  await setDoc(doc(db, 'hospital_metrics', 'main_facility'), {
    triageLevels: { active: 14, l1: 3, l2: 5, l3: 6 },
    ventilators: { total: 24, available: 2 },
    bedOccupancy: { rate: 88 },
    lastUpdated: serverTimestamp()
  });

  const batch = writeBatch(db);

  // 2. Seed Active Triage Board
  console.log("Seeding active_triage...");
  const triageRef1 = doc(collection(db, 'active_triage'));
  batch.set(triageRef1, {
    mrn: '8849201',
    name: 'PT-9942',
    dob: '12/05/1982',
    level: 1,
    statusLabel: 'Resuscitation',
    overdueMs: 45000,
    timeline: ['Triage', 'ECG', 'Code Blue'],
    news2_score: 9,
    riskPercent: 84,
    vitals: { bp: '70/40', spo2: 88, hr: 130 },
    cdsAction: 'Immediate Intubation',
    aclsRequired: true,
    viewedBy: 'Dr. A. Chen'
  });

  const triageRef2 = doc(collection(db, 'active_triage'));
  batch.set(triageRef2, {
    mrn: '4192083',
    name: 'PT-1033',
    dob: '08/22/1975',
    level: 2,
    statusLabel: 'Emergent',
    overdueMs: 0,
    timeline: ['Triage', 'Imaging', 'Pending Labs'],
    news2_score: 6,
    riskPercent: 45,
    vitals: { bp: '160/95', spo2: 94, hr: 105 },
    cdsAction: 'Stroke Protocol Review',
    aclsRequired: false,
    viewedBy: 'RN J. Smith'
  });

  // 3. Seed Audit Logs
  console.log("Seeding audit_logs...");
  const logRef1 = doc(collection(db, 'audit_logs'));
  batch.set(logRef1, {
    severity: 'CRITICAL',
    timestamp: serverTimestamp(),
    user: 'Dr. A. Chen [ID:882]',
    action: 'Authorized emergency blood release for PT-9942.'
  });

  const logRef2 = doc(collection(db, 'audit_logs'));
  batch.set(logRef2, {
    severity: 'URGENT',
    timestamp: serverTimestamp(),
    user: 'RN J. Smith [ID:104]',
    action: 'Acknowledged critical lab results for PT-1033.'
  });

  await batch.commit();
  console.log("Seeding complete! You can now view the live dashboard.");
  process.exit(0);
}

seed().catch(console.error);
