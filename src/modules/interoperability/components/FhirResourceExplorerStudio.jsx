import React, { useState } from 'react';
import { satusehatFhirStudioService, SATUSEHAT_CONFIG } from '../../../../server/services/satusehatFhirStudio.service.js';
import toast from 'react-hot-toast';

const AVAILABLE_RESOURCES = [
  { key: 'Organization', title: '1. Organization (Fasilitas RS)', icon: 'apartment', desc: 'Identitas legal fasilitas RS (SATUSEHAT Org ID: 100028741)' },
  { key: 'Location', title: '2. Location (Tempat Tidur/Kamar)', icon: 'bed', desc: 'Struktur spasial bangsal dan bed rawat inap' },
  { key: 'Practitioner', title: '3. Practitioner (Dokter/Nakes)', icon: 'stethoscope', desc: 'Identitas dokter dengan IHS Number & NIK' },
  { key: 'Patient', title: '4. Patient (Identitas Pasien)', icon: 'person', desc: 'Demografi pasien terintegrasi NIK Dukcapil' },
  { key: 'Encounter', title: '5. Encounter (Kunjungan Klinis)', icon: 'meeting_room', desc: 'Episode rawat jalan, rawat inap, atau IGD' },
  { key: 'Condition', title: '6. Condition (Diagnosis ICD-10)', icon: 'clinical_notes', desc: 'Diagnosis primer dan sekunder berstandar ICD-10' },
  { key: 'Observation', title: '7. Observation (Tanda Vital & Lab)', icon: 'monitoring', desc: 'Hasil uji lab LOINC dan observasi tanda vital' },
  { key: 'MedicationRequest', title: '8. MedicationRequest (Resep)', icon: 'prescriptions', desc: 'Order peresepan obat berbasis KFA Kemenkes' },
  { key: 'Procedure', title: '9. Procedure (Tindakan Bedah)', icon: 'medical_services', desc: 'Tindakan operasi dan medis berstandar ICD-9-CM' },
  { key: 'DiagnosticReport', title: '10. DiagnosticReport (Radiologi)', icon: 'radiology', desc: 'Hasil ekspertise radiologi DICOM dan panel lab' }
];

export default function FhirResourceExplorerStudio() {
  const [selectedResourceKey, setSelectedResourceKey] = useState('Patient');
  const [copied, setCopied] = useState(false);

  // Generate Current JSON representation
  const getSelectedResourceJson = () => {
    switch (selectedResourceKey) {
      case 'Organization':
        return satusehatFhirStudioService.serializeOrganization();
      case 'Location':
        return satusehatFhirStudioService.serializeLocation();
      case 'Practitioner':
        return satusehatFhirStudioService.serializePractitioner();
      case 'Patient':
        return satusehatFhirStudioService.serializePatient();
      case 'Encounter':
        return satusehatFhirStudioService.serializeEncounter();
      case 'Condition':
        return satusehatFhirStudioService.serializeCondition();
      case 'Observation':
        return satusehatFhirStudioService.serializeObservation();
      case 'MedicationRequest':
        return satusehatFhirStudioService.serializeMedicationRequest();
      case 'Procedure':
        return satusehatFhirStudioService.serializeProcedure();
      case 'DiagnosticReport':
        return satusehatFhirStudioService.serializeDiagnosticReport();
      default:
        return satusehatFhirStudioService.serializePatient();
    }
  };

  const currentPayload = getSelectedResourceJson();
  const jsonString = JSON.stringify(currentPayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    toast.success(`JSON FHIR ${selectedResourceKey} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar Selector */}
      <div className="lg:col-span-4 space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Pilih Resource FHIR R4</h3>
        <div className="space-y-1.5 max-h-[700px] overflow-y-auto pr-1">
          {AVAILABLE_RESOURCES.map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedResourceKey(item.key)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                selectedResourceKey === item.key
                  ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${selectedResourceKey === item.key ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate ${selectedResourceKey === item.key ? 'text-teal-700 dark:text-teal-300 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* JSON Viewer Studio */}
      <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
        {/* Viewer Header */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-teal-300">{currentPayload.resourceType}.json</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/50 text-teal-300 border border-teal-700">
              HL7 FHIR R4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Tersalin' : 'Salin JSON'}
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-5 overflow-auto flex-1 font-mono text-xs text-slate-300 bg-slate-950/90 leading-relaxed max-h-[620px]">
          <pre className="text-emerald-400 font-mono">{jsonString}</pre>
        </div>

        {/* Footer Meta */}
        <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>StructureDefinition: <strong className="text-slate-300">{currentPayload.meta?.profile?.[0] || 'Standard Profile'}</strong></span>
          <span className="font-mono text-teal-400">{(jsonString.length / 1024).toFixed(2)} KB</span>
        </div>
      </div>
    </div>
  );
}
