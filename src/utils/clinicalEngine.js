/**
 * Clinical Decision Support System (CDSS) Engine
 * Core logic for clinical safety, calculations, and intelligent guardrails.
 */

/**
 * Mendeteksi konflik antara obat yang diresepkan dan alergi pasien.
 * @param {string} medicationName - Nama obat yang akan diresepkan.
 * @param {string[]} patientAllergies - Daftar alergi pasien.
 * @returns {boolean} - True jika ada konflik.
 */
export const checkAllergyConflict = (medicationName, patientAllergies = []) => {
  if (!medicationName || !patientAllergies.length) return false;

  const normalizedMed = medicationName.trim().toLowerCase();
  
  return patientAllergies.some(allergy => {
    const normalizedAllergy = allergy.trim().toLowerCase();
    
    // Exact match or partial match (e.g. "Amoxicillin" matches "Penicillin" class if logic expanded)
    // For V1, we do strict string inclusion
    return normalizedMed.includes(normalizedAllergy) || normalizedAllergy.includes(normalizedMed);
  });
};

/**
 * Validasi apakah seluruh daftar resep aman bagi pasien.
 * @param {Object[]} prescriptions - Daftar objek medikasi.
 * @param {string[]} patientAllergies - Daftar alergi pasien.
 * @returns {Object[]} - Daftar konflik yang ditemukan.
 */
export const detectAllergyConflicts = (prescriptions = [], patientAllergies = []) => {
  return prescriptions
    .filter(med => checkAllergyConflict(med.medication_name, patientAllergies))
    .map(med => med.medication_name);
};
