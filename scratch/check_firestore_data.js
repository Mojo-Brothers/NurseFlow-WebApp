import { db } from './src/core/firebase.js';
import { collection, getDocs, limit, query } from 'firebase/firestore';

async function checkData() {
  try {
    const pSnap = await getDocs(query(collection(db, 'patients'), limit(1)));
    const eSnap = await getDocs(query(collection(db, 'encounters'), limit(1)));
    
    console.log('Patients exist:', !pSnap.empty);
    console.log('Encounters exist:', !eSnap.empty);
  } catch (err) {
    console.error('Check failed:', err);
  }
}

checkData();
