/**
 * NurseFlow — Bed Seeding Utility
 * Bootstraps the 'beds' collection with 20 professional bed records.
 * Run with: node scripts/seed-beds.js
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, query, limit } = require('firebase/firestore');

const firebaseConfig = {
  apiKey:            "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain:        "nurseflow-309c7.firebaseapp.com",
  projectId:         "nurseflow-309c7",
  storageBucket:     "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId:             "1:381014626562:web:be60f5d1d3d7d25038b21b",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedBeds = async () => {
  console.log('--- 🛡️ NURSEFLOW BED SEEDING START ---');
  
  // 1. Check if beds already exist to avoid spam
  const q = query(collection(db, 'beds'), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log('⚠️ Beds already exist in Firestore. Skipping seeding to prevent duplication.');
    process.exit(0);
  }

  const beds = [];
  for (let i = 1; i <= 20; i++) {
    const bedName = `A-${100 + i}`;
    beds.push({
      bed_name: bedName,
      ward: 'Ward A',
      is_occupied: false,
      encounter_id: null,
      patient_id: null,
      type: i > 15 ? 'HD' : 'STANDARD', // Last 5 are High Dependency
      created_at: new Date()
    });
  }

  console.log(`Seeding ${beds.length} beds to Ward A...`);

  for (const bed of beds) {
    const bedRef = doc(collection(db, 'beds'));
    await setDoc(bedRef, bed);
    console.log(`✅ Seeded Bed: ${bed.bed_name}`);
  }

  console.log('--- 🛡️ SEEDING COMPLETE. Ward A is now online. ---');
  process.exit(0);
};

seedBeds().catch(err => {
  console.error('❌ Seeding Failed:', err);
  process.exit(1);
});
