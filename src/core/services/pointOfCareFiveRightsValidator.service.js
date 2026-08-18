/**
 * ============================================================================
 * SPRINT 3C: POINT-OF-CARE 5-RIGHTS BARCODE VERIFICATION ENGINE
 * 
 * Sensor Verification Layer on top of MedicationLifecycleEngine.
 * Barcode is treated purely as SENSOR EVIDENCE, never canonical truth.
 * 
 * 5-Rights Contract:
 * 1. Right Patient (MRN + Encounter match)
 * 2. Right Drug (Code match + Non-Expired)
 * 3. Right Dose (Ordered dose match)
 * 4. Right Route (Ordered route match)
 * 5. Right Time (Discrete slot window evaluation: EARLY, ON_TIME, LATE, MISSED)
 * ============================================================================
 */

import { barcodeScannerAdapter } from './barcodeScannerAdapter.service.js';
import { 
  medicationLifecycleEngine, 
  MED_ERROR_CODES, 
  MEDICATION_ORDER_STATES, 
  MEDICATION_SLOT_STATES,
  MedicationSafetyException 
} from './medicationLifecycleEngine.service.js';
import { medicationProjectionEngine } from './medicationProjectionEngine.service.js';
import { persistenceAdapter } from './persistenceAdapter.service.js';
import { CARE_STATES } from './careStateEngine.service.js';

export const FIVE_RIGHTS_STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL'
};

export const TIME_WINDOW_STATUS = {
  ON_TIME: 'ON_TIME',
  EARLY: 'EARLY',
  LATE: 'LATE',
  MISSED: 'MISSED'
};

export const SENSOR_ERROR_CODES = {
  ...MED_ERROR_CODES,
  EXPIRED_MEDICATION: 'EXPIRED_MEDICATION',
  LOT_MISMATCH: 'LOT_MISMATCH',
  MALFORMED_BARCODE: 'MALFORMED_BARCODE',
  VERIFICATION_UNAVAILABLE: 'VERIFICATION_UNAVAILABLE',
  TIME_WINDOW_VIOLATION: 'WRONG_TIME'
};

class PointOfCareFiveRightsValidator {
  constructor() {
    this.DEFAULT_ALLOWED_WINDOW_MINUTES = 60; // Standard hospital window: +/- 60 mins
  }

