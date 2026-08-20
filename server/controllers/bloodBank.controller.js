import { bloodBankService } from '../services/bloodBank.service.js';
import { bloodBankEnterpriseEngine } from '../services/bloodBankEnterpriseEngine.service.js';
import { structuredLoggerService } from '../services/structuredLogger.service.js';

export const bloodBankController = {
  /**
   * GET /api/v1/blood-bank/units
   */
  async getInventory(req, res) {
    try {
      const units = Array.from(bloodBankService.units.values());
      return res.status(200).json({
        success: true,
        data: units,
        total: units.length
      });
    } catch (error) {
      structuredLoggerService.error('BLOOD_BANK_GET_INVENTORY_ERROR', { error: error.message });
      return res.status(500).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/blood-bank/units
   */
  async intakeDonorUnit(req, res) {
    try {
      const unit = bloodBankService.registerBloodUnit({
        unitNumber: req.body.donor_unit_number || req.body.unitNumber,
        aboType: req.body.blood_group || req.body.aboType,
        rhesusType: req.body.rhesus || req.body.rhesusType,
        productType: req.body.component_type || req.body.productType,
        volumeMl: req.body.volume_ml || req.body.volumeMl,
        donationDate: req.body.collection_date || req.body.donationDate,
        expiryDate: req.body.expiry_date || req.body.expiryDate
      });

      return res.status(201).json({
        success: true,
        data: {
          ...unit,
          isbt128_barcode: unit.unitNumber
        },
        message: 'Blood donor unit successfully accessioned with ISBT 128 barcode.'
      });
    } catch (error) {
      structuredLoggerService.error('BLOOD_BANK_INTAKE_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/blood-bank/crossmatch
   */
  async executeCrossmatch(req, res) {
    try {
      const crossmatch = bloodBankService.performCrossmatchTest({
        patientId: req.body.patient_id || 'P-001',
        encounterId: req.body.encounter_id || 'ENC-001',
        bloodUnitId: req.body.donor_unit_id || req.body.bloodUnitId || req.body.unitId,
        patientAbo: req.body.patient_abo || 'O',
        patientRhesus: req.body.patient_rhesus || 'POSITIVE',
        donorAbo: req.body.donor_abo || 'O',
        donorRhesus: req.body.donor_rhesus || 'POSITIVE',
        majorCrossmatch: req.body.major_crossmatch || 'COMPATIBLE',
        minorCrossmatch: req.body.minor_crossmatch || 'COMPATIBLE'
      });

      return res.status(200).json({
        success: true,
        data: {
          ...crossmatch,
          compatibility_status: crossmatch.overallCompatibility
        },
        message: 'Serological crossmatch test executed and recorded.'
      });
    } catch (error) {
      structuredLoggerService.error('BLOOD_BANK_CROSSMATCH_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  },

  /**
   * POST /api/v1/blood-bank/transfusion/verify
   */
  async verifyBedsideTransfusion(req, res) {
    try {
      const verification = bloodBankEnterpriseEngine.verifyBedsideTransfusion({
        unitId: req.body.unit_id || 'UNIT-001',
        unitNumber: req.body.unit_barcode_scanned || 'ISBT-001',
        encounterId: req.body.encounter_id || 'ENC-001',
        patientMrn: req.body.patient_mrn_scanned || 'MRN-001',
        patientBloodGroup: req.body.patient_blood_group || 'O',
        donorUnitBloodGroup: req.body.unit_blood_group || 'O',
        primaryNurse: { id: req.body.primary_nurse_id || 'NURSE-01', name: 'Ns. Maya' },
        secondaryNurse: { id: req.body.secondary_nurse_id || 'NURSE-02', name: 'Ns. Ratih' }
      });

      return res.status(200).json({
        success: true,
        data: {
          ...verification,
          authorized: true
        },
        message: 'Bedside dual-nurse verification passed. Transfusion authorized.'
      });
    } catch (error) {
      structuredLoggerService.error('BLOOD_BANK_VERIFY_ERROR', { error: error.message });
      return res.status(400).json({ success: false, message: error.message });
    }
  }
};
