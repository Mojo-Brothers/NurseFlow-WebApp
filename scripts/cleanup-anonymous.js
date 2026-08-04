import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function cleanup() {
  console.log("Mencari data pasien anonim...");
  try {
    const q = query(collection(db, "patients"));
    const snapshot = await getDocs(q);
    let count = 0;
    
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.name && data.name.startsWith("Anonim Darurat")) {
        console.log(`Menghapus: ${data.name} (ID: ${d.id})`);
        await deleteDoc(doc(db, "patients", d.id));
        count++;
      }
    }
    console.log(`Selesai! Berhasil menghapus ${count} pasien anonim lama.`);
    process.exit(0);
  } catch (err) {
    console.error("Gagal:", err);
    process.exit(1);
  }
}

cleanup();
