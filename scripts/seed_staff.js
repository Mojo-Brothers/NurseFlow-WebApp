
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

const firstNames = ["Budi", "Siti", "Andi", "Dewi", "Joko", "Rina", "Agus", "Maya", "Bambang", "Sri", "Hendra", "Lia", "Eko", "Ani", "Rudi", "Siska", "Dedi", "Indah", "Taufik", "Yanti", "Fajar", "Rini", "Hansen", "Putri", "Bayu", "Ayu", "Surya", "Lestari", "Guntur", "Mega", "Zul", "Fitri", "Aris", "Wati", "Toto", "Sari", "Dani", "Nana", "Yuda", "Rosa"];
const lastNames = ["Santoso", "Wijaya", "Kusuma", "Hidayat", "Saputra", "Pratama", "Sutrisno", "Gunawan", "Purnama", "Siregar", "Nasution", "Lubis", "Hartono", "Mulyadi", "Basuki", "Tanah", "Raya", "Bakti", "Jaya", "Mulia", "Sakti", "Lancar", "Abadi", "Sejahtera", "Makmur"];
const specializations = ["Jantung", "Anak", "Bedah", "Penyakit Dalam", "Obgyn", "Mata", "Saraf", "Anestesi", "Radiologi", "Rehab Medik", "THT", "Kulit & Kelamin", "Jiwa", "Paru", "Urologi"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedStaff() {
  console.log("🏥 [MASSIVE HRIS SEEDING] GENERATING 840 STAFF MEMBERS...");
  
  try {
    for (let i = 1; i <= 840; i++) {
      const isDoctor = i <= 126; 
      const isNurse = i > 126 && i <= 630; 
      const isPharmacist = i > 630 && i <= 714; 
      const isAdmin = i > 714;

      let role = "ADMIN";
      let profession = "Staff Administrasi";
      if (isDoctor) { role = "DOCTOR"; profession = "Dokter Spesialis"; }
      else if (isNurse) { role = "NURSE"; profession = "Perawat Klinik"; }
      else if (isPharmacist) { role = "PHARMACIST"; profession = "Apoteker"; }

      const generateNameWithTitle = (role, specialty) => {
        const fNames = ['Budi', 'Siti', 'Joko', 'Rina', 'Andi', 'Dewi', 'Eko', 'Maya', 'Agus', 'Lani', 'Hendra', 'Sari', 'Indra', 'Putri'];
        const lNames = ['Santoso', 'Wijaya', 'Kusuma', 'Putra', 'Pratama', 'Hidayat', 'Saputra', 'Lestari', 'Utami', 'Siregar'];
        const name = `${fNames[Math.floor(Math.random() * fNames.length)]} ${lNames[Math.floor(Math.random() * lNames.length)]}`;
        
        switch(role) {
          case 'DOCTOR': 
            return `dr. ${name}, Sp.${specialty}`;
          case 'NURSE': 
            return Math.random() > 0.5 ? `Ns. ${name}, S.Kep` : `${name}, AMK`;
          case 'PHARMACIST': 
            return `Apt. ${name}, S.Farm`;
          case 'ADMIN': 
            const adminTitles = ['S.E', 'S.Kom', 'S.H', 'M.M'];
            return `${name}, ${adminTitles[Math.floor(Math.random() * adminTitles.length)]}`;
          default: return name;
        }
      };

      const specialty = getRandom(specializations);
      const name = generateNameWithTitle(role, specialty);
      const employeeId = `NF-${2026 - Math.floor(Math.random() * 15)}-${String(i).padStart(4, '0')}`;
      
      const joinYear = 2011 + Math.floor(Math.random() * 15);
      const joinDate = new Date(joinYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28));

      const staffData = {
        uid: `staff_${i}`,
        display_name: name,
        displayName: name, // Double coverage for auth compatibility
        employee_id: employeeId,
        role: role,
        profession: profession,
        department: profession.includes('Dokter') ? `DEPT-${specialty.toUpperCase()}` : (profession.includes('Perawat') ? 'KEPERAWATAN' : 'ADMINISTRASI'),
        specialization: isDoctor ? specialty : "Umum",
        email: `${name.toLowerCase().replace(/[., ]/g, '')}${i}@nurseflow.id`,
        phone: `+628${Math.floor(100000000 + Math.random() * 900000000)}`,
        status: Math.random() > 0.05 ? "ACTIVE" : (Math.random() > 0.5 ? "INACTIVE" : "ON_LEAVE"),
        join_date: joinDate.toISOString(),
        years_of_experience: 2026 - joinYear,
        str_number: (isDoctor || isNurse) ? `STR-${Math.floor(1000000 + Math.random() * 9000000)}` : null,
        sip_number: (isDoctor) ? `SIP-${Math.floor(1000000 + Math.random() * 9000000)}` : "N/A",
        _created_at: serverTimestamp(),
        _v: 2
      };

      const docRef = doc(db, "users", staffData.uid);
      await setDoc(docRef, staffData);
      
      if (i % 50 === 0) console.log(`   🚀 Mission Progress: ${i}/840 staff members uploaded...`);
    }

    console.log("\n✨ [COMPLETED] TOTAL 840 DATA STAFF TELAH AKTIF DI DATABASE!");
    console.log("Rumah Sakit Anda sekarang memiliki tenaga medis lengkap berstandar JCI.");
  } catch (error) {
    console.error("❌ MASS SEEDING FAILED:", error.message);
  }
  process.exit();
}

seedStaff();
