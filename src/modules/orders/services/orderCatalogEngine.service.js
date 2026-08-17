/**
 * NurseFlow Enterprise HIS 2026 — Master Order Catalog Engine
 * Sprint 5: Pharmacy Formularium, LIS LOINC Catalog & RIS DICOM Procedures
 */

export const PHARMACY_CATALOG = [
  { code: 'MED-PCM-500', name: 'Paracetamol Tab 500 mg', route: 'ORAL', unitPrice: 3500, highAlert: false, lasa: false, isAntibiotic: false },
  { code: 'MED-AMX-500', name: 'Amoxicillin Cap 500 mg', route: 'ORAL', unitPrice: 8500, highAlert: false, lasa: false, isAntibiotic: true },
  { code: 'MED-CTX-1000', name: 'Ceftriaxone Inj 1 g Vial', route: 'IV', unitPrice: 65000, highAlert: false, lasa: false, isAntibiotic: true },
  { code: 'MED-HEP-5000', name: 'Heparin Sodium Inj 5000 IU/ml', route: 'IV', unitPrice: 85000, highAlert: true, lasa: true, isAntibiotic: false },
  { code: 'MED-INS-GLA', name: 'Insulin Glargine (Lantus) Pen', route: 'SC', unitPrice: 185000, highAlert: true, lasa: true, isAntibiotic: false },
  { code: 'MED-KCL-746', name: 'Kalium Klorida (KCl 7.46%) High Concentrate Inj', route: 'IV', unitPrice: 42000, highAlert: true, lasa: false, isAntibiotic: false },
  { code: 'MED-CIP-500', name: 'Ciprofloxacin Tab 500 mg', route: 'ORAL', unitPrice: 18000, highAlert: false, lasa: false, isAntibiotic: true },
  { code: 'MED-OMP-40', name: 'Omeprazole Inj 40 mg Vial', route: 'IV', unitPrice: 55000, highAlert: false, lasa: false, isAntibiotic: false }
];

export const LABORATORY_CATALOG = [
  { code: 'LAB-CBC', name: 'Darah Lengkap (Complete Blood Count / CBC)', loinc: '58410-2', specimen: 'WHOLE_BLOOD', unitPrice: 120000, refRange: 'Hb: 12-16 g/dL, Leuko: 4.0-10.0 10^3/uL, Trombo: 150-450 10^3/uL' },
  { code: 'LAB-GDS', name: 'Glukosa Darah Sewaktu (GDS Rapid)', loinc: '2339-0', specimen: 'WHOLE_BLOOD', unitPrice: 35000, refRange: '70 - 140 mg/dL' },
  { code: 'LAB-KFT', name: 'Fungsi Ginjal (Ureum, Kreatinin, eGFR)', loinc: '33914-3', specimen: 'SERUM', unitPrice: 145000, refRange: 'Ureum: 15-40 mg/dL, Kreatinin: 0.6-1.2 mg/dL' },
  { code: 'LAB-LFT', name: 'Fungsi Hati (SGOT, SGPT, Bilirubin)', loinc: '1751-7', specimen: 'SERUM', unitPrice: 160000, refRange: 'SGOT: < 35 U/L, SGPT: < 45 U/L' },
  { code: 'LAB-TROP-I', name: 'Troponin I Kuantitatif Cito', loinc: '42757-5', specimen: 'SERUM', unitPrice: 220000, refRange: '< 0.04 ng/mL' },
  { code: 'LAB-ELECTRO', name: 'Elektrolit Serum (Na, K, Cl)', loinc: '2951-2', specimen: 'SERUM', unitPrice: 180000, refRange: 'Na: 135-145, K: 3.5-5.0, Cl: 98-106 mEq/L' },
  { code: 'LAB-URINE', name: 'Urinalisis Lengkap Otomatis', loinc: '24357-6', specimen: 'URINE', unitPrice: 75000, refRange: 'Protein (-), Glukosa (-), Sedimen Normal' }
];

export const RADIOLOGY_CATALOG = [
  { code: 'RAD-XR-THORAX', name: 'Rontgen Thorax PA / AP Portable', modality: 'XR', unitPrice: 180000, bodyPart: 'THORAX' },
  { code: 'RAD-CT-HEAD', name: 'CT Scan Kepala Non-Contrast Cito', modality: 'CT', unitPrice: 850000, bodyPart: 'HEAD' },
  { code: 'RAD-USG-ABD', name: 'USG Abdomen Upper-Lower Lengkap', modality: 'US', unitPrice: 350000, bodyPart: 'ABDOMEN' },
  { code: 'RAD-MR-BRAIN', name: 'MRI Otak Brain 1.5 Tesla', modality: 'MR', unitPrice: 2200000, bodyPart: 'BRAIN' },
  { code: 'RAD-XR-PELVIS', name: 'Rontgen Pelvis AP (Trauma)', modality: 'XR', unitPrice: 195000, bodyPart: 'PELVIS' }
];

export const orderCatalogEngineService = {
  getPharmacyCatalog: () => PHARMACY_CATALOG,
  getLaboratoryCatalog: () => LABORATORY_CATALOG,
  getRadiologyCatalog: () => RADIOLOGY_CATALOG,

  searchItems: (category, query = '') => {
    const q = query.toLowerCase();
    if (category === 'PHARMACY') {
      return PHARMACY_CATALOG.filter(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
    }
    if (category === 'LABORATORY') {
      return LABORATORY_CATALOG.filter(l => l.name.toLowerCase().includes(q) || l.loinc.includes(q));
    }
    if (category === 'RADIOLOGY') {
      return RADIOLOGY_CATALOG.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return [];
  }
};