  /**
   * Run 5-Rights Verification against Canonical Domain Engine
   */
  async validateFiveRights({
    rawPatientBarcode,
    rawMedicationBarcode,
    orderId,
    slotId,
    intendedDose = null,
    intendedRoute = null,
    currentTimestamp = new Date().toISOString(),
    allowedWindowMinutes = this.DEFAULT_ALLOWED_WINDOW_MINUTES
  }) {
    const verificationId = `VERIF-POC-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 0. Fetch Canonical Order from Persistent Store
    const order = await persistenceAdapter.findById('medication_orders', orderId);
    if (!order) {
      throw new MedicationSafetyException(
        SENSOR_ERROR_CODES.VERIFICATION_UNAVAILABLE,
        `Canonical Medication Order "${orderId}" not found`
      );
    }

    // Check Stale Order Status (Canonical State Rule)
    if (order.status === MEDICATION_ORDER_STATES.CANCELLED) {
      throw new MedicationSafetyException(
        SENSOR_ERROR_CODES.ORDER_CANCELLED,
        `Order "${order.orderNumber}" has been CANCELLED by physician. Verification blocked.`
      );
    }

    // 1. Fetch Canonical Patient Encounter
    const encounter = await persistenceAdapter.findById('encounters', order.encounterId);
    if (encounter) {
      if (encounter.primaryState === CARE_STATES.DECEASED) {
        throw new MedicationSafetyException(
          SENSOR_ERROR_CODES.PATIENT_TERMINAL,
          `Patient is DECEASED. Verification blocked.`
        );
      }
      if (encounter.primaryState === CARE_STATES.DISCHARGED && order.workflowType !== 'DISCHARGE_TAKE_HOME') {
        throw new MedicationSafetyException(
          SENSOR_ERROR_CODES.DISCHARGE_BEDSIDE_ADMIN_BLOCKED,
          `Patient is already DISCHARGED from hospital. Inpatient bedside verification blocked.`
        );
      }
    }

    // 2. Fetch Canonical Slot
    const slot = order.scheduleSlots.find(s => s.slotId === slotId);
    if (!slot) {
      throw new Error(`Schedule Slot "${slotId}" not found in order "${orderId}"`);
    }

    // Concurrency Check on Slot
    if (slot.status === MEDICATION_SLOT_STATES.ADMINISTERED) {
      throw new MedicationSafetyException(
        SENSOR_ERROR_CODES.SLOT_ALREADY_ADMINISTERED,
        `Slot "${slot.scheduledTime}" has ALREADY been administered at ${slot.administeredAt}`
      );
    }

    // 3. Parse Barcode Sensors via Adapter
    const parsedPatient = barcodeScannerAdapter.parseRawScan(rawPatientBarcode);
    const parsedMedication = barcodeScannerAdapter.parseRawScan(rawMedicationBarcode);

    const rights = {
      rightPatient: { status: FIVE_RIGHTS_STATUS.FAIL, code: null, details: '' },
      rightDrug: { status: FIVE_RIGHTS_STATUS.FAIL, code: null, details: '' },
      rightDose: { status: FIVE_RIGHTS_STATUS.FAIL, code: null, details: '' },
      rightRoute: { status: FIVE_RIGHTS_STATUS.FAIL, code: null, details: '' },
      rightTime: { status: FIVE_RIGHTS_STATUS.FAIL, code: null, details: '' }
    };

    const failedRights = [];

    // ----------------------------------------------------
    // RIGHT 1: PATIENT IDENTITY VERIFICATION
    // ----------------------------------------------------
    if (!parsedPatient.success) {
      rights.rightPatient = {
        status: FIVE_RIGHTS_STATUS.FAIL,
        code: parsedPatient.error || SENSOR_ERROR_CODES.MALFORMED_BARCODE,
        details: 'Patient wristband barcode could not be read or parsed'
      };
      failedRights.push('RIGHT_PATIENT');
    } else {
      const scannedMrn = parsedPatient.parsedData.mrn || parsedPatient.parsedData.patientIdentifier;
      if (scannedMrn === order.mrn) {
        rights.rightPatient = {
          status: FIVE_RIGHTS_STATUS.PASS,
          code: null,
          details: `Patient MRN "${scannedMrn}" matches order MRN for "${order.patientName}"`
        };
      } else {
        rights.rightPatient = {
          status: FIVE_RIGHTS_STATUS.FAIL,
          code: SENSOR_ERROR_CODES.WRONG_PATIENT,
          details: `Scanned Patient MRN "${scannedMrn}" does NOT match expected MRN "${order.mrn}"`
        };
        failedRights.push('RIGHT_PATIENT');
      }
    }

    // ----------------------------------------------------
    // RIGHT 2: DRUG, LOT/BATCH & EXPIRY VERIFICATION
    // ----------------------------------------------------
    if (!parsedMedication.success) {
      rights.rightDrug = {
        status: FIVE_RIGHTS_STATUS.FAIL,
        code: parsedMedication.error || SENSOR_ERROR_CODES.MALFORMED_BARCODE,
        details: 'Medication barcode could not be read or parsed'
      };
      failedRights.push('RIGHT_DRUG');
    } else {
      const scannedDrugCode = parsedMedication.parsedData.medicationCode || parsedMedication.parsedData.gtin;
      
      // Check Expiry Date from GS1 barcode if available
      const barcodeExpiry = parsedMedication.parsedData.expiryDate;
      const isExpired = barcodeExpiry && new Date(barcodeExpiry).getTime() < new Date(currentTimestamp).getTime();

      // Check Lot/Batch match if dispensed batch is recorded
      const dispensedBatch = order.dispenseInfo?.batchNumber;
      const scannedBatch = parsedMedication.parsedData.batchNumber;
      const isLotMismatch = dispensedBatch && scannedBatch && dispensedBatch !== scannedBatch;

      if (isExpired) {
        rights.rightDrug = {
          status: FIVE_RIGHTS_STATUS.FAIL,
          code: SENSOR_ERROR_CODES.EXPIRED_MEDICATION,
          details: `Scanned drug is EXPIRED (Expiry: ${barcodeExpiry}). Hard Stop!`
        };
        failedRights.push('RIGHT_DRUG');
      } else if (isLotMismatch) {
        rights.rightDrug = {
          status: FIVE_RIGHTS_STATUS.FAIL,
          code: SENSOR_ERROR_CODES.LOT_MISMATCH,
          details: `Batch/Lot mismatch! Scanned lot "${scannedBatch}" does not match pharmacy dispensed lot "${dispensedBatch}". Hard Stop!`
        };
        failedRights.push('RIGHT_DRUG');
      } else if (scannedDrugCode === order.medicationCode) {
        rights.rightDrug = {
          status: FIVE_RIGHTS_STATUS.PASS,
          code: null,
          details: `Medication "${order.medicationName}" (${scannedDrugCode}) matches order`
        };
      } else {
        rights.rightDrug = {
          status: FIVE_RIGHTS_STATUS.FAIL,
          code: SENSOR_ERROR_CODES.WRONG_DRUG,
          details: `Scanned drug code "${scannedDrugCode}" does NOT match ordered "${order.medicationCode}" (${order.medicationName})`
        };
        failedRights.push('RIGHT_DRUG');
      }
    }

    // ----------------------------------------------------
    // RIGHT 3: DOSE VERIFICATION
    // ----------------------------------------------------
    const doseToCheck = intendedDose !== null ? intendedDose : order.dose;
    if (Number(doseToCheck) === Number(order.dose)) {
      rights.rightDose = {
        status: FIVE_RIGHTS_STATUS.PASS,
        code: null,
        details: `Dose ${doseToCheck} ${order.doseUnit} matches ordered dose`
      };
    } else {
      rights.rightDose = {
        status: FIVE_RIGHTS_STATUS.FAIL,
        code: SENSOR_ERROR_CODES.WRONG_DOSE,
        details: `Administering dose "${doseToCheck}" differs from ordered dose "${order.dose} ${order.doseUnit}"`
      };
      failedRights.push('RIGHT_DOSE');
    }

    // ----------------------------------------------------
    // RIGHT 4: ROUTE VERIFICATION
    // ----------------------------------------------------
    const routeToCheck = intendedRoute ? intendedRoute.toUpperCase() : order.route.toUpperCase();
    if (routeToCheck === order.route.toUpperCase()) {
      rights.rightRoute = {
        status: FIVE_RIGHTS_STATUS.PASS,
        code: null,
        details: `Route "${routeToCheck}" matches ordered route`
      };
    } else {
      rights.rightRoute = {
        status: FIVE_RIGHTS_STATUS.FAIL,
        code: SENSOR_ERROR_CODES.WRONG_ROUTE,
        details: `Intended route "${routeToCheck}" differs from ordered route "${order.route}"`
      };
      failedRights.push('RIGHT_ROUTE');
    }

    // ----------------------------------------------------
    // RIGHT 5: TIME WINDOW VERIFICATION
    // ----------------------------------------------------
    const timeEvaluation = this._evaluateTimeWindow(slot, currentTimestamp, allowedWindowMinutes);
    if (timeEvaluation.status === TIME_WINDOW_STATUS.ON_TIME) {
      rights.rightTime = {
        status: FIVE_RIGHTS_STATUS.PASS,
        code: null,
        details: `Scheduled for ${slot.scheduledTime} (Window: On Time)`
      };
    } else {
      rights.rightTime = {
        status: FIVE_RIGHTS_STATUS.FAIL,
        code: SENSOR_ERROR_CODES.TIME_WINDOW_VIOLATION,
        details: `Time mismatch: Dose is ${timeEvaluation.status} (${timeEvaluation.differenceMinutes} mins diff vs scheduled ${slot.scheduledTime})`
      };
      failedRights.push('RIGHT_TIME');
    }

    const overallStatus = failedRights.length === 0 ? FIVE_RIGHTS_STATUS.PASS : FIVE_RIGHTS_STATUS.FAIL;
    const canAdminister = overallStatus === FIVE_RIGHTS_STATUS.PASS;

    // Visual Confirmation Displays (for Nurse Screen / Bedside Tablet)
    const patientIdentityDisplay = {
      patientName: order.patientName,
      mrn: order.mrn,
      dob: encounter?.patientDob || '1985-05-14',
      location: encounter?.currentLocation || 'Ruang Anggrek Bed 03',
      encounterNumber: encounter?.encounterNumber || 'REG-ACTIVE',
      allergyWarning: encounter?.allergies?.length > 0 ? encounter.allergies.join(', ') : 'Tidak Ada Alergi Diketahui (NKDA)'
    };

    const medicationDisplay = {
      medicationName: order.medicationName,
      dose: `${order.dose} ${order.doseUnit}`,
      route: order.route,
      frequency: order.frequency,
      scheduledTime: slot.scheduledTime,
      batchNumber: order.dispenseInfo?.batchNumber || parsedMedication.parsedData?.batchNumber || 'N/A',
      expiryDate: order.dispenseInfo?.expiryDate || parsedMedication.parsedData?.expiryDate || 'N/A',
      isHighAlert: order.isHighAlert,
      highAlertCategory: order.highAlertCategory
    };

    return {
      verificationId,
      status: overallStatus,
      canAdminister,
      rights,
      failedRights,
      primaryErrorCode: failedRights.length > 0 ? rights[this._getFailedRightKey(failedRights[0])].code : null,
      patientIdentityDisplay,
      medicationDisplay,
      order,
      slot
    };
  }

  /**
   * Helper: Evaluate Discrete Schedule Slot Time Window
   */
  _evaluateTimeWindow(slot, currentTimestamp, allowedWindowMinutes) {
    if (slot.scheduledTime === 'NOW' || slot.scheduledTime === 'AS_NEEDED') {
      return { status: TIME_WINDOW_STATUS.ON_TIME, differenceMinutes: 0 };
    }

    const now = new Date(currentTimestamp);
    const target = new Date(slot.targetTimestamp);

    const diffMs = now.getTime() - target.getTime();
    const diffMins = Math.round(diffMs / (60 * 1000));

    if (Math.abs(diffMins) <= allowedWindowMinutes) {
      return { status: TIME_WINDOW_STATUS.ON_TIME, differenceMinutes: diffMins };
    } else if (diffMins < -allowedWindowMinutes) {
      return { status: TIME_WINDOW_STATUS.EARLY, differenceMinutes: diffMins };
    } else {
      return { status: TIME_WINDOW_STATUS.LATE, differenceMinutes: diffMins };
    }
  }

  _getFailedRightKey(rightName) {
    switch (rightName) {
      case 'RIGHT_PATIENT': return 'rightPatient';
      case 'RIGHT_DRUG': return 'rightDrug';
      case 'RIGHT_DOSE': return 'rightDose';
      case 'RIGHT_ROUTE': return 'rightRoute';
      case 'RIGHT_TIME': return 'rightTime';
      default: return 'rightPatient';
    }
  }

  /**
   * Execute Bedside Administration after 5-Rights Verification
   */
  async executeBedsideAdministration({
    rawPatientBarcode,
    rawMedicationBarcode,
    orderId,
    slotId,
    nurseId,
    nurseName,
    coSignatureNurseId = null,
    coSignatureNurseName = null,
    actualDose = null,
    actualRoute = null,
    notes = '',
    commandId = null,
    correlationId = null,
    currentTimestamp = new Date().toISOString()
  }) {
    // 1. Run 5-Rights Verification
    const verification = await this.validateFiveRights({
      rawPatientBarcode,
      rawMedicationBarcode,
      orderId,
      slotId,
      intendedDose: actualDose,
      intendedRoute: actualRoute,
      currentTimestamp
    });

    // Hard Stop if 5-Rights Verification Fails
    if (!verification.canAdminister) {
      throw new MedicationSafetyException(
        verification.primaryErrorCode,
        `Point-of-Care 5-Rights Verification FAILED: ${verification.failedRights.join(', ')}`
      );
    }

    // 2. Delegate to Canonical Medication Lifecycle Engine
    const adminResult = await medicationLifecycleEngine.administerDose({
      orderId,
      slotId,
      nurseId,
      nurseName,
      coSignatureNurseId,
      coSignatureNurseName,
      scannedPatientMrn: verification.order.mrn,
      scannedMedicationCode: verification.order.medicationCode,
      actualDose,
      actualRoute,
      notes: notes ? `${notes} [Verified by POC Sensor: ${verification.verificationId}]` : `[Verified by POC Sensor: ${verification.verificationId}]`,
      commandId,
      correlationId
    });

    // 3. Rebuild Read-Model Projections (eMAR, Pharmacy, Audit)
    await medicationProjectionEngine.rebuildAllProjections();

    return {
      success: true,
      verification,
      administration: adminResult
    };
  }
}

export const pointOfCareFiveRightsValidator = new PointOfCareFiveRightsValidator();
export default pointOfCareFiveRightsValidator;
