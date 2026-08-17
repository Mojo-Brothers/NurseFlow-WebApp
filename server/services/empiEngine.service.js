/**
 * NurseFlow Enterprise HIS 2026 — Enterprise Master Patient Index (EMPI) Engine
 * Standar: ISO/TS 22220 Health Informatics — Identification of Subjects of Health Care
 * Features: Deterministic Matching, Levenshtein Fuzzy Scoring, Merge & Split with Audit
 */

export const empiEngineService = {
  /**
   * Calculate string similarity score (0.0 to 1.0) using Levenshtein distance
   */
  calculateSimilarity: (str1 = '', str2 = '') => {
    const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    if (s1 === s2) return 1.0;
    if (!s1 || !s2) return 0.0;

    const track = Array(s2.length + 1).fill(null).map(() =>
      Array(s1.length + 1).fill(null));
    for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
    for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = track[s2.length][s1.length];
    const maxLength = Math.max(s1.length, s2.length);
    return Math.max(0, 1 - (distance / maxLength));
  },

  /**
   * Evaluate Potential Duplicate Patient in MPI Database
   */
  detectDuplicates: (candidate, existingPatients = []) => {
    const potentialMatches = [];

    for (const existing of existingPatients) {
      // 1. Exact Match on NIK (100% Certainty)
      if (candidate.nik && existing.nik && candidate.nik === existing.nik) {
        potentialMatches.push({
          patient: existing,
          matchType: 'EXACT_NIK',
          matchScore: 100,
          actionRequired: 'MERGE_OR_REJECT'
        });
        continue;
      }

      // 2. Exact Match on BPJS Card
      if (candidate.bpjsCardNumber && existing.bpjsCardNumber && candidate.bpjsCardNumber === existing.bpjsCardNumber) {
        potentialMatches.push({
          patient: existing,
          matchType: 'EXACT_BPJS',
          matchScore: 98,
          actionRequired: 'MERGE_OR_LINK'
        });
        continue;
      }

      // 3. Fuzzy Name Match + Same Birthdate + Same Gender
      const nameScore = empiEngineService.calculateSimilarity(
        candidate.fullName || candidate.full_name,
        existing.fullName || existing.full_name
      );

      const candidateDob = new Date(candidate.birthDate || candidate.birth_date).toISOString().split('T')[0];
      const existingDob = new Date(existing.birthDate || existing.birth_date).toISOString().split('T')[0];
      const sameDob = candidateDob === existingDob;
      const sameGender = (candidate.gender || '').toUpperCase() === (existing.gender || '').toUpperCase();

      if (nameScore >= 0.75 && sameDob && sameGender) {
        const compositeScore = Math.round((nameScore * 0.7 + 0.3) * 100);
        potentialMatches.push({
          patient: existing,
          matchType: 'PROBABILISTIC_FUZZY',
          matchScore: compositeScore,
          actionRequired: compositeScore >= 85 ? 'MANUAL_REVIEW_MERGE' : 'SUSPICIOUS_DUPLICATE'
        });
      }
    }

    return potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
  },

  /**
   * Merge Secondary Patient into Primary Patient
   */
  mergePatients: ({ primaryPatient, secondaryPatient, mergedBy, reason = 'Penyatuan duplikasi data rekam medis' }) => {
    if (primaryPatient.id === secondaryPatient.id) {
      throw new Error('Tidak dapat menggabungkan pasien dengan dirinya sendiri.');
    }

    return {
      success: true,
      masterMrn: primaryPatient.mrn,
      retiredMrn: secondaryPatient.mrn,
      mergedAt: new Date().toISOString(),
      mergedBy,
      reason,
      auditLog: {
        eventType: 'PATIENT_EMPI_MERGE',
        primaryPatientId: primaryPatient.id,
        secondaryPatientId: secondaryPatient.id
      }
    };
  }
};
