# NurseFlow Role & Permission Matrix (RBAC & ABAC)
## Matriks Hak Akses Rumah Sakit, Pemetaan Otoritas Klinis & Penegakan Keamanan Multi-Layer

> **Status Dokumen:** RATIFIED AUDIT BASELINE  
> **Klasifikasi:** Dokumen Tata Kelola Keamanan & Otorisasi (Security & Access Governance)  
> **Standar Kepatuhan:** ISO 27001, HIPAA Security Rule, Permenkes 24/2022 (Kerahasiaan RME), UU Perlindungan Data Pribadi (UU PDP No. 27/2022).

---

## 1. Temuan Forensik: Disparitas Sistem Hak Akses Saat Ini

NurseFlow saat ini memiliki **3 sistem pendefinisian hak akses yang saling bertentangan (Tri-Conflict Roles)**:

```
┌─────────────────────────────────────────────────┐
│              SISTEM 1 (Frontend SSOT)           │
│       src/shared/constants/roles.js             │
│ Format: ROLE_DOCTOR_DPJP, ROLE_NURSE, etc.      │
└───────────────────────┬─────────────────────────┘
                        │ CONFLICT!
┌───────────────────────▼─────────────────────────┐
│              SISTEM 2 (Master Data Seed)        │
│   src/modules/master_data/data/permissions...   │
│ Format: DOCTOR, NURSE, CASHIER, HRD, etc.       │
└───────────────────────┬─────────────────────────┘
                        │ CONFLICT!
┌───────────────────────▼─────────────────────────┐
│              SISTEM 3 (Backend Middleware)      │
│       server/middlewares/rbacMiddleware.js      │
│ Melakukan hardcoded alias mapping:              │
│ if (r === 'DOCTOR' && role.includes('ROLE_...)) │
└─────────────────────────────────────────────────┘
```

### Kesenjangan Penegakan Keamanan:
1. **Frontend Navigation Leak:** Pada `MainLayout.jsx` dan file routing, sebagian besar rute hanya memeriksa status login pengguna tanpa memeriksa hak izin granular (`permissions`). Seorang pengguna dengan role `CASHIER` atau `HRD` dapat membuka halaman EMR atau Kamar Bedah hanya dengan mengetikkan URL langsung.
2. **Ketiadaan Row-Level Security (RLS) di Database:** Tabel-tabel sensitif seperti `master_patients`, `soap_notes`, dan `billing_invoices` di PostgreSQL **TIDAK memiliki RLS aktif** untuk memisahkan hak akses dokter terhadap pasien yang bukan tanggung jawabnya, atau memisahkan data antar-tenant secara kriptografis/kebijakan RDBMS.
3. **Ketiadaan Clinical Privilege Boundary:** Tidak ada pembedaan hak input resep antara dokter umum, dokter spesialis, dan perawat. Di beberapa modul, perawat dapat menandatangani dokumen CPPT dokter.

---

## 2. Matriks Otoritas 17 Persona Rumah Sakit (Single Source of Truth)

Tabel berikut menetapkan batas kewenangan definitif untuk 17 persona rumah sakit di NurseFlow:

