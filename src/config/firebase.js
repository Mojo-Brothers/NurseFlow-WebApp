import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEQJqb_FyuKTpSq6Yc5g-T0wUYwUjSNNo",
  authDomain: "nurseflow-309c7.firebaseapp.com",
  projectId: "nurseflow-309c7",
  storageBucket: "nurseflow-309c7.firebasestorage.app",
  messagingSenderId: "381014626562",
  appId: "1:381014626562:web:be60f5d1d3d7d25038b21b",
  measurementId: "G-3S8W6X48ZB"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
