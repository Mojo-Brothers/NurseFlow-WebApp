import { usePatientStore } from '../patient.store.js';
import { useNavigate } from 'react-router-dom';
import { useEncounterStore } from '../../encounter/encounter.store.js';
import { calculateAge } from '../../../utils/clinicalCalculators.js';
import { createEncounter } from '../../encounter/services/encounter.service.js';
import { logAudit } from '../../../core/services/audit.service.js';
import { AUDIT_ACTIONS, COLLECTIONS } from '../../../core/constants.js';
import '../styles/Patients.css';

export default function PatientPage() {
  const navigate = useNavigate();
  const { patients, isLoading: loading, fetchPatients, addPatient } = usePatientStore();
  const { setLiveContext } = useEncounterStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ─── Local State: Unified Form Data (JCI Standard) ───
  const [form, setForm] = useState({
    // Step 1: Identitas
    name: '', nik: '', dob: '', gender: 'M', pob: '',
    // Step 2: Demografi & Kontak
    address: '', religion: 'Islam', phone: '', emergency_name: '',
    // Step 3: Penjamin
    insurance_type: 'UMUM', insurance_no: '',
    // Step 4: Clinical & Legal
    blood_type: 'O', allergies: '', fall_risk: false, consent: false
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // ─── Filter Logic (Performance Optimized) ───
  const filteredPatients = patients.filter(p => {
    const s = searchTerm.toLowerCase();
    return p.name?.toLowerCase().includes(s) || 
           p.mrn?.toLowerCase().includes(s) || 
           p.nik?.includes(s);
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.consent) return alert('Mohon setujui General Consent (JCI Policy).');

    try {
      await addPatient(
        { 
          name: form.name, 
          nik: form.nik, 
          pob: form.pob,
          demographics: { 
            dob: form.dob, 
            gender: form.gender,
            address: form.address,
            religion: form.religion,
          }, 
          emergency_contact: {
            name: form.emergency_name,
            phone: form.phone
          },
          insurance: {
            type: form.insurance_type,
            card_number: form.insurance_no
          },
          clinical_baseline: {
            blood_type: form.blood_type,
            allergies: form.allergies ? [form.allergies] : []
          },
          safety_flags: {
            fall_risk: form.fall_risk,
            allergy_risk: !!form.allergies
          },
          legal_consent: {
            general_consent: true,
            signed_at: new Date().toISOString()
          }
        },
        'system'
      );
      setIsModalOpen(false);
      setCurrentStep(1);
    } catch (error) {
      alert('Gagal: ' + error.message);
    }
  };

  const handleAdmit = async (patientId, patientName) => {
    const reason = prompt(`Alasan Admisi untuk ${patientName}:`, 'Pemeriksaan Rutin');
    if (!reason) return;

    try {
      // 1. Create Encounter (Architecture Step)
      const encounterId = await createEncounter({
        patientId,
        encounterType: 'EMERGENCY',
        chiefComplaint: reason,
        nurseInCharge: 'Nurse Robby',
        ward: 'IGD',
        createdBy: 'system'
      });

      // 2. Set Global Clinical Context (The Highway)
      setLiveContext(patientId, encounterId);

      // 3. JCI Audit Trail (Compliance)
      await logAudit({
        action: AUDIT_ACTIONS.CREATE,
        resource_type: COLLECTIONS.ENCOUNTERS,
        resource_id: encounterId,
        delta: { patientName, reason },
        reason: 'NEW_ENCOUNTER_ADMISSION'
      });

      // 4. Auto-Transition (Seamless Flow)
      alert(`Pasien ${patientName} berhasil di-admit. Menuju modul Triage...`);
      navigate('/triage');
    } catch (err) {
      alert('Gagal admisi: ' + err.message);
    }
  };

  const handleViewEMR = async (patientId, patientName) => {
    // JCI Requirement: Audit clinical access
    await logAudit({
      action: AUDIT_ACTIONS.VIEW,
      resource_type: COLLECTIONS.PATIENTS,
      resource_id: patientId,
      delta: { name: patientName },
      reason: 'CLINICAL_REVIEW'
    });
    alert(`Viewing EMR for ${patientName} (Access Recorded)`);
    // Logic to navigate to EMR page would follow
  };

  return (
    <div className="patients-container p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title">Patient Directory</h2>
          <p className="text-on-surface-variant text-sm mt-1">JCI Clinical Master Records</p>
        </div>
        <div className="flex-row gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '1.2rem' }}>search</span>
            <input 
              type="text" 
              placeholder="Search Name / MRN / NIK..." 
              className="form-input pl-10 w-80"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => { setIsModalOpen(true); setCurrentStep(1); }}>
            <span className="material-symbols-outlined icon-small mr-2" style={{verticalAlign: 'bottom'}}>person_add</span>
            New Admission
          </button>
        </div>
      </div>

      <div className="card padding-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-high border-b">
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">MRN / Identitas</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Clinical Indicators</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Insurance</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Age</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="py-8 text-center text-on-surface-variant">Loading records...</td></tr>
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan="5" className="py-8 text-center text-on-surface-variant">No records found matching "{searchTerm}".</td></tr>
            ) : (
              filteredPatients.map(p => (
                <tr key={p.id} className="border-b hover-bg-surface">
                  <td className="py-4 px-6">
                    <p className="font-bold text-primary">{p.mrn}</p>
                    <p className="font-bold text-base">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">NIK: {p.nik}</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex-row gap-2 flex-wrap">
                      {p.safety_flags?.allergy_risk && <span className="ipsg-flag flag-allergy">⚠️ Alergi</span>}
                      {p.safety_flags?.fall_risk && <span className="ipsg-flag flag-fall">⚠️ Resiko Jatuh</span>}
                      {!p.safety_flags?.allergy_risk && !p.safety_flags?.fall_risk && <span className="text-xs italic text-on-surface-variant">No alerts</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="ipsg-flag flag-insurance">{p.insurance?.type || 'UMUM'}</span>
                  </td>
                  <td className="py-4 px-6 text-on-surface-variant">
                    {calculateAge(p.demographics?.dob)} yrs
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex-row gap-2 justify-end">
                      <button className="btn-primary-small" onClick={() => handleAdmit(p.id, p.name)}>Admit</button>
                      <button className="btn-outline-small" onClick={() => handleViewEMR(p.id, p.mrn)}>EMR</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── JCI Multi-Step Registration Wizard ─── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '650px' }}>
            <div className="flex-row justify-between mb-4">
              <h3 className="font-bold text-xl">Clinical Registration</h3>
              <span className="text-sm font-bold text-on-surface-variant">Step {currentStep} of 4</span>
            </div>

            <div className="wizard-stepper">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`step-item ${currentStep === s ? 'active' : currentStep > s ? 'completed' : ''}`}>
                  <div className="step-indicator">{currentStep > s ? '✓' : s}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister}>
              {/* STEP 1: IDENTITAS */}
              {currentStep === 1 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Identitas Utama Pasien</p>
                  <div>
                    <label className="metric-label mb-2 block">NAMA LENGKAP (SESUAI IDENTITAS)</label>
                    <input required className="form-input" value={form.name} onChange={e => updateField('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">NIK / PASSPORT</label>
                    <input required className="form-input" value={form.nik} onChange={e => updateField('nik', e.target.value)} />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">TANGGAL LAHIR</label>
                      <input required type="date" className="form-input" value={form.dob} onChange={e => updateField('dob', e.target.value)} />
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">GENDER</label>
                      <select className="form-input" value={form.gender} onChange={e => updateField('gender', e.target.value)}>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: DEMOGRAFI & KONTAK */}
              {currentStep === 2 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Demografi & Kontak Darurat</p>
                  <div>
                    <label className="metric-label mb-2 block">ALAMAT DOMISILI</label>
                    <textarea className="form-input" value={form.address} onChange={e => updateField('address', e.target.value)} rows="2" />
                  </div>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">AGAMA</label>
                      <select className="form-input" value={form.religion} onChange={e => updateField('religion', e.target.value)}>
                        <option>Islam</option><option>Katolik</option><option>Kristen</option><option>Hindu</option><option>Budha</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">NOMOR HP</label>
                      <input className="form-input" value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">KONTAK DARURAT (NAMA WALI)</label>
                    <input className="form-input" value={form.emergency_name} onChange={e => updateField('emergency_name', e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 3: PENJAMIN */}
              {currentStep === 3 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Data Penjamin / Asuransi</p>
                  <div>
                    <label className="metric-label mb-2 block">JENIS PENJAMIN</label>
                    <select className="form-input" value={form.insurance_type} onChange={e => updateField('insurance_type', e.target.value)}>
                      <option>UMUM</option>
                      <option>BPJS KESEHATAN</option>
                      <option>ASURANSI SWASTA</option>
                      <option>CORPORATE</option>
                    </select>
                  </div>
                  <div>
                    <label className="metric-label mb-2 block">NOMOR KARTU / POLIS</label>
                    <input className="form-input" value={form.insurance_no} onChange={e => updateField('insurance_no', e.target.value)} placeholder="000123456" />
                  </div>
                </div>
              )}

              {/* STEP 4: KLINIS & LEGAL */}
              {currentStep === 4 && (
                <div className="flex-column gap-4">
                  <p className="section-divider">Baseline Klinis & Safety</p>
                  <div className="grid-2">
                    <div>
                      <label className="metric-label mb-2 block">GOLONGAN DARAH</label>
                      <select className="form-input" value={form.blood_type} onChange={e => updateField('blood_type', e.target.value)}>
                        <option>A</option><option>B</option><option>AB</option><option>O</option>
                      </select>
                    </div>
                    <div>
                      <label className="metric-label mb-2 block">RIWAYAT ALERGI</label>
                      <input className="form-input" value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder="Misal: Paracetamol" />
                    </div>
                  </div>
                  <div className="flex-row items-center gap-2 p-3 bg-surface-container-low rounded-md mt-2">
                    <input type="checkbox" id="fall" checked={form.fall_risk} onChange={e => updateField('fall_risk', e.target.checked)} />
                    <label htmlFor="fall" className="text-sm font-bold">Pasien beresiko jatuh (Punya riwayat jatuh/lemah)</label>
                  </div>

                  <p className="section-divider">Legal Consent (JCI Policy)</p>
                  <div className="flex-row items-start gap-2 p-4 border rounded-md bg-primary-container-lowest">
                    <input type="checkbox" id="consent" checked={form.consent} onChange={e => updateField('consent', e.target.checked)} required />
                    <label htmlFor="consent" className="text-xs leading-relaxed">
                      <strong>General Consent:</strong> Saya menyetujui pemeriksaan klinis, penggunaan data medis untuk kepentingan rumah sakit, dan bersedia mengikuti prosedur keselamatan pasien sesuai standar JCI.
                    </label>
                  </div>
                </div>
              )}

              <div className="flex-row justify-between mt-8 pt-4 border-t">
                {currentStep > 1 ? (
                  <button type="button" className="btn-ghost" onClick={() => setCurrentStep(prev => prev - 1)}>Kembali</button>
                ) : (
                  <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Batal</button>
                )}
                
                {currentStep < 4 ? (
                  <button type="button" className="btn-primary" onClick={() => setCurrentStep(prev => prev + 1)}>Lanjut Step {currentStep + 1}</button>
                ) : (
                  <button type="submit" className="btn-primary">Finalize & Register</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