| Persona Rumah Sakit | Kode Role Tunggal (SSOT) | Apa yang Dilihat (View/Read) | Apa yang Dibuat (Create) | Apa yang Diedit (Update) | Hak Persetujuan (Approve) | Hak Tanda Tangan (Sign) | Hak Pembatalan (Cancel/Void) | Hak Review (Audit) | Akses Terlarang (Strictly Forbidden) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Petugas Pendaftaran** | `ROLE_REGISTRATION_CLERK` | Data demografi pasien, jadwal dokter, status antrean, kamar rawat inap tersedia. | Pasien baru, appointment, tiket antrean, encounter awal. | Data identitas, alamat, kontak darurat pasien. | - | Lembar General Consent admisi. | Pembatalan nomor antrean loket. | Laporan kunjungan harian pendaftaran. | Catatan medis EMR/SOAP, hasil lab/rad, formasi obat, tagihan kasir. |
| **2. Perawat Klinis** | `ROLE_NURSE` | EMR pasien aktif di bangsal/unitnya, vital sign, order dokter, eMAR. | Triage, asuhan keperawatan harian, input vital sign, eMAR log, transfer bed request. | Catatan keperawatan (sebelum shift berakhir). | - | Dokumentasi SBAR Handover, pengkajian keperawatan. | Order keperawatan internal. | EWS chart, lembar observasi cairan. | Order resep obat baru, rilis hasil lab/rad, billing payment, hapus riwayat medis. |
| **3. Dokter DPJP** | `ROLE_DOCTOR_DPJP` | Riwayat lengkap EMR pasien, hasil lab/rad/pacs, riwayat obat, catatan perawat. | SOAP, CPOE (Resep, Lab, Rad), rencana operasi, rencana pemulangan (Discharge Plan). | Catatan medis miliknya (sebelum di-sign/lock). | Verifikasi CPPT kolaboratif, acc rujuk/pindah bed. | CPPT, Resume Medis Pulang, Informed Consent, Resep Digital. | Pembatalan CPOE miliknya (alasan klinis wajib). | Riwayat kepatuhan terapi, trend vital signs. | Modifikasi tarif RS, penerimaan pembayaran kasir, setup inventori gudang. |
| **4. Dokter Jaga IGD** | `ROLE_DOCTOR_EMERGENCY` | EMR pasien IGD, hasil cito diagnostik, ketersediaan bed isolasi/ICU/OK. | SOAP gawat darurat, order cito lab/rad, terapi resusitasi, perintah rawat inap/rujuk. | Catatan gawat darurat miliknya. | Eskalasi Code Blue, disposisi admisi rawat inap. | Asesmen gawat darurat, surat kematian, rujukan luar. | Order cito IGD yang salah input. | Dashboard pemantauan pasien observasi IGD. | Tagihan kasir, payroll staf, konfigurasi master sistem. |
| **5. Apoteker Klinis** | `ROLE_PHARMACIST` | Resep dokter, profil alergi pasien, hasil lab fungsi ginjal/hati, stok depo farmasi. | Catatan konseling obat, pengkajian resep (telaah klinis/administratif), etiket. | Catatan rekonsiliasi obat, saldo penyesuaian stok depo. | Verifikasi resep dokter, telaah interaksi obat/LASA. | Surat penyerahan obat narkotika, lembar konseling. | Penolakan resep tidak rasional / kontraindikasi. | Mutasi stok depo, laporan penggunaan antibiotik. | Menulis diagnosa SOAP, mengubah hasil tes laboratorium. |
| **6. Analis Laboratorium** | `ROLE_LAB_ANALYST` | Order pemeriksaan lab, data klinis relevan (diagnosa kerja), status spesimen. | Accession number spesimen, input hasil pemeriksaan analitik lab. | Hasil lab (sebelum diverifikasi dan dirilis). | - | Rilis hasil lab normal/abnormal. | Pembatalan spesimen lisis/rusak (re-reject). | Kontrol mutu reagen (QC/Westgard Rules). | Mengubah resep obat, melihat data keuangan billing pasien secara detail. |
| **7. Radiografer & Radiolog** | `ROLE_RADIOGRAPHER` | Order radiologi, klinis pengantar, arsip gambar modalitas PACS/DICOM. | Hasil interpretasi ahli/expertise bacaan rontgen/CT/MRI. | Draf bacaan radiologi (sebelum divalidasi). | - | Lembar ekspertise hasil radiologi resmi. | Pembatalan pemeriksaan radiologi yang gagal/kontraindikasi. | Audit paparan radiasi, kalibrasi alat. | Input asuhan keperawatan, memungut pembayaran kasir. |
| **8. Kasir Rumah Sakit** | `ROLE_CASHIER` | Tagihan terverifikasi pasien, rincian biaya tindakan/obat, plafon penjamin. | Kuitansi pembayaran, bukti setor kasir per shift. | Data pembayaran (sebelum kuitansi difinalisasi). | - | Kuitansi pelunasan resmi, bukti deposit. | Void transaksi pembayaran (wajib supervisor approval). | Rekapitulasi penerimaan uang kasir harian. | Membaca catatan SOAP dokter, mengubah tarif pelayanan secara mandiri. |
| **9. Petugas Billing & Asuransi** | `ROLE_BILLING_OFFICER` | Seluruh charge capture pelayanan, dokumen pendukung medis (resume, lab). | Invoice tagihan, klaim asuransi swasta, berkas penjaminan. | Penyesuaian diskon tarif terotorisasi, split-billing. | Verifikasi kelayakan berkas tagihan. | Lembar rincian biaya perawatan. | Void charge item yang tidak terealisasi (dengan memo klinis). | Audit selisih biaya (*cost containment*). | Menulis catatan terapi medis, mengubah stock gudang. |
| **10. Petugas Gudang Farmasi** | `ROLE_WAREHOUSE_OFFICER` | Data stok master obat/alkes, Purchase Order dari procurement, permintaan unit. | Bukti penerimaan barang (Goods Receipt), bukti mutasi stok ke depo. | Data lot/batch number dan tanggal kedaluwarsa fisik. | Approval penerimaan fisik barang supplier. | Surat bukti pengeluaran barang gudang. | Pembatalan mutasi akibat barang rusak/cacat. | Laporan stok opname, monitoring kartu stok FEFO. | Membuka rekam medis pasien, mengakses transaksi kasir. |
| **11. Petugas Pengadaan** | `ROLE_PROCUREMENT_OFFICER` | Material request unit, daftar vendor supplier, harga kontrak, saldo stok gudang. | Purchase Request (PR), Purchase Order (PO), Surat Perjanjian Pengadaan. | Draf PO ke supplier. | - | Lembar Purchase Order ke rekanan vendor. | Pembatalan PO yang melewati SLA supplier. | Evaluasi performa vendor / lead time. | Melihat riwayat penyakit pasien, memproses pembayaran tunai. |
| **12. Bagian Keuangan (Finance)** | `ROLE_FINANCE_MANAGER` | Buku besar akuntansi, laporan arus kas, rincian pendapatan departemen, utang/piutang. | Setup master tarif rumah sakit, jurnal umum, rekonsiliasi bank. | Master harga dan paket tarif pelayanan. | Otorisasi pengeluaran kas, approve write-off piutang macet. | Laporan keuangan audit rumah sakit. | Pembatalan invoice tagihan bermasalah. | Audit kepatuhan perpajakan dan pendapatan RS. | Melakukan intervensi pada data klinis pasien. |
| **13. SDM & Kredensial (HRD)** | `ROLE_HR_CREDENTIALS` | Master pegawai, status SIP/STR dokter, Surat Penugasan Klinis (SPK/RKK), roster shift. | Profil karyawan baru, penugasan unit kerja, pencatatan kredensial nakes. | Data kontak pegawai, status aktif/non-aktif staf. | Verifikasi keabsahan dokumen STR/SIP tenaga medis. | Surat rekomendasi kewenangan klinis. | Pencabutan hak akses pegawai yang resign/mutasi. | Kepatuhan masa berlaku SIP/STR staf medis. | Membaca berkas rahasia medis pasien di luar urusan legal/etik. |
| **14. Direksi / Manajemen** | `ROLE_EXECUTIVE_MANAGEMENT`| Dashboard eksekutif: BOR, LOS, TOI, NDR/GDR, pendapatan harian, insiden mutu. | Memo kebijakan rumah sakit, target operasional unit. | Parameter target KPI rumah sakit. | Pengesahan anggaran belanja modal (Capex/Opex). | Pengesahan laporan tahunan RS, dokumen akreditasi. | Pembatalan proyek strategis internal. | Audit komprehensif seluruh operasional rumah sakit. | Pengisian dokumen rekam medis pasien individual secara langsung. |
| **15. IT Administrator** | `ROLE_IT_ADMIN` | System audit logs, performa database, koneksi API bridging, user access directory. | Konfigurasi sistem, akun pengguna baru, backup policy, webhook integrasi. | Parameter koneksi database/server, mapping RBAC sistem. | Otorisasi reset password, migrasi schema database. | Berita acara maintenance sistem IT. | Terminasi sesi aktif mencurigakan (force logout). | Universal audit trail inspection. | Mengubah data rekam medis pasien di database tanpa jejak audit. |
| **16. Komite Mutu & Keselamatan**| `ROLE_QUALITY_OFFICER` | Laporan insiden keselamatan pasien (IKP), data PPI (HAIs), kepatuhan standar cuci tangan. | Analisis RCA (Root Cause Analysis), rekomendasi CAPA mutu. | Status tindak lanjut laporan insiden keselamatan. | Validasi grading risiko insiden (Merah/Kuning/Hijau). | Laporan mutu ke Kemenkes / KNKP. | - | Audit rekam medis terbuka untuk penilaian mutu. | Melakukan pelayanan medis atau transaksi kasir. |
| **17. Perekam Medis (RMIK)** | `ROLE_MEDICAL_RECORD_CODER`| Berkas EMR lengkap pasca-pulang, laporan operasi, resume medis dokter. | Kode diagnosa ICD-10, kode prosedur ICD-9-CM, klaim INA-CBGs E-Klaim. | Koreksi kodefikasi morbiditas/mortalitas. | Kelengkapan resume medis sebelum assembling/arsip. | Lembar pengesahan berkas klaim BPJS / Asuransi. | Pembatalan berkas klaim salah group. | Audit kelengkapan pengisian rekam medis (KLPCM). | Menghapus riwayat klinis yang telah dikunci dokter. |

