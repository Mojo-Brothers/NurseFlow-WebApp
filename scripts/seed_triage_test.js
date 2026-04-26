
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

const TEST_PATIENT_ID = "triage-test-patient-001";
const TEST_ENCOUNTER_ID = "triage-test-encounter-001";

async function seedTriageTest() {
  console.log("🚀 Seeding Triage Test Data...");

  try {
    // 1. Seed Patient
    const patientRef = doc(db, "patients", TEST_PATIENT_ID);
    await setDoc(patientRef, {
      id: TEST_PATIENT_ID,
      name: "Bpk. Budi Santoso (Trial)",
      mrn: "MRN-TRIAGE-001",
      gender: "MALE",
      birth_date: "1980-05-15",
      nik: "1234567890123456",
      registered_at: serverTimestamp(),
      baseline_profile: {
        value: 75,
        chronic_flag: false,
        last_updated: serverTimestamp(),
        source: 'MANUAL'
      },
      _v: 1
    });
    console.log("✅ Created Patient:", TEST_PATIENT_ID);

    // 2. Seed Encounter
    const encounterRef = doc(db, "encounters", TEST_ENCOUNTER_ID);
    await setDoc(encounterRef, {
      id: TEST_ENCOUNTER_ID,
      patient_id: TEST_PATIENT_ID,
      status: "WAITING", 
      escalation_level: "NONE",
      admitted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      department: "IGD",
      ward: "IGD",
      _v: 1
    });
    console.log("✅ Created Encounter:", TEST_ENCOUNTER_ID);

    console.log("\n✨ Triage Test Data Ready!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
  }
  process.exit();
}

seedTriageTest();
