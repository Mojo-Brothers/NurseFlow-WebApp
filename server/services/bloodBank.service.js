/**
 * NurseFlow Enterprise HIS 2026 — Blood Bank (BDRS) & Hemovigilance Engine
 * Standar: WHO Blood Transfusion Safety Guidelines & JCI Patient Safety
 */

export const BLOOD_PRODUCTS = {
  PRC: 'Packed Red Cells',
  FFP: 'Fresh Frozen Plasma',
  TC: 'Thrombocyte Concentrate',
  WB: 'Whole Blood'
};

class BloodBankService {
  constructor() {
    this.bloodRequests = new Map();
  }

  /**
   * 1. Check ABO/Rh Blood Group Compatibility
   */
  isAboCompatible(patientBloodGroup, donorBloodGroup) {
    const COMPATIBILITY_RULES = {
      'O+': ['O+', 'O-'],
      'O-': ['O-'],
      'A+': ['A+', 'A-', 'O+', 'O-'],
      'A-': ['A-', 'O-'],
      'B+': ['B+', 'B-', 'O+', 'O-'],
      'B-': ['B-', 'O-'],
      'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
      'AB-': ['AB-', 'A-', 'B-', 'O-']
    };

    const compatibleDonors = COMPATIBILITY_RULES[patientBloodGroup] || [];
    return compatibleDonors.includes(donorBloodGroup);
  }

  /**
   * 2. Issue Cross-Matched Blood Product
   */
  processBloodRequest({
    patientId,
    patientName,
    patientBloodGroup = 'A+',
    productType = 'PRC',
    unitsRequested = 2,
    donorBagNumber = 'BAG-2026-0817-A01',
    donorBloodGroup = 'A+',
    crossMatchResult = 'COMPATIBLE'
  }) {
    if (crossMatchResult !== 'COMPATIBLE') {
      throw new Error('TRANSFUSI DITOLAK: Hasil Cross-Matching INKOMPATIBEL. Kantong darah tidak boleh dikeluarkan!');
    }

    const isCompatible = this.isAboCompatible(patientBloodGroup, donorBloodGroup);
    if (!isCompatible) {
      throw new Error(`TRANSFUSI DITOLAK: Golongan darah donor ${donorBloodGroup} tidak kompatibel dengan pasien ${patientBloodGroup}!`);
    }

    const requestId = `BDRS-${Date.now()}`;
    const record = {
      requestId,
      patientId,
      patientName,
      patientBloodGroup,
      productType,
      donorBagNumber,
      donorBloodGroup,
      unitsRequested,
      crossMatchResult,
      status: 'ISSUED_FOR_TRANSFUSION',
      issuedAt: new Date().toISOString()
    };

    this.bloodRequests.set(requestId, record);
    return record;
  }
}

export const bloodBankService = new BloodBankService();