---

## 3. Matriks Penegakan Keamanan Teknis (Technical Enforcement)

Untuk memastikan hak akses tidak sekadar menjadi label kosmetik di layar pengguna, NurseFlow wajib menerapkan penegakan pada **3 Lapisan Arsitektur**:

### Lapisan 1: Frontend Route & Component Guard (Client Level)
- Menggunakan komponen pembungkus `<RoleProtectedGuard allowedRoles={[...]} requiredPermission="...">`.
- Menu navigasi pada sidebar (`MainLayout.jsx`) disaring secara dinamis. Jika pengguna tidak memiliki izin, menu tersebut **tidak dirender sama sekali** di DOM untuk mencegah *information disclosure*.

### Lapisan 2: Backend API & Route Middleware (Gateway Level)
- Menggunakan middleware terpadu:
  ```javascript
  // Contoh penerapan pada router Express
  router.post('/api/v1/emr/documents/:id/sign', 
    authenticateJwt, 
    requireRole(['ROLE_DOCTOR_DPJP', 'ROLE_DOCTOR_EMERGENCY']),
    requirePermission('EMR_SIGN_DOCUMENT'),
    signClinicalDocumentController
  );
  ```
- Setiap pelanggaran akses menghasilkan respon standar **RFC 7807 (HTTP 403 Forbidden)** dengan correlation ID yang tercatat pada log keamanan.

