import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

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

const topDiagnoses = [
  // ISPA & Pernapasan
  { icd10: "J06.9", name: "Infeksi Saluran Pernapasan Akut (ISPA)", category: "Respiratori", severity: "RENDAH", requires_isolation: false },
  { icd10: "J45.9", name: "Asma Bronkial", category: "Respiratori", severity: "SEDANG", requires_isolation: false },
  { icd10: "A15.0", name: "Tuberkulosis (TB Paru) Terkonfirmasi", category: "Infeksi Menular", severity: "TINGGI", requires_isolation: true },
  { icd10: "J18.9", name: "Pneumonia, unspecified", category: "Respiratori", severity: "TINGGI", requires_isolation: false },
  { icd10: "J44.9", name: "Penyakit Paru Obstruktif Kronis (PPOK)", category: "Respiratori", severity: "SEDANG", requires_isolation: false },

  // Infeksi Tropis
  { icd10: "A91", name: "Demam Berdarah Dengue (DBD)", category: "Infeksi Tropis", severity: "TINGGI", requires_isolation: false },
  { icd10: "A01.0", name: "Demam Tifoid (Tipes)", category: "Infeksi Tropis", severity: "SEDANG", requires_isolation: false },
  { icd10: "B01.9", name: "Varisela (Cacar Air)", category: "Infeksi Menular", severity: "RENDAH", requires_isolation: true },
  { icd10: "A09", name: "Diare dan Gastroenteritis", category: "Gastrointestinal", severity: "SEDANG", requires_isolation: false },
  { icd10: "B50.9", name: "Malaria Plasmodium Falciparum", category: "Infeksi Tropis", severity: "TINGGI", requires_isolation: false },
  { icd10: "B54", name: "Malaria, unspecified", category: "Infeksi Tropis", severity: "SEDANG", requires_isolation: false },

  // Penyakit Kronis & Metabolik
  { icd10: "I10", name: "Hipertensi Esensial", category: "Kardiovaskular", severity: "SEDANG", requires_isolation: false },
  { icd10: "E11.9", name: "Diabetes Mellitus Tipe 2", category: "Endokrin", severity: "SEDANG", requires_isolation: false },
  { icd10: "I21.9", name: "Infark Miokard Akut (Serangan Jantung)", category: "Kardiovaskular", severity: "KRITIS", requires_isolation: false },
  { icd10: "I63.9", name: "Stroke Iskemik", category: "Neurologi", severity: "KRITIS", requires_isolation: false },
  { icd10: "E78.5", name: "Dislipidemia", category: "Endokrin", severity: "RENDAH", requires_isolation: false },

  // Pencernaan
  { icd10: "K29.7", name: "Gastritis", category: "Gastrointestinal", severity: "RENDAH", requires_isolation: false },
  { icd10: "K21.9", name: "Gastro-Esophageal Reflux Disease (GERD)", category: "Gastrointestinal", severity: "RENDAH", requires_isolation: false },
  { icd10: "K35.8", name: "Apendisitis Akut", category: "Bedah Umum", severity: "TINGGI", requires_isolation: false },
  { icd10: "K80.2", name: "Kolelitiasis (Batu Empedu)", category: "Bedah Umum", severity: "SEDANG", requires_isolation: false },

  // Kebidanan & Kandungan
  { icd10: "O80.0", name: "Persalinan Spontan Normal", category: "Maternitas", severity: "RENDAH", requires_isolation: false },
  { icd10: "O82.9", name: "Persalinan dengan Sectio Caesarea (SC)", category: "Bedah Maternitas", severity: "SEDANG", requires_isolation: false },
  { icd10: "O21.0", name: "Hiperemesis Gravidarum Ringan", category: "Maternitas", severity: "SEDANG", requires_isolation: false },
  { icd10: "O14.9", name: "Preeklamsia", category: "Maternitas", severity: "TINGGI", requires_isolation: false },

  // Pediatrik
  { icd10: "P59.9", name: "Ikterus Neonatorum (Kuning pada Bayi)", category: "Pediatrik", severity: "SEDANG", requires_isolation: false },
  { icd10: "P07.3", name: "Bayi Prematur", category: "Pediatrik", severity: "TINGGI", requires_isolation: false },

  // Saraf & Psikiatri
  { icd10: "G43.9", name: "Migraine", category: "Neurologi", severity: "RENDAH", requires_isolation: false },
  { icd10: "F32.9", name: "Episode Depresif, unspecified", category: "Psikiatri", severity: "SEDANG", requires_isolation: false },
  { icd10: "F20.9", name: "Skizofrenia", category: "Psikiatri", severity: "TINGGI", requires_isolation: false },

  // Mata, THT, & Gigi
  { icd10: "H25.9", name: "Katarak Senilis", category: "Mata", severity: "RENDAH", requires_isolation: false },
  { icd10: "H66.9", name: "Otitis Media Akut (OMA)", category: "THT", severity: "SEDANG", requires_isolation: false },
  { icd10: "K04.0", name: "Pulpitis (Nyeri Gigi Kronis)", category: "Gigi", severity: "RENDAH", requires_isolation: false },

  // Cedera & Keracunan
  { icd10: "S06.0", name: "Gegar Otak (Commotio Cerebri)", category: "Trauma / IGD", severity: "TINGGI", requires_isolation: false },
  { icd10: "S82.9", name: "Fraktur Tungkai Bawah", category: "Trauma / Bedah Ortopedi", severity: "TINGGI", requires_isolation: false },
  { icd10: "T14.1", name: "Luka Terbuka (Vulnus Laceratum)", category: "Trauma / IGD", severity: "SEDANG", requires_isolation: false },
  { icd10: "T39.1", name: "Keracunan Parasetamol", category: "Trauma / IGD", severity: "KRITIS", requires_isolation: false },

  // Penyakit Infeksi Tambahan
  { icd10: "B20", name: "Penyakit HIV / AIDS", category: "Infeksi Menular", severity: "TINGGI", requires_isolation: false },
  { icd10: "A30.9", name: "Kusta (Leprosy)", category: "Infeksi Menular", severity: "SEDANG", requires_isolation: false },
  { icd10: "A27.9", name: "Leptospirosis", category: "Infeksi Tropis", severity: "TINGGI", requires_isolation: false },
  { icd10: "A36.9", name: "Difteri", category: "Infeksi Menular", severity: "KRITIS", requires_isolation: true },
];

async function seedDiagnoses() {
  console.log("🧬 [HIS SEEDING] MENGINJEKSI MASTER DATA DIAGNOSA (ICD-10)...");
  
  try {
    for (const d of topDiagnoses) {
      const docData = {
        icd10: d.icd10,
        name: d.name,
        category: d.category,
        severity: d.severity,
        requires_isolation: d.requires_isolation,
        search_terms: [
          d.icd10.toLowerCase(),
          ...d.name.toLowerCase().split(' ')
        ],
        _created_at: serverTimestamp(),
        _v: 1
      };

      const docRef = doc(db, "master_diagnoses", d.icd10);
      await setDoc(docRef, docData);
      
      console.log(`   ✓ Injeksi ICD-10 [${d.icd10}]: ${d.name}`);
    }

    console.log(`\n✨ [COMPLETED] TOTAL ${topDiagnoses.length} DIAGNOSA UTAMA TELAH AKTIF DI DATABASE!`);
    console.log("Data ICD-10 ini kini tersedia untuk Modul EMR, Triage, dan Billing.");
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error.message);
  }
  process.exit();
}

seedDiagnoses();
