
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

async function runTest() {
  console.log("--- STARTING DATABASE WRITE TEST ---");
  const testRef = doc(db, "patients", "AUDITOR_TEST_001");
  
  try {
    await setDoc(testRef, {
      name: "AUDITOR TEST RECORD",
      status: "VERIFIED",
      timestamp: serverTimestamp(),
      note: "This document was written by Antigravity Senior Architect to verify database write capabilities.",
      jci_compliance: true
    });
    console.log("✅ SUCCESS: Test document written to 'patients/AUDITOR_TEST_001'");
  } catch (error) {
    console.error("❌ FAILURE:", error.message);
    if (error.message.includes("permission")) {
      console.log("💡 ADVICE: Please check your Firestore Rules. You might need to allow writes to the 'patients' collection for testing.");
    }
  }
  process.exit();
}

runTest();
