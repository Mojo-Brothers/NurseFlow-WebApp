import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain: "nurseflow-2026.firebaseapp.com",
  projectId: "nurseflow-2026",
  storageBucket: "nurseflow-2026.appspot.com",
  messagingSenderId: "951915664194",
  appId: "1:951915664194:web:6e3d2c8033df013143c683"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMrXData() {
  const patientsRef = collection(db, "patients");
  
  // Update Mr. X that were created recently (starts with Mr. X)
  const q = query(patientsRef, where("name", ">=", "Mr. X"), where("name", "<=", "Mr. X\uf8ff"));
  const snapshot = await getDocs(q);
  
  console.log(`Found ${snapshot.size} Mr. X patients`);
  
  let fixedCount = 0;
  for (const docSnapshot of snapshot.docs) {
    const data = docSnapshot.data();
    console.log(`Fixing ${data.name}`);
    
    // We want to move gender and dob into demographics if they are at the root
    let needsUpdate = false;
    let updates = {};
    
    if (data.status === 'ACTIVE') {
      updates.status = 'EMERGENCY';
      needsUpdate = true;
    }
    
    if (data.gender === 'UNKNOWN' || data.dob === '1970-01-01') {
      const demographics = data.demographics || {};
      demographics.gender = 'U';
      demographics.dob = '1970-01-01';
      updates.demographics = demographics;
      // also nullify the root ones
      updates.gender = null;
      updates.dob = null;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await updateDoc(doc(db, "patients", docSnapshot.id), updates);
      fixedCount++;
      console.log(`Fixed ${data.name}`);
    }
  }
  
  console.log(`Successfully fixed ${fixedCount} Mr. X patients.`);
  process.exit(0);
}

fixMrXData().catch(console.error);
