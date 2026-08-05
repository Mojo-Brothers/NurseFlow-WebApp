import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { MASTER_DEPARTMENTS } from '../src/core/departments.js';

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

const FIRST_NAMES = [
  "Robby", "Ratna", "Budi", "Siti", "Andi", "Dewi", "Joko", "Rina", "Agus", "Maya",
  "Bambang", "Sri", "Hendra", "Lia", "Eko", "Ani", "Rudi", "Siska", "Dedi", "Indah",
  "Taufik", "Yanti", "Fajar", "Rini", "Hansen", "Putri", "Bayu", "Ayu", "Surya", "Lestari",
  "Michael", "Sarah", "David", "Jessica", "James", "Emily", "Robert", "Amanda", "Daniel", "Olivia"
];

const LAST_NAMES = [
  "Viory", "Marlina", "Santoso", "Wijaya", "Kusuma", "Hidayat", "Saputra", "Pratama", "Sutrisno", "Gunawan",
  "Purnama", "Siregar", "Nasution", "Lubis", "Hartono", "Mulyadi", "Basuki", "Tanah", "Raya", "Bakti",
  "Jenkins", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez"
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed520Staff() {
  try {
    console.log(`🏥 [INTERNATIONAL HOSPITAL HRIS SEEDER] Generating 5 Staff per Department for ${MASTER_DEPARTMENTS.length} Departments...`);

    const allStaffMembers = [];
    let counter = 1;

    // We use batching for Firestore writes (max 500 ops per batch)
    let currentBatch = writeBatch(db);
    let batchCount = 0;

    for (const dept of MASTER_DEPARTMENTS) {
      const deptName = dept.name;
      const deptId = dept.id;

      // Define 5 distinct professional roles per department
      const staffConfigs = [
        {
          role: "DOCTOR",
          profession: "Dokter Spesialis / Konsultan",
          titlePrefix: "dr.",
          titleSuffix: ", Sp.PD-KGEH",
          strPrefix: "STR-DOC"
        },
        {
          role: "NURSE",
          profession: "Kepala Ruangan / Nurse Manager",
          titlePrefix: "Ns.",
          titleSuffix: ", M.Kep, Sp.Kep.MB",
          strPrefix: "STR-NRS-MGR"
        },
        {
          role: "NURSE",
          profession: "Perawat Pelaksana / Clinical RN",
          titlePrefix: "Ns.",
          titleSuffix: ", S.Kep",
          strPrefix: "STR-NRS-RN"
        },
        {
          role: "PHARMACIST",
          profession: "Apoteker / Clinical Pharmacist",
          titlePrefix: "Apt.",
          titleSuffix: ", S.Farm",
          strPrefix: "STR-PHARM"
        },
        {
          role: "ADMIN",
          profession: "Staf Administrasi & Logistik",
          titlePrefix: "",
          titleSuffix: ", S.Tr.Kes",
          strPrefix: "STR-ADM"
        }
      ];

      for (let sIdx = 0; sIdx < 5; sIdx++) {
        const cfg = staffConfigs[sIdx];
        const firstName = getRandom(FIRST_NAMES);
        const lastName = getRandom(LAST_NAMES);
        const fullName = `${cfg.titlePrefix} ${firstName} ${lastName}${cfg.titleSuffix}`.trim();
        const empCode = `EMP-2026-${String(counter).padStart(4, '0')}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${counter}@nurseflow.hospital`;

        const staffData = {
          id: empCode,
          employeeId: empCode,
          name: fullName,
          email: email,
          phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
          role: cfg.role,
          profession: cfg.profession,
          department: deptName,
          departmentId: deptId,
          strNumber: `${cfg.strPrefix}-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          sipNumber: `SIP-503/${Math.floor(1000 + Math.random() * 9000)}/2026`,
          status: 'ACTIVE',
          credentialsValidUntil: '2028-12-31',
          created_at: new Date().toISOString()
        };

        allStaffMembers.push(staffData);

        // Firestore batch write
        const userDocRef = doc(db, 'users', empCode);
        currentBatch.set(userDocRef, staffData);
        batchCount++;

        if (batchCount === 450) {
          await currentBatch.commit();
          console.log(`  ✓ Committed batch of 450 staff records...`);
          currentBatch = writeBatch(db);
          batchCount = 0;
        }

        counter++;
      }
    }

    if (batchCount > 0) {
      await currentBatch.commit();
      console.log(`  ✓ Committed final batch of staff records...`);
    }

    console.log(`✅ Successfully seeded ALL ${allStaffMembers.length} staff members (5 staff per department across ${MASTER_DEPARTMENTS.length} departments)!`);

    // WRITE LOCAL REGISTRY FILE src/core/staffRegistry.js
    const targetFile = path.resolve('src/core/staffRegistry.js');
    const content = `/**
 * NurseFlow HIS — Master Hospital Staff Registry (${allStaffMembers.length} International Staff Members)
 * Every department has exactly 5 dedicated staff members!
 */

export const STAFF_REGISTRY = ${JSON.stringify(allStaffMembers, null, 2)};
`;

    fs.writeFileSync(targetFile, content, 'utf-8');
    console.log(`✅ Successfully generated src/core/staffRegistry.js with ${allStaffMembers.length} staff members!`);

  } catch (err) {
    console.error('❌ Error seeding 520 staff members:', err);
  }
}

seed520Staff();
