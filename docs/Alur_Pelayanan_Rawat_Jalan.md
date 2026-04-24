# Alur Pelayanan Rawat Jalan (Outpatient) NurseFlow HIS
*Dokumen Standar Operasional & Penggunaan Sistem (JCI Compliant)*

Dokumen ini menjelaskan alur simulasi nyata *(end-to-end)* dari mulai pasien baru mendaftar hingga pasien pulang dari layanan Rawat Jalan (Poliklinik) menggunakan sistem NurseFlow HIS.

---

## FASE 1: Registrasi & Pendaftaran (Front Office / Admisi)
**Aktor:** Staf Pendaftaran (Admin)
**Lokasi UI:** `http://localhost:5174/patients` (Patient Directory) -> Registrasi Pasien

1. **Identifikasi Pasien (JCI IPSG 1):** 
   - Tanyakan identitas ganda: NIK (Nomor Induk Kependudukan) dan Nama Lengkap.
   - Klik tombol **"New Admission"** di pojok kanan atas.
2. **Pengisian Demografi:**
   - Masukkan data diri pasien. Sistem secara otomatis akan men-generate Medical Record Number (MRN).
3. **Pembuatan Encounter (Kunjungan):**
   - Setelah pasien terdaftar, klik profil pasien dan buat *Encounter* baru.
   - Pilih jenis layanan: **Rawat Jalan (Outpatient)**.
   - Pilih **Poliklinik Tujuan** (contoh: Poli Penyakit Dalam).
   - *Status Encounter:* `PLANNED` atau `ARRIVED`.

---

## FASE 2: Triage & Asesmen Awal Keperawatan
**Aktor:** Perawat Poliklinik (Nurse)
**Lokasi UI:** `http://localhost:5174/triage` atau `http://localhost:5174/emr-rj`

1. **Penerimaan Pasien:**
   - Perawat melihat pasien muncul di **Worklist** antrean Poli.
   - Panggil pasien dan pastikan identitas (Double Check: Nama & Tgl Lahir/MRN).
2. **Pengukuran Tanda Vital (Triage):**
   - Buka **Modul e-MR** pasien tersebut.
   - Masukkan Tanda-Tanda Vital (TTV): Tekanan Darah, Nadi, Suhu, Pernapasan, SpO2.
   - Sistem akan mengkalkulasi **Skor EWS / NEWS2** secara otomatis. Jika skor merah (kritis), sistem memberi peringatan eskalasi.
3. **Asesmen Nyeri & Risiko Jatuh:**
   - Isi form skala nyeri (VAS/Wong-Baker).
   - Isi form risiko jatuh (Morse Fall Scale / Humpty Dumpty). Pasang gelang kuning virtual jika risiko tinggi (IPSG 6).
   - *Status Encounter:* `TRIAGE`.

---

## FASE 3: Pemeriksaan Medis (Konsultasi Dokter)
**Aktor:** Dokter Spesialis (Doctor)
**Lokasi UI:** `http://localhost:5174/emr-rj` (Outpatient EMR)

1. **Review Data Perawat:**
   - Dokter membuka dashboard EMR-RJ pasien.
   - Di bagian **ClinicalCard (Bento Grid)**, dokter me-review Tanda Vital, alergi, dan anamnesa yang diinput perawat.
2. **Pencatatan SOAP (Subjective, Objective, Assessment, Plan):**
   - **Subjective & Objective:** Hasil wawancara klinis tambahan dan pemeriksaan fisik.
   - **Assessment (Diagnosa):** Dokter mengetik **Diagnosa Kerja** dan mencari kode **ICD-10** (Diagnosa Utama).
   - **Plan (Tindakan/Resep/Rujukan):** Dokter menyusun rencana asuhan.
3. **Order Resep (e-Prescription) & Laboratorium:**
   - Masuk ke tab **Resep Online**. Dokter memilih obat, dosis, dan rute pemberian yang sudah divalidasi oleh sistem CDSS *(Clinical Decision Support System)* untuk mencegah interaksi obat (IPSG 3 - High Alert Medications).
   - Jika butuh cek darah, dokter masuk ke tab **Laboratorium** dan membuat *Lab Order*.
   - *Status Encounter:* `IN_PROGRESS` -> `READY_FOR_DISCHARGE`.

---

## FASE 4: Farmasi (Pengambilan Obat)
**Aktor:** Apoteker (Pharmacist)
**Lokasi UI:** `http://localhost:5174/pharmacy`

1. **Validasi Resep:**
   - Resep elektronik dari poli langsung masuk ke antrean Farmasi.
   - Apoteker melakukan telaah resep (kejelasan instruksi, alergi pasien, kontraindikasi).
2. **Dispensing & Edukasi:**
   - Obat disiapkan (jika ada obat *High Alert*, sistem meminta *Double Check* dari apoteker lain).
   - Obat diserahkan ke pasien dengan edukasi cara minum (PIO).
   - Apoteker menekan tombol "Resep Selesai".

---

## FASE 5: Kepulangan & Kasir (Billing)
**Aktor:** Kasir / FO Rawat Jalan
**Lokasi UI:** `http://localhost:5174/billing`

1. **Rekapitulasi Tagihan:**
   - Pasien menuju kasir. Kasir membuka halaman Billing.
   - Sistem mengumpulkan data dari semua modul:
     - Biaya Pendaftaran / Konsultasi Dokter
     - Biaya Obat dari Farmasi
     - Biaya Tindakan / Lab (jika ada)
2. **Penyelesaian Pembayaran & Discharge:**
   - Pasien melakukan pembayaran (Asuransi/Pribadi).
   - Kasir mencetak kuitansi dan menekan tombol **"Discharge Patient"**.
3. **Penyelesaian Berkas EMR:**
   - Status Encounter berubah menjadi `DISCHARGED` / Selesai.
   - Rekam medis elektronik untuk sesi ini dikunci (hanya bisa dibaca / *read-only*) dan tercatat di **Audit Trail** untuk keperluan akreditasi JCI.

---
**Catatan Penting Akreditasi JCI:**
- Setiap tombol "Simpan" di semua modul EMR selalu men-trigger fungsi **Audit Trail** di *background*, menyimpan log `siapa, kapan, dan apa` yang diubah.
- Pasien tidak bisa di-Discharge jika *informed consent* atau peringatan kritis belum ditangani.
