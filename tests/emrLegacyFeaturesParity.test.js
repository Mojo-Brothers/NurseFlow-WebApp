import { describe, it, expect, beforeEach } from 'vitest';
import { emrSupportingDocsService } from '../src/modules/emr/services/emrSupportingDocs.service.js';

// Polyfill mock localStorage in node test environment
if (typeof globalThis.localStorage === 'undefined') {
  let store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
}


describe('EMR Legacy Features Parity & Enterprise Service Suite', () => {
  beforeEach(() => {
    // Clear test localStorage keys
    globalThis.localStorage.clear();
  });


  describe('1. Dokter Dokumen Alert (SIP & STR Expiration Checker)', () => {
    it('harus memicu alert jika STR atau SIP akan berakhir dalam <= 3 bulan', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45); // ~1.5 months ahead
      const dateStr = futureDate.toISOString().slice(0, 10);

      const status = emrSupportingDocsService.checkDoctorCredentials({
        name: 'dr. Budi Santoso, Sp.B',
        strNumber: '31.1.1.100.2.21.145892',
        strExpiryDate: dateStr,
        sipNumber: '503/SIP-D/2021',
        sipExpiryDate: '2028-12-31'
      });

      expect(status.hasAlert).toBe(true);
      expect(status.alerts.length).toBe(1);
      expect(status.alerts[0].type).toBe('STR');
      expect(status.alerts[0].isExpired).toBe(false);
      expect(status.alerts[0].monthsRemaining).toBeLessThanOrEqual(3);
      expect(status.alerts[0].message).toContain('31.1.1.100.2.21.145892');
    });

    it('harus mendeteksi dokumen yang telah kadaluarsa', () => {
      const pastDate = '2025-01-01';
      const status = emrSupportingDocsService.checkDoctorCredentials({
        name: 'dr. Budi Santoso, Sp.B',
        strNumber: '31.1.1.100.2.21.145892',
        strExpiryDate: pastDate,
        sipNumber: '503/SIP-D/2021',
        sipExpiryDate: '2028-12-31'
      });

      expect(status.hasAlert).toBe(true);
      expect(status.alerts[0].isExpired).toBe(true);
      expect(status.alerts[0].message).toContain('telah kadaluarsa');
    });

    it('tidak memicu alert jika masa berlaku dokumen masih panjang (>3 bulan)', () => {
      const longFuture = '2029-01-01';
      const status = emrSupportingDocsService.checkDoctorCredentials({
        name: 'dr. Aman Sentosa, Sp.PD',
        strNumber: 'STR-999',
        strExpiryDate: longFuture,
        sipNumber: 'SIP-999',
        sipExpiryDate: longFuture
      });

      expect(status.hasAlert).toBe(false);
      expect(status.alerts.length).toBe(0);
    });
  });

  describe('2. Upload Dokumen Penunjang (Laboratory, Radiology, ECG, dll)', () => {
    it('dapat mengambil daftar dokumen penunjang default', () => {
      const docs = emrSupportingDocsService.getDocuments();
      expect(docs.length).toBeGreaterThanOrEqual(4);
      expect(docs.some(d => d.category === 'RADIOLOGY')).toBe(true);
      expect(docs.some(d => d.category === 'LABORATORY')).toBe(true);
    });

    it('dapat menambahkan dokumen penunjang baru dan memfilternya berdasarkan kategori', () => {
      const newDoc = emrSupportingDocsService.addDocument({
        title: 'Hasil Pemeriksaan USG Abdomen',
        category: 'RADIOLOGY',
        categoryLabel: 'Radiologi & Imaging',
        patientId: 'P_TEST_001',
        patientName: 'Bapak Uji Coba',
        mrn: 'MRN-TEST-01',
        fileName: 'USG_Abdomen_Test.pdf',
        fileSize: '2.5 MB'
      });

      expect(newDoc.id).toBeDefined();
      expect(newDoc.status).toBe('VERIFIED');

      const radiologyDocs = emrSupportingDocsService.getDocuments({ category: 'RADIOLOGY' });
      expect(radiologyDocs.some(d => d.id === newDoc.id)).toBe(true);

      const patientDocs = emrSupportingDocsService.getDocuments({ patientId: 'P_TEST_001' });
      expect(patientDocs.length).toBe(1);
      expect(patientDocs[0].title).toBe('Hasil Pemeriksaan USG Abdomen');
    });

    it('dapat menghapus dokumen penunjang', () => {
      const docsBefore = emrSupportingDocsService.getDocuments();
      const docToDelete = docsBefore[0];

      const ok = emrSupportingDocsService.deleteDocument(docToDelete.id);
      expect(ok).toBe(true);

      const docsAfter = emrSupportingDocsService.getDocuments();
      expect(docsAfter.some(d => d.id === docToDelete.id)).toBe(false);
    });
  });

  describe('3. Rujukan & Konsultasi Internal Inter-SMF', () => {
    it('dapat membuat rujukan internal baru dengan nomor rujukan berformat', () => {
      const ref = emrSupportingDocsService.createInternalReferral({
        originDepartment: 'Poli Bedah',
        referringDoctor: 'dr. Bedah, Sp.B',
        targetDepartment: 'Poli Jantung',
        consultantDoctor: 'dr. Jantung, Sp.JP',
        consultationType: 'CITO',
        clinicalDiagnosis: 'Apendisitis + HT Krisis',
        clinicalSummary: 'Rencana cito operasi laparotomi.',
        consultationQuestion: 'Mohon toleransi operasi jantung.'
      });

      expect(ref.id).toBeDefined();
      expect(ref.referralNo).toMatch(/^RUJ-INT\/\d{4}\/\d{2}\/\d{4}$/);
      expect(ref.status).toBe('WAITING_RESPONSE');
      expect(ref.consultationType).toBe('CITO');
    });

    it('dapat merespon rujukan internal dan memperbarui status menjadi COMPLETED', () => {
      const ref = emrSupportingDocsService.createInternalReferral({
        originDepartment: 'Poli Umum',
        referringDoctor: 'dr. Umum',
        targetDepartment: 'Poli Paru',
        clinicalDiagnosis: 'TB Paru Kasus Baru',
        consultationQuestion: 'Mohon advice regimen OAT.'
      });

      const updated = emrSupportingDocsService.respondInternalReferral(ref.id, {
        responseNotes: 'Setuju regimen 2RHZE/4RH dosis standar. Kontrol sputum akhir bulan ke-2.',
        responderName: 'dr. Paru, Sp.P',
        newStatus: 'COMPLETED'
      });

      expect(updated.status).toBe('COMPLETED');
      expect(updated.responseNotes).toContain('2RHZE/4RH');
      expect(updated.respondedBy).toBe('dr. Paru, Sp.P');
      expect(updated.respondedAt).toBeDefined();
    });
  });

  describe('4. Resep Online Counter & Shift Info', () => {
    it('mengembalikan jumlah resep online pending', () => {
      const count = emrSupportingDocsService.getPendingOnlinePrescriptionsCount();
      expect(count).toBeGreaterThan(0);
    });

    it('menghitung shift rumah sakit aktif secara valid', () => {
      const shift = emrSupportingDocsService.getCurrentHospitalShift();
      expect(['PAGI', 'SIANG', 'MALAM']).toContain(shift.shift);
      expect(shift.label).toContain('WIB');
      expect(shift.color).toBeDefined();
    });
  });

  describe('5. Laporan Bulanan UGD (Statistik & Distribusi Kasus)', () => {
    it('menghasilkan laporan bulanan UGD dengan metrik komprehensif', () => {
      const report = emrSupportingDocsService.getMonthlyUgdReport('2026-08');

      expect(report.totalVisits).toBeGreaterThan(0);
      expect(report.averageResponseTimeMinutes).toBeLessThanOrEqual(5); // Waktu tanggap triase < 5 menit
      expect(report.triageBreakdown.length).toBe(5); // 5 Level ATS/ESI
      expect(report.dispositionBreakdown.length).toBeGreaterThan(0);
      expect(report.top10Diagnoses.length).toBe(10); // 10 Besar Penyakit ICD-10
    });
  });

  describe('6. Worklist Rawat Jalan & Rawat Inap', () => {
    it('mengambil antrean pasien rawat jalan dengan data vital sign', () => {
      const rjList = emrSupportingDocsService.getOutpatientWorklist();
      expect(rjList.length).toBeGreaterThan(0);
      expect(rjList[0].queueNo).toBeDefined();
      expect(rjList[0].clinic).toBeDefined();
      expect(rjList[0].vitals).toBeDefined();
    });

    it('mengambil pasien rawat inap dengan data bed, kamar, dan skor EWS', () => {
      const riList = emrSupportingDocsService.getInpatientWorklist();
      expect(riList.length).toBeGreaterThan(0);
      expect(riList[0].ward).toBeDefined();
      expect(riList[0].bed).toBeDefined();
      expect(riList[0].acuityScore).toBeDefined();
      expect(riList[0].cpptStatusToday).toBeDefined();
    });
  });

  describe('7. Workspace Pemeriksaan Pasien RJ & Paritas 13 Tab Klinis (Legacy mid=393)', () => {
    it('mengembalikan daftar master departemen dan penjamin untuk modal pencarian', () => {
      const depts = emrSupportingDocsService.getDepartmentList();
      const payers = emrSupportingDocsService.getPayersList();
      expect(depts.length).toBeGreaterThanOrEqual(10);
      expect(payers.length).toBeGreaterThanOrEqual(5);
      expect(depts.some(d => d.id === 'MED-UGD')).toBe(true);
      expect(payers.some(p => p.id === 'BPJS')).toBe(true);
    });

    it('mengambil detail pemeriksaan pasien aktif dengan data 13 tab klinis lengkap', () => {
      const detail = emrSupportingDocsService.getExaminationDetail('P260907814');
      expect(detail.regId).toBe('P260907814');
      expect(detail.mrn).toBe('00360110');
      expect(detail.patientName).toBe('Tn. Budi Pratama');
      expect(detail.assessments.length).toBeGreaterThanOrEqual(3);
      expect(detail.medicalProfile.length).toBeGreaterThanOrEqual(2);
      expect(detail.laboratoryResults.length).toBeGreaterThanOrEqual(5);
      expect(detail.radiologyResults.length).toBeGreaterThanOrEqual(1);
      expect(detail.onlinePrescriptions.length).toBeGreaterThanOrEqual(2);
      expect(detail.examinationHistory.length).toBe(10);
      expect(detail.scannedExternalDocs.length).toBeGreaterThanOrEqual(4);
      expect(detail.icareJkn.bpjsNumber).toBeDefined();
    });

    it('dapat memperbarui diagnosa dan alergi pasien pada lembar pemeriksaan', () => {
      const updated = emrSupportingDocsService.updateExaminationDetail('P260907814', {
        workingDiagnosis: 'Obs. Febris H-5 ec DHF Konfirmasi',
        allergies: [{ allergen: 'Amoxicillin', reaction: 'Gatal dan Ruam', severity: 'SEDANG' }]
      });

      expect(updated.workingDiagnosis).toBe('Obs. Febris H-5 ec DHF Konfirmasi');
      expect(updated.allergies.length).toBe(1);
      expect(updated.allergies[0].allergen).toBe('Amoxicillin');
    });

    it('dapat mencari pasien secara multi-kriteria pada modal cari pasien', () => {
      const results = emrSupportingDocsService.searchPatientsComprehensive({
        mrn: 'MRN-2026-0922'
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].mrn).toBe('MRN-2026-0922');
    });
  });
});