### Lapisan 3: Database Constraints & Row-Level Security (PostgreSQL Level)
- Mengaktifkan PostgreSQL Row-Level Security (RLS) pada tabel klinis:
  ```sql
  -- Mengaktifkan RLS pada tabel dokumen klinis
  ALTER TABLE clinical_documents ENABLE ROW LEVEL SECURITY;

  -- Kebijakan: Dokter hanya dapat memperbarui draf buatannya sendiri
  CREATE POLICY doctor_edit_own_draft ON clinical_documents
      FOR UPDATE
      USING (
          author_user_id = current_setting('app.current_user_id')::UUID 
          AND is_locked = FALSE
      );
  ```

---

## 4. Rencana Penyatuan & Konsolidasi (Stage 2 Remediasi)

1. **Konsolidasi File Master:** Menjadikan `src/shared/constants/roles.js` sebagai acuan nama role kanonikal berformat `ROLE_*`.
2. **Pembersihan Database:** Menyelaraskan isi tabel `roles` dan `role_permissions` di PostgreSQL agar 100% cocok dengan kode peran di atas.
3. **Penghapusan Hardcoded Aliases:** Menghilangkan pemetaan toleran (*loose fallback mapping*) pada `server/middlewares/rbacMiddleware.js` baris 106-115, dan mewajibkan token JWT membawa role kanonikal yang sah.
