# Skenario Alur Nyata 2: Poliklinik Rawat Jalan (Kasus Elektif) 🏥

Panduan ini mendemonstrasikan bagaimana aplikasi NurseFlow HIS digunakan untuk manajemen alur rawat jalan (Poliklinik) sehari-hari yang membutuhkan pencatatan terstruktur dan kesinambungan perawatan (Continuity of Care).

## 📋 Konteks Kasus
Seorang wanita berusia 65 tahun datang ke Poliklinik Penyakit Dalam untuk kontrol rutin penyakit Diabetes Mellitus Tipe 2 dan Hipertensi. Pasien sudah memiliki rekam medis sebelumnya di rumah sakit ini.

---

## Tahap 1: Admisi & Cetak Antrean (Pendaftaran Rawat Jalan)

**Standar JCI:** Identifikasi pasien yang tepat (IPSG 1) menggunakan minimal 2 pengenal (Nama & Tanggal Lahir / MRN).

1. Buka modul **Patient Directory**.
2. Cari pasien menggunakan fitur pencarian berdasarkan Nomor Rekam Medis (MRN) atau nama.
3. Setelah profil pasien ditemukan, sistem akan menampilkan peringatan keamanan jika ada alergi obat yang tercatat sebelumnya (contoh: *Alergi: Penisilin*).
4. Petugas memverifikasi identitas pasien dengan menanyakan nama lengkap dan tanggal lahir.
5. Klik **[Create Encounter]** -> Pilih **Poliklinik Penyakit Dalam**, Dokter Tujuan, dan Jenis Pembayaran (Asuransi/Pribadi).
6. Keluhan Utama diisi singkat: `"Kontrol rutin DM & Hipertensi"`.
7. Pasien masuk ke daftar antrean poli terkait.

---

## Tahap 2: Asesmen Keperawatan Awal (Nurse Station Poli)

**Standar JCI:** Penilaian awal (Assessment of Patients) harus mencakup status fisik, psikososial, dan riwayat alergi.

1. Buka modul **EMR (Electronic Medical Record)** dengan role Perawat Poli.
2. Pilih pasien dari *Worklist* Poliklinik Penyakit Dalam.
3. Lakukan pengisian Tanda Vital (TTV) saat ini:
   * Tekanan Darah, Nadi, Suhu, Pernapasan.
   * **Berat Badan & Tinggi Badan** (Penting untuk perhitungan dosis obat dan evaluasi nutrisi).
4. **Verifikasi Alergi:** Perawat mengonfirmasi kembali layar *Alergi* yang menyala merah. "Ibu masih alergi Penisilin ya?" -> Centang *Verified*.
5. **Skrining Nyeri & Jatuh:** Lakukan skrining risiko jatuh (Morse Fall Scale / Get up and Go test) sesuai protokol.
6. Simpan data. Status pasien di layar antrean berubah dari "Menunggu Asesmen" menjadi "Siap Diperiksa Dokter".

---

## Tahap 3: Konsultasi Dokter & e-Prescription (Dokter Poli)

**Standar JCI:** Keterlibatan pasien dalam keputusan perawatan dan resep yang dapat dibaca dengan jelas (menghindari tulisan tangan).

1. Dokter memanggil pasien dan membuka rekam medis di modul **EMR**.
2. Di layar EMR, dokter langsung disuguhkan:
   * **Trend TTV:** Grafik tekanan darah dari kunjungan-kunjungan sebelumnya.
   * **Riwayat Obat:** Daftar obat kronis yang sedang dikonsumsi pasien.
   * **Hasil Lab Terakhir:** (Misalnya: HbA1c bulan lalu).
3. Dokter mengisi catatan SOAP (Subjective, Objective, Assessment, Plan).
4. Dokter masuk ke bagian **Medication / CPOE** untuk memberikan resep lanjutan:
   * Sistem EMR menyediakan fitur *Copy Previous Prescription* (Salin Resep Sebelumnya) untuk pasien kronis.
   * Dokter memperbarui resep: Amlodipine 5mg (1x1), Metformin 500mg (2x1).
   * Saat dokter mencoba meresepkan obat golongan antibiotik Penisilin (misal: Amoxicillin), sistem **Clinical Decision Support (CDS)** akan langsung memunculkan *pop-up* blokir peringatan karena pasien memiliki alergi yang sudah diverifikasi perawat tadi.
5. Dokter menyesuaikan pesanan, memberikan edukasi, dan menekan **[Sign & Complete Encounter]**.

---

## Tahap 4: Pengambilan Obat & Billing (Farmasi & Kasir)

**Standar JCI:** Komunikasi efektif dan penagihan yang transparan.

1. Layar di unit Farmasi langsung menampilkan resep elektronik (e-Prescription) dari dokter tanpa perlu pasien membawa kertas resep.
2. Apoteker melakukan telaah resep dan menyiapkan obat.
3. Setelah obat diserahkan beserta edukasi, status pelayanan Farmasi selesai.
4. Semua tindakan (Kunjungan dokter, tindakan keperawatan, dan obat) secara otomatis terkumpul di modul **Billing** tanpa perlu rekap manual.
5. Pasien menyelesaikan pembayaran, dan *Encounter* resmi ditutup secara sistem.

---
> **Kesimpulan:** Dengan NurseFlow HIS, alur rawat jalan menjadi *paperless*, mengurangi waktu tunggu pasien di farmasi (karena resep sudah dikirim saat di ruang periksa), serta meningkatkan keselamatan pasien (Patient Safety) melalui sistem peringatan dini alergi (CDS).
