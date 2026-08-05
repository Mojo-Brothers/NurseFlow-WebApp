import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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

export const MASTER_DEPARTMENTS = [
  { id: "ADMS", name: "ADMISSION", category: "ADMINISTRASI" },
  { id: "CSSD", name: "CSSD", category: "PENUNJANG" },
  { id: "MNGKEP", name: "KEPERAWATAN", category: "MANAJEMEN" },
  { id: "KOMITE-MEDIK", name: "KOMITE MEDIK", category: "MANAJEMEN" },
  { id: "PPI", name: "KOMITE PPI", category: "MANAJEMEN" },
  { id: "MANAJEMEN", name: "MANAJEMEN", category: "MANAJEMEN" },
  { id: "REKAM-MEDIS", name: "REKAM MEDIK", category: "ADMINISTRASI" },
  { id: "UMUM", name: "UMUM", category: "ADMINISTRASI" },
  { id: "MED-AMARYLIS", name: "AMARYLIS", category: "RAWAT_INAP" },
  { id: "MED-AZALEA", name: "AZALEA", category: "RAWAT_INAP" },
  { id: "MED-BAYI-SEHAT", name: "BAYI SEHAT", category: "RAWAT_INAP" },
  { id: "MED-BOUGENVILLE", name: "BOUGENVILLE", category: "RAWAT_INAP" },
  { id: "MED-BRASSIA", name: "BRASSIA", category: "RAWAT_INAP" },
  { id: "DEP-ID-B026", name: "CAMELIA", category: "RAWAT_INAP" },
  { id: "MED-CATTLEYA", name: "CATTLEYA", category: "RAWAT_INAP" },
  { id: "MED-CHRYSANT", name: "CHRYSANT", category: "RAWAT_INAP" },
  { id: "DEP-ID-B021", name: "CVCU", category: "INTENSIF" },
  { id: "DEP-ID-B027", name: "DAHLIA", category: "RAWAT_INAP" },
  { id: "MED-DENDROBIUM", name: "DENDROBIUM", category: "RAWAT_INAP" },
  { id: "DEP-ID-B028", name: "EDELWEIS", category: "RAWAT_INAP" },
  { id: "DEP-ID-B006", name: "HCU", category: "INTENSIF" },
  { id: "MED-ICU", name: "ICU", category: "INTENSIF" },
  { id: "MED-PERINA-NICU", name: "NICU", category: "INTENSIF" },
  { id: "MED-RR-01", name: "ODC", category: "BEDAH" },
  { id: "MED-VK", name: "VK", category: "KEBIDANAN" },
  { id: "MED-PNJ-ENDOS", name: "ENDOSKOPI", category: "PENUNJANG" },
  { id: "FOOT-CLINIC", name: "FOOT CLINIC", category: "POLIKLINIK" },
  { id: "MED-HAEMODIALISA", name: "HEMODIALISA", category: "PENUNJANG" },
  { id: "MED-PNJ-HOMECARE", name: "HOME CARE", category: "PELAYANAN" },
  { id: "MED-POLI-FEVER", name: "KLINIK FEVER", category: "POLIKLINIK" },
  { id: "KLINIK_WANITA", name: "KLINIK WANITA", category: "POLIKLINIK" },
  { id: "KLINIK-LAKTASI", name: "KLINIK-LAKTASI", category: "POLIKLINIK" },
  { id: "MCU", name: "MCU", category: "POLIKLINIK" },
  { id: "MED-POLI-ASMAALERGI", name: "POLI ASMA ALERGI", category: "POLIKLINIK" },
  { id: "MED-BDH-MLT", name: "POLI BEDAH MULUT", category: "POLIKLINIK" },
  { id: "Executive", name: "POLI EKSEKUTIF", category: "POLIKLINIK" },
  { id: "MED-POLI-GERIATRI", name: "POLI GERIATRI", category: "POLIKLINIK" },
  { id: "MED-GIGI-ANAK", name: "POLI GIGI ANAK", category: "POLIKLINIK" },
  { id: "MED-POLI-GIGI", name: "POLI GIGI DAN MULUT", category: "POLIKLINIK" },
  { id: "MED-GIGI-KONSERV", name: "POLI GIGI KONSERVASI", category: "POLIKLINIK" },
  { id: "MED-ORTODONTI", name: "POLI GIGI ORTODONTI", category: "POLIKLINIK" },
  { id: "MED-PERIODONTI", name: "POLI GIGI PERIODONTI", category: "POLIKLINIK" },
  { id: "MED-PROSTODONTI", name: "POLI GIGI PROSTODONTI", category: "POLIKLINIK" },
  { id: "MED-POLI-GIZI", name: "POLI GIZI KLINIK", category: "POLIKLINIK" },
  { id: "MED-HEMONK-ANAK", name: "POLI HEMATO-ONKOLOGI ANAK", category: "POLIKLINIK" },
  { id: "MED-POLI-JANTUNG", name: "POLI JANTUNG DAN PEMBULUH DARAH", category: "POLIKLINIK" },
  { id: "MED-POLI-KEBIDANAN", name: "POLI KEBIDANAN DAN KANDUNGAN", category: "POLIKLINIK" },
  { id: "MED-POLI-PSIKOLOGI", name: "POLI KESEHATAN JIWA", category: "POLIKLINIK" },
  { id: "MED-KULIT-KELAMIN", name: "POLI KULIT DAN KELAMIN", category: "POLIKLINIK" },
  { id: "MED-POLI-MATA", name: "POLI MATA", category: "POLIKLINIK" },
  { id: "MED-VITREORETINA", name: "POLI MATA - VITREORETINA", category: "POLIKLINIK" },
  { id: "MED-POLI-NEURO", name: "POLI NEURO", category: "POLIKLINIK" },
  { id: "MED-NUTRMETABOL-ANAK", name: "POLI NUTRISI METABOLIK ANAK", category: "POLIKLINIK" },
  { id: "MED-SPORTINJURY", name: "POLI ORTHOPEDI - SPORT INJURY", category: "POLIKLINIK" },
  { id: "MED-POLI-PARU", name: "POLI PARU", category: "POLIKLINIK" },
  { id: "MED-POLI-INTERNIS", name: "POLI PENYAKIT DALAM", category: "POLIKLINIK" },
  { id: "MED-POLI-PSIKIATRI", name: "POLI PSIKIATRI", category: "POLIKLINIK" },
  { id: "MED-POLI-PSIKOLOG", name: "POLI PSIKOLOGI", category: "POLIKLINIK" },
  { id: "MED-RHEUMATOLOGI", name: "POLI RHEUMATOLOGI", category: "POLIKLINIK" },
  { id: "MED-POLI-THT", name: "POLI THT", category: "POLIKLINIK" },
  { id: "MED-LARING-FARING", name: "POLI THT - LARING FARING", category: "POLIKLINIK" },
  { id: "MED-POLI-TREADMILL", name: "POLI TREADMILL", category: "POLIKLINIK" },
  { id: "MED-POLI-UMUM", name: "POLI UMUM", category: "POLIKLINIK" },
  { id: "MED-AKUPUNTUR", name: "PS AKUPUNKTUR", category: "SPESIALIS" },
  { id: "MED-POLI-ANAK", name: "PS ANAK", category: "SPESIALIS" },
  { id: "MED-POLI-ANASTESI", name: "PS ANESTESI", category: "SPESIALIS" },
  { id: "MED-POLI-BDHANAK", name: "PS BEDAH ANAK", category: "SPESIALIS" },
  { id: "MED-POLI-DIGESTIF", name: "PS BEDAH DIGESTIF", category: "SPESIALIS" },
  { id: "MED-POLI-BDHORT", name: "PS BEDAH ORTHOPEDI", category: "SPESIALIS" },
  { id: "MED-POLI-BDHPLAS", name: "PS BEDAH PLASTIK", category: "SPESIALIS" },
  { id: "MED-POLI-BDHSRF", name: "PS BEDAH SARAF", category: "SPESIALIS" },
  { id: "MED-POLI-BEDAH", name: "PS BEDAH UMUM", category: "SPESIALIS" },
  { id: "MED-POLI-BDHURO", name: "PS BEDAH UROLOGI", category: "SPESIALIS" },
  { id: "MED-POLI-BDHVAS", name: "PS BEDAH VASKULER", category: "SPESIALIS" },
  { id: "MED-ALERGI-IMUNANAK", name: "PSS ALERGI IMUNOLOGI ANAK", category: "SUB_SPESIALIS" },
  { id: "MED-POLI-ENDOKRIN", name: "PSS ENDOKRIN DAN PENYAKIT METABOLIK", category: "SUB_SPESIALIS" },
  { id: "MED-FETOMATERNAL", name: "PSS FETOMATERNAL", category: "SUB_SPESIALIS" },
  { id: "MED-POLI-GASTRO", name: "PSS GASTROENTERO-HEPATOLOGI", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H025", name: "PSS GASTROHEPATOLOGI ANAK", category: "SUB_SPESIALIS" },
  { id: "MED-POLI-GINJALHIPERTENSI", name: "PSS GINJAL HIPERTENSI", category: "SUB_SPESIALIS" },
  { id: "MED-POLI-HEMATOLOGI", name: "PSS HEMATOLOGI ONKOLOGI MEDIK", category: "SUB_SPESIALIS" },
  { id: "MED-JANTUNG-ANAK", name: "PSS JANTUNG ANAK", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H007", name: "PSS ONKOLOGI KEBIDANAN DAN KANDUNGAN", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H024", name: "PSS ORTHOPEDI FOOT AND ANGKLE", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H023", name: "PSS PARU - ONKOLOGI TORAKS", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H020", name: "PSS RHEUMATOLOGI", category: "SUB_SPESIALIS" },
  { id: "DEP-ID-H021", name: "PSS THT - LARING FARING", category: "SUB_SPESIALIS" },
  { id: "MED-PNJ-RAD", name: "RADIOLOGI", category: "PENUNJANG" },
  { id: "MED-PNJ-FIS", name: "REHABILITASI MEDIK", category: "PENUNJANG" },
  { id: "MED-THALASSEMIA", name: "THALASSEMIA", category: "PELAYANAN" },
  { id: "TBK01", name: "TUMBUH KEMBANG", category: "PELAYANAN" },
  { id: "MED-UGD", name: "UGD", category: "GAWAT_DARURAT" },
  { id: "MED-PNJ-DIAG-USG", name: "USG", category: "PENUNJANG" },
  { id: "MED-ANGIOGRAPHY", name: "CATH LAB", category: "PENUNJANG" },
  { id: "MED-PNJ-DIAGNOSTIK", name: "DIAGNOSTIK", category: "PENUNJANG" },
  { id: "ESWL", name: "ESWL", category: "PENUNJANG" },
  { id: "INST-FARM", name: "FARMASI UTAMA", category: "LOGISTIK" },
  { id: "INST-GIZI", name: "GIZI", category: "PENUNJANG" },
  { id: "KEMOTHERAPY", name: "KEMOTERAPI", category: "PELAYANAN" },
  { id: "MED-PNJ-LAB", name: "LABORATORIUM", category: "PENUNJANG" },
  { id: "FARLOG", name: "LOGISTIK MEDIK", category: "LOGISTIK" },
  { id: "MED-OK", name: "OK", category: "BEDAH" },
  { id: "MED-POLI-BTKV", name: "PS BEDAH THORAKS DAN KARDIOVASKULER", category: "SPESIALIS" },
  { id: "DEP-ID-C015", name: "RADIOTERAPI", category: "PENUNJANG" }
];

async function seedDepartments() {
  try {
    console.log(`🚀 Seeding ${MASTER_DEPARTMENTS.length} Hospital Departments to Firestore...`);

    const batch = writeBatch(db);
    MASTER_DEPARTMENTS.forEach(dept => {
      const docRef = doc(db, 'master_departments', dept.id);
      batch.set(docRef, {
        id: dept.id,
        name: dept.name,
        category: dept.category,
        updated_at: new Date().toISOString()
      });
    });

    await batch.commit();
    console.log(`✅ Successfully seeded ${MASTER_DEPARTMENTS.length} departments to Firestore collection 'master_departments'!`);

    // WRITE src/core/departments.js FILE
    const targetFile = path.resolve('src/core/departments.js');
    const content = `/**
 * NurseFlow HIS — Master Hospital Departments Registry (104 Official Units)
 */

export const MASTER_DEPARTMENTS = ${JSON.stringify(MASTER_DEPARTMENTS, null, 2)};
`;

    fs.writeFileSync(targetFile, content, 'utf-8');
    console.log(`✅ Successfully written src/core/departments.js with 104 hospital departments!`);

  } catch (err) {
    console.error('❌ Error seeding departments:', err);
  }
}

seedDepartments();
