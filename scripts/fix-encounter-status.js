import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";

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

async function fixStatus() {
  console.log("Mencari data encounter yang nyangkut di status 'in-progress'...");
  let count = 0;
  try {
    const q1 = query(collection(db, "encounters"), where("status", "==", "in-progress"));
    const s1 = await getDocs(q1);
    for (const d of s1.docs) {
      await updateDoc(doc(db, "encounters", d.id), { status: "IN_TREATMENT" });
      count++;
    }

    const q2 = query(collection(db, "encounters"), where("status", "==", "IN_PROGRESS"));
    const s2 = await getDocs(q2);
    for (const d of s2.docs) {
      await updateDoc(doc(db, "encounters", d.id), { status: "IN_TREATMENT" });
      count++;
    }
    console.log(`Berhasil memperbaiki ${count} encounter yang nyangkut!`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

fixStatus();
