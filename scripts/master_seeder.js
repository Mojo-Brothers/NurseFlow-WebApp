import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

const PATIENT_NAMES = [
  "Budi Santoso", "Siti Aminah", "Joko Widodo", "Lani Astuti", "Rudi Hermawan",
  "Dewi Sartika", "Anwar Ibrahim", "Maya Putri", "Hendra Wijaya", "Rina Rose",
  "Taufik Hidayat", "Susi Susanti", "Bambang Pamungkas", "Gita Gutawa", "Reza Rahadian",
  "Pevita Pearce", "Nicholas Saputra", "Dian Sastro", "Iwan Fals", "Agnez Mo"
];

const DEPARTMENTS = ["Poli Penyakit Dalam", "Poli Anak", "Poli Kandungan", "Poli Bedah", "IGD", "Poli Mata", "Poli THT"];
const DOCTORS = ["dr. Robby Viory, Sp.PD", "dr. Sarah Jenkins, Sp.A", "dr. Ahmad Sujatmiko, Sp.B", "dr. Linda Wahyuni, Sp.OG"];
const INSURANCES = ["BPJS Kesehatan", "Asuransi Prudential", "Mandiri Inhealth", "Umum/Pribadi", "AdMedika"];

const DIAGNOSES = [
  "Hypertension Essential", "Diabetes Mellitus Type 2", "Dyspepsia", "Acute Respiratory Infection",
  "Osteoarthritis", "Cephalgia", "Anxiety Disorder", "Bronchial Asthma", "Dengue Fever"
];

async function seed() {
  try {
    console.log("🚀 Starting Master Clinical Seeding (JCI Standard)...");

    for (let i = 0; i < 100; i++) {
      const name = `${PATIENT_NAMES[i % PATIENT_NAMES.length]} ${i + 1}`;
      const gender = Math.random() > 0.5 ? 'M' : 'F';
      const age = 20 + Math.floor(Math.random() * 50);
      const dob = `19${95 - age}-01-01`;
      const mrn = `RM-${100000 + i}`;

      // 2. Create Patient
      const patientRef = await addDoc(collection(db, 'patients'), {
        name,
        mrn,
        demographics: {
          gender,
          dob,
          phone: "08123456789",
          address: "Jl. Merdeka No. " + (i + 1)
        },
        allergies: Math.random() > 0.7 ? [{ agent: 'Paracetamol', severity: 'MODERATE' }] : [],
        safety_flags: {
          fall_risk: Math.random() > 0.8 ? 'HIGH' : 'LOW'
        },
        created_at: serverTimestamp()
      });

      const pId = patientRef.id;

      // 3. Create Encounter (Crucial for visibility in Search Modal)
      const encounterRef = await addDoc(collection(db, 'encounters'), {
        patient_id: pId,
        patient_name: name,
        status: 'IN_TREATMENT',
        encounter_type: Math.random() > 0.3 ? 'OPD' : 'IPD',
        department: DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)],
        doctor_name: DOCTORS[Math.floor(Math.random() * DOCTORS.length)],
        guarantor: INSURANCES[Math.floor(Math.random() * INSURANCES.length)],
        admitted_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const eId = encounterRef.id;

      // 4. Create Medical Records (Varied Modules)
      // A. INITIAL NURSE ASSESSMENT
      await addDoc(collection(db, 'medical_records'), {
        patientId: pId,
        encounterId: eId,
        moduleName: 'PENGKAJIAN AWAL KEPERAWATAN',
        assessment: 'PENGKAJIAN AWAL KEPERAWATAN',
        signed_by: 'Ns. Maya Lestari',
        status: 'SIGNED',
        created_at: serverTimestamp(),
        data: {
          vital_signs: { hr: 80, bp: '120/80', temp: 36.5, rr: 20 },
          intervention: 'Observasi TTV dan edukasi risiko jatuh'
        }
      });

      // B. FALL RISK (IPSG 6)
      const fallRiskScore = Math.random() > 0.8 ? 45 : 10;
      await addDoc(collection(db, 'medical_records'), {
        patientId: pId,
        encounterId: eId,
        moduleName: 'ASESSMEN RISIKO JATUH (MORSE)',
        assessment: 'ASESSMEN RISIKO JATUH (MORSE)',
        signed_by: 'Ns. Maya Lestari',
        status: 'SIGNED',
        created_at: serverTimestamp(),
        data: {
          score: fallRiskScore,
          risk_level: fallRiskScore > 25 ? 'High Risk' : 'Low Risk'
        }
      });

      // C. SOAP NOTE (CPPT)
      const dx = DIAGNOSES[Math.floor(Math.random() * DIAGNOSES.length)];
      await addDoc(collection(db, 'medical_records'), {
        patientId: pId,
        encounterId: eId,
        moduleName: 'CATATAN PERKEMBANGAN (SOAP)',
        assessment: dx, // Real diagnosis in assessment field
        doctor: DOCTORS[0],
        signed_by: DOCTORS[0],
        status: 'SIGNED',
        created_at: serverTimestamp(),
        subjective: `Pasien mengeluh ${dx.toLowerCase()} sejak 3 hari lalu.`,
        objective: 'KU: Baik, Compos Mentis. TD: 130/85 mmHg.',
        assessment_text: dx,
        plan_instructions: 'Rencana kontrol 1 minggu lagi.'
      });

      if (i % 10 === 0) console.log(`Injected ${i} patients...`);
    }

    console.log("✅ Seeding Complete! 100 Patients, 100 Encounters, and 300+ Records injected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
}

seed();
