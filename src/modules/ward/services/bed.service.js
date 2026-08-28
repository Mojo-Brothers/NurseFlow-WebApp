/**
 * Bed Domain — Service Layer (PostgreSQL 16 Authoritative)
 * Visual Ward Management & Inpatient ADT Logic (Admission, Discharge, Transfer).
 * Standards: Joint Commission International (JCI), OCC Versioning, ACID Transactions
 */

import { apiClient, requestApi } from '../../../core/apiClient.js';
import { assertClinicalContextLock } from '../../../core/clinicalRuntimeSafetyContract.js';

/**
 * Mengambil daftar seluruh tempat tidur di bangsal langsung dari PostgreSQL 16.
 */
export const getAllBeds = async (filters = {}) => {
  try {
    const res = await apiClient.beds.list(filters);
    if (res.ok && res.data) {
      const beds = Array.isArray(res.data) ? res.data : (res.data.data || []);
      return beds.map(b => ({
        id: b.id,
        bed_name: b.bed_number || b.bed_name || `Bed ${b.id}`,
        ward: b.ward_name || b.ward || 'Bangsal Umum',
        is_occupied: b.status === 'OCCUPIED' || b.is_occupied === true,
        status: b.status || (b.is_occupied ? 'OCCUPIED' : 'AVAILABLE'),
        patient_name: b.patient_name || null,
        mrn: b.mrn || null,
        gender: b.gender || null,
        dpjp: b.dpjp_name || b.dpjp || null,
        version: b.version || 1
      }));
    }
    return [];
  } catch (err) {
    console.error('[BedService] Failed to fetch beds from PostgreSQL:', err);
    return [];
  }
};

/**
 * Menempatkan pasien ke Bed tertentu (ADT Assignment).
 */
export const assignBed = async (bedId, encounterId, patientId, userEmail = 'Petugas Admisi') => {
  assertClinicalContextLock({ patientId, encounterId, actorId: userEmail, role: 'NURSE' });

  const payload = {
    bedId,
    encounterId,
    patientId,
    assignedBy: userEmail
  };

  const res = await apiClient.beds.admit(payload);
  if (!res.ok) {
    if (res.isConcurrentConflict || res.status === 409) {
      const conflictErr = new Error('Konflik ADT (409): Ranjang telah ditempati oleh pasien lain.');
      conflictErr.isConcurrentConflict = true;
      throw conflictErr;
    }
    throw new Error(res.error || 'Gagal menempatkan pasien ke ranjang di PostgreSQL');
  }

  return res.data;
};

/**
 * Memindahkan pasien ke Bed lain (ADT Transfer).
 */
export const transferBed = async ({ sourceBedId, targetBedId, encounterId, patientId, reason, userEmail = 'Perawat Ruangan' }) => {
  assertClinicalContextLock({ patientId: patientId || 'PATIENT_CTX', encounterId, actorId: userEmail, role: 'NURSE' });

  const payload = {
    sourceBedId,
    targetBedId,
    encounterId,
    transferReason: reason || 'Transfer antar bangsal',
    transferredBy: userEmail
  };

  const res = await apiClient.beds.transfer(payload);
  if (!res.ok) {
    throw new Error(res.error || 'Gagal memindahkan pasien antar ranjang di PostgreSQL');
  }

  return res.data;
};

/**
 * Melepaskan Bed (Discharge ADT).
 */
export const releaseBed = async (bedId, encounterId = 'ENC_DISCHARGE', patientId = 'PATIENT_DISCHARGE', userEmail = 'Petugas Admisi') => {
  assertClinicalContextLock({ patientId, encounterId, actorId: userEmail, role: 'NURSE' });

  const payload = {
    bedId,
    dischargeReason: 'Discharge resmi pasien',
    dischargedBy: userEmail
  };

  const res = await apiClient.beds.discharge(payload);
  if (!res.ok) {
    throw new Error(res.error || 'Gagal melepaskan ranjang di PostgreSQL');
  }

  return res.data;
};
