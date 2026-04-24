import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

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

async function testConnectivity() {
  console.log("🚀 Testing Firestore Connectivity...");
  
  try {
    // 1. WRITE TEST
    console.log("📝 Writing test document...");
    const docRef = await addDoc(collection(db, "connectivity_test"), {
      message: "NurseFlow System Test",
      timestamp: new Date().toISOString(),
      version: "V5.2"
    });
    console.log("✅ Write Successful! Doc ID:", docRef.id);

    // 2. READ TEST
    console.log("📖 Reading test documents...");
    const querySnapshot = await getDocs(collection(db, "connectivity_test"));
    console.log(`✅ Read Successful! Found ${querySnapshot.size} test documents.`);
    
    // 3. CLEANUP (Optional)
    // console.log("🧹 Cleaning up...");
    // await deleteDoc(doc(db, "connectivity_test", docRef.id));
    
    console.log("\n🎊 FIRESTORE IS FULLY OPERATIONAL!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connectivity Test Failed!");
    console.error(error);
    process.exit(1);
  }
}

testConnectivity();
