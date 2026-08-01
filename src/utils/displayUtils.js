/**
 * Centralized Display Utilities
 * Digunakan untuk menstandarkan format tampilan di seluruh modul (DRY Principle).
 */

/**
 * Format nama pasien dengan fallback yang elegan jika data belum ter-load/tidak ditemukan.
 * Menghindari munculnya raw UUID di UI.
 * 
 * @param {string} patientId - UUID dari pasien
 * @param {Array} patientsList - Array objek pasien dari store
 * @param {Function} calculateAge - Fungsi opsional untuk menghitung umur
 * @param {Function} t - Fungsi translasi (opsional, untuk kata 'years' dsb)
 * @returns {string} - String nama yang diformat atau string fallback
 */
export const formatPatientName = (patientId, patientsList = [], calculateAge = null, t = null) => {
  if (!patientId) return '—';
  
  const p = patientsList.find(p => p.id === patientId);
  if (p) {
    if (calculateAge && t && p.demographics?.dob) {
      return `${p.mrn || p.id.slice(0, 6)} — ${p.name} (${calculateAge(p.demographics.dob)} ${t('common.years')})`;
    }
    return `${p.mrn || p.id.slice(0, 6)} — ${p.name}`;
  }
  
  return `Pasien Tidak Ditemukan (${patientId.slice(0, 6)}...)`;
};
