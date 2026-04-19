import React, { useState, useEffect } from 'react';
// ✅ Domain store — shared patient cache, tidak duplikasi fetch
import { usePatientStore } from '../modules/patient/patient.store.js';
import './Patients.css';


export default function Patients() {
  const { patients, isLoading: loading, fetchPatients, addPatient } = usePatientStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('M');

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await addPatient(
        { name, nik, demographics: { dob, gender }, allergies: [] },
        'system' // akan diganti dengan currentUser.email saat auth terintegrasi
      );
      setIsModalOpen(false);
      setName(''); setNik(''); setDob('');
    } catch (error) {
      alert('Gagal mendaftarkan pasien: ' + error.message);
    }
  };

  return (
    <div className="patients-container p-8 max-w-7xl mx-auto w-full">
      <div className="flex-row items-center justify-between mb-8">
        <div>
          <h2 className="title">Patient Directory</h2>
          <p className="text-on-surface-variant text-sm mt-1">Master Records & Admission</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined icon-small mr-2" style={{verticalAlign: 'bottom'}}>person_add</span>
          Register Patient
        </button>
      </div>

      <div className="card padding-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-high border-b">
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">MRN</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Name</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">NIK</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Age</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant">Status</th>
              <th className="py-4 px-6 font-bold text-xs uppercase text-on-surface-variant text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">Loading records...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="6" className="py-8 text-center text-on-surface-variant">No patients registered. Add one to begin triage.</td></tr>
            ) : (
              patients.map(p => (
                <tr key={p.id} className="border-b hover-bg-surface">
                  <td className="py-4 px-6 font-bold text-primary">{p.mrn}</td>
                  <td className="py-4 px-6 font-bold">{p.name}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{p.nik}</td>
                  <td className="py-4 px-6 text-on-surface-variant">
                    {p.demographics?.dob ? new Date().getFullYear() - new Date(p.demographics.dob).getFullYear() : '?'} yrs
                  </td>
                  <td className="py-4 px-6">
                    <span className="chip chip-success">Active</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="btn-outline-small">View EMR</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3 className="font-bold text-xl mb-6">Register New Patient</h3>
            <form onSubmit={handleRegister} className="flex-column gap-4">
              <div>
                <label className="metric-label mb-2 block">FULL NAME</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="form-input" placeholder="John Doe" />
              </div>
              <div>
                <label className="metric-label mb-2 block">GOV ID (NIK)</label>
                <input required value={nik} onChange={e => setNik(e.target.value)} className="form-input" placeholder="320..." />
              </div>
              <div className="flex-row gap-4">
                <div className="flex-1">
                  <label className="metric-label mb-2 block">DATE OF BIRTH</label>
                  <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="form-input" />
                </div>
                <div className="flex-1">
                  <label className="metric-label mb-2 block">GENDER</label>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="form-input">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex-row justify-between mt-6 pt-4 border-t">
                <button type="button" className="btn-ghost" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
