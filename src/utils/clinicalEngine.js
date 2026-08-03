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
  if (!medicationName || !patientAllergies || !patientAllergies.length) return false;

  const normalizedMed = String(medicationName).trim().toLowerCase();
  
  return patientAllergies.some(allergy => {
    if (!allergy) return false;
    const allergyText = typeof allergy === 'string' 
      ? allergy 
      : (allergy.agent || allergy.name || allergy.allergen || allergy.substance || '');
    
    if (!allergyText) return false;
    const normalizedAllergy = String(allergyText).trim().toLowerCase();
    
    // Check if medicine matches entire allergy string or sub-agents (e.g. "Amoxicillin / Penicillin")
    const subAgents = normalizedAllergy.split(/[\/,+]/).map(s => s.trim()).filter(Boolean);
    return subAgents.some(sub => normalizedMed.includes(sub) || sub.includes(normalizedMed)) ||
           normalizedMed.includes(normalizedAllergy) || 
           normalizedAllergy.includes(normalizedMed);
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
