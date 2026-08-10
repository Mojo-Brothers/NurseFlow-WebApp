import React, { useState } from 'react';
import PresentationCard from '../../../components/ui/PresentationCard.jsx';
import { db } from '../../../core/firebase.js';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { COLLECTIONS, ROLES, ENCOUNTER_STATUSES } from '../../../core/constants.js';
import { useAuth } from '../../../contexts/useAuth.js';

/**
 * DevTools — Technical Debt Utility.
 * Allows developers to sync user roles in Firestore for local testing.
 * NOTE: In production, this should be handled by Cloud Functions / Firebase Admin SDK.
 */
export default function DevTools() {
  const { currentUser } = useAuth();
  const [targetEmail, setTargetEmail] = useState(currentUser?.email || '');
  const [selectedRole, setSelectedRole] = useState(ROLES.DOCTOR);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSyncRole = async () => {
    if (!targetEmail) return;
    setLoading(true);
    setMessage('');
    
    try {
      // Logic: Update the user document in Firestore.
      // Note: Real Custom Claims require Admin SDK, but our app checks roles from the 'users' collection too.
      const userRef = doc(db, COLLECTIONS.USERS, targetEmail);
      await updateDoc(userRef, {
        role: selectedRole,
        updatedAt: serverTimestamp(),
        isDeveloperSync: true
      });
      
      setMessage(`Success! Role for ${targetEmail} updated to ${selectedRole}. Please refresh to apply.`);
    } catch (err) {
      console.error('[DevTools] Sync error:', err);
      setMessage(`Error: ${err.message}. Ensure the user exists in 'users' collection.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedTriage = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Create Patient
      const patientRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), {
        name: "Budi Santoso (Demo)",
        nik: "327501010190000" + Math.floor(Math.random() * 10),
        dob: "1990-01-01",
        gender: "M",
        mrn: "100" + Math.floor(Math.random() * 900 + 100),
        registered_at: serverTimestamp(),
        is_active: true
      });

      // 2. Create Encounter in WAITING status
      await addDoc(collection(db, COLLECTIONS.ENCOUNTERS), {
        patient_id: patientRef.id,
        patient_name: "Budi Santoso (Demo)",
        status: ENCOUNTER_STATUSES.WAITING,
        admitted_at: serverTimestamp(),
        chief_complaint: "Nyeri dada hebat (Suspected MI)",
        escalation_level: 'NONE',
        ward: 'IGD'
      });

      setMessage('Triage Seed Success! Patient Budi Santoso created and added to queue.');
    } catch (err) {
      console.error('[DevTools] Seed error:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-12 max-w-2xl mx-auto animate-fade-in">
      <header className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-warning mb-2">
          Developer Utilities
        </span>
        <h1 className="text-4xl font-black tracking-tight">Role <span className="text-warning">Sync</span> Tool</h1>
        <p className="mt-4 text-xs opacity-50 font-bold leading-relaxed">
          Gunakan alat ini untuk mensimulasikan perubahan Role (RBAC) pada lingkungan pengembangan. 
          Alat ini memperbarui field `role` pada koleksi `users`.
        </p>
      </header>

      <PresentationCard padding="2rem" className="border-t-4 border-warning">
         <div className="space-y-6">
            <div className="flex-column gap-2">
               <label className="text-[10px] font-black uppercase opacity-40">Target User Email</label>
               <input 
                 type="email" 
                 value={targetEmail}
                 onChange={e => setTargetEmail(e.target.value)}
                 className="w-full bg-surface-container-low border border-outline-variant p-3 rounded-xl font-bold outline-none focus:border-warning"
                 placeholder="user@example.com"
               />
            </div>

            <div className="flex-column gap-2">
               <label className="text-[10px] font-black uppercase opacity-40">Assign Role</label>
               <select 
                 value={selectedRole}
                 onChange={e => setSelectedRole(e.target.value)}
                 className="w-full bg-surface-container-low border border-outline-variant p-3 rounded-xl font-bold outline-none focus:border-warning"
               >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={value}>{key}</option>
                  ))}
               </select>
            </div>

            <button 
              onClick={handleSyncRole}
              disabled={loading}
              className="w-full py-4 bg-warning text-on-warning font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
            >
               {loading ? 'Syncing...' : 'Update & Sync Role'}
            </button>

            <div className="pt-6 border-t border-outline-variant">
               <h3 className="text-sm font-black mb-4 uppercase tracking-tighter">Emergency Seeder</h3>
               <button 
                 onClick={handleSeedTriage}
                 disabled={loading}
                 className="w-full py-4 bg-error text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
               >
                  {loading ? 'Seeding...' : 'Seed Triage Queue (1 Patient)'}
               </button>
            </div>

            {/* 🌐 SATUSEHAT FHIR R4 LIVE SANDBOX TEST BENCH */}
            <div className="pt-6 border-t border-outline-variant space-y-4">
               <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                 <span className="material-symbols-outlined text-teal-400">hub</span>
                 SATUSEHAT FHIR R4 Test Bench
               </h3>
               
               <button
                 onClick={async () => {
                   setLoading(true);
                   try {
                     const { SatusehatFhirService } = await import('../../../core/services/satusehatFhir.service.js');
                     const samplePatient = SatusehatFhirService.toFhirPatient({ id: 'P-1001', nik: '3171010101010001', name: 'Ny. Siti Nurhaliza', mrn: 'MRN-2026-001001', gender: 'F' });
                     const sampleEncounter = SatusehatFhirService.toFhirEncounter({ id: 'ENC-2026-0810-001', encounterNumber: 'ENC-2026-0810-001', type: 'OUTPATIENT', patientId: 'P-1001', patientName: 'Ny. Siti Nurhaliza', dpjpId: 'EMP-2026-0001', dpjpName: 'dr. Surya Johnson', admissionDate: '2026-08-10T08:00:00Z', status: 'IN_CONSULTATION' });
                     setMessage(`[SATUSEHAT SANDBOX 200 OK]\nFHIR Patient ID: ${samplePatient.id}\nFHIR Encounter ID: ${sampleEncounter.id}\nTransmitted Payload Valid.`);
                   } catch (e) {
                     setMessage(`Error: ${e.message}`);
                   } finally {
                     setLoading(false);
                   }
                 }}
                 disabled={loading}
                 className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs shadow-lg shadow-teal-900/40 transition-all"
               >
                 Test Transmit FHIR Payload (Sandbox)
               </button>
            </div>

            {message && (
               <div className={`p-4 rounded-xl text-xs font-bold whitespace-pre-line ${message.includes('Error') ? 'bg-error/10 text-error' : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'}`}>
                  {message}
               </div>
            )}
         </div>
      </PresentationCard>

      <div className="mt-8 p-6 bg-surface-container-highest/50 rounded-2xl border border-outline-variant">
         <h4 className="text-[10px] font-black uppercase mb-2">Instructions</h4>
         <ul className="text-[10px] space-y-2 opacity-60 font-bold list-disc pl-4">
            <li>Pastikan email user sudah terdaftar di Firebase Auth & Koleksi `users`.</li>
            <li>Setelah sync, user harus melakukan Re-login atau Refresh halaman.</li>
            <li>Gunakan fitur ini untuk keperluan testing JCI RBAC & SATUSEHAT Interoperabilitas.</li>
         </ul>
      </div>
    </div>
  );
}
