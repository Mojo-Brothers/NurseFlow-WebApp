
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

// Read firebase config from the project
const firebaseConfigContent = fs.readFileSync('c:/Users/Mojo/NurseFlow-WebApp/src/core/firebase.js', 'utf8');
const configMatch = firebaseConfigContent.match(/const firebaseConfig = ({[\s\S]+?});/);

if (!configMatch) {
  console.error('Could not find firebaseConfig in firebase.js');
  process.exit(1);
}

const firebaseConfig = eval(`(${configMatch[1]})`);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdmin(email) {
  console.log(`Setting admin role for: ${email}`);
  const q = query(collection(db, 'users'), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    console.log(`User ${email} not found in 'users' collection.`);
    return;
  }
  
  for (const userDoc of snapshot.docs) {
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'ADMIN'
    });
    console.log(`Updated user ${userDoc.id} to ADMIN.`);
  }
}

setAdmin('obbyvior@gmail.com');
setAdmin('ivoryperfumecoorp@gmail.com');
