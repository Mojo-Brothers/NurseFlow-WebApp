import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "firebase/firestore";

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

async function checkData() {
  console.log("Fetching latest 5 encounters...");
  const eQ = query(collection(db, "encounters"), orderBy("admitted_at", "desc"), limit(5));
  const eSnap = await getDocs(eQ);
  eSnap.forEach(d => {
    const data = d.data();
    console.log(`Encounter: ${d.id} | PatientID: ${data.patient_id} | Status: ${data.status} | Type: ${data.encounter_type}`);
  });

  console.log("\nFetching latest 5 patients...");
  const pQ = query(collection(db, "patients"), orderBy("registered_at", "desc"), limit(5));
  const pSnap = await getDocs(pQ);
  pSnap.forEach(d => {
    const data = d.data();
    console.log(`Patient: ${d.id} | Name: ${data.name} | MRN: ${data.mrn}`);
  });

  process.exit(0);
}

checkData();
