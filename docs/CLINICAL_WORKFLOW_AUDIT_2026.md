# 🏥 AUDIT ALUR KERJA KLINIS END-TO-END (CLINICAL WORKFLOW AUDIT 2026)
## NurseFlow Enterprise Hospital Information System 2026

**Dokumen Referensi:** Master Task — Clinical UX & Workflow Re-Engineering  
**Tanggal Rilis:** 26 Agustus 2026  
**Prinsip Desain:** Task-First, Human-Centered, Zero Context Loss, Zero Redundant Data Entry, JCI Patient Safety Oriented  

---

## 📌 Metodologi Audit Alur Kerja

Evaluasi alur kerja klinis tidak dilakukan secara terisolasi per layar, melainkan mengikuti **perjalanan pasien nyata (Longitudinal Patient Journey)**:

$$\text{USER} \longrightarrow \text{TASK} \longrightarrow \text{CONTEXT} \longrightarrow \text{ACTION} \longrightarrow \text{RESULT} \longrightarrow \text{NEXT ACTION}$$

Setiap langkah dievaluasi terhadap 10 Pertanyaan Validasi Kritis:
1. *Apakah user tahu apa yang harus dilakukan selanjutnya tanpa berpikir panjang?*
2. *Apakah sistem secara proaktif menyarankan Next Action terbaik?*
3. *Apakah Patient Context (Nama, MRN, Alergi, NEWS2, DPJP) tetap terlihat sepanjang waktu?*
4. *Apakah Encounter Context (Jenis kunjungan, tanggal, kelas) terkunci dan aman?*
5. *Apakah user dipaksa berpindah halaman secara tidak perlu (unnecessary route switching)?*
6. *Apakah informasi pendukung tersedia saat tombol aksi diklik (in-situ information)?*
7. *Apakah urutan langkah sesuai dengan SOP klinis nyata di rumah sakit Indonesia & standar JCI?*
8. *Apakah ada konfirmasi yang tidak perlu (unnecessary confirm modal) yang memperlambat situasi darurat?*
9. *Apakah ada penginputan data berulang (duplicate entry)?*
10. *Apakah status transaksi (sukses, gagal, tersimpan, pending outbox) terlihat jelas?*

---

## 🩺 1. Alur Pasien Gawat Darurat (IGD & Resusitasi)

### Tahapan Alur Kerja:
1. **Kedatangan & Registrasi Kilat**:
   - Kasus Sadar/Biasa: Input NIK / No. BPJS / Nama $\rightarrow$ Buka rekam medis lama atau buat pasien baru.
   - Kasus Kritis / Darurat Tanpa Identitas: 1-Click "Registrasi Pasien Mr./Mrs. X" $\rightarrow$ Terbit MRN Darurat + Encounter IGD seketika.
2. **Triase & Penilaian Tanda Vital (Triage Assessment)**:
   - Perawat menginput tanda vital (TD, HR, RR, SpO2, Suhu, GCS, Skala Nyeri).
   - Sistem mengkalkulasi skor NEWS2 & algoritma ATS/ESI 5-Level secara instan.
   - Jika ESI-1 (Henti jantung/apnea/syok berat): Sistem memicu visual/audio **CODE BLUE / RESUSCITATION ALERT** dan langsung mengalokasikan bed Resusitasi IGD.
3. **Pemeriksaan Dokter IGD & Asesmen SOAP**:
   - Dokter IGD membuka rekam medis pasien di tab/workspace yang sama tanpa kehilangan riwayat triase.
   - Penulisan SOAP cepat dengan keluhan utama, riwayat penyakit sekarang, dan pemeriksaan fisik terarah.
4. **Pemesanan Tindakan & Diagnostik CITO (Universal CPOE)**:
   - Dokter memesan paket gawat darurat (misal: Paket CITO Sepsis: Darah Lengkap, Laktat, Kultur Darah, Foto Thorax, Infus NaCl 0.9%, Ceftriaxone IV).
   - Seluruh order masuk ke laboratorium, radiologi, dan farmasi dalam 1 kali klik (*Single-Click Multi-Domain Order*).
5. **Pemberian Terapi Awal & Pemantauan (eMAR)**:
   - Perawat IGD menerima obat dari depo IGD, melakukan scan barcode gelang pasien dan vial obat, lalu mencatat jam pemberian di eMAR.
6. **Re-Asesmen & Disposisi Pasien (Disposition)**:
   - Dokter mengevaluasi hasil lab & radiologi yang muncul secara real-time.
   - Dokter memilih Disposisi: Rawat Inap (Pilih Ruangan/ICU), Operasi CITO (Kirim ke Kamar Bedah), Pulang Berobat Jalan, atau Rujuk Keluar.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Input tanda vital dan penentuan tingkat triase terpisah dari antrean dokter IGD; dokter harus mencari ulang pasien di daftar poli untuk menulis SOAP.
* **Target Redesign**: **Emergency Unified Cockpit** yang menggabungkan Triase, Bed IGD, Vital Signs HUD, SOAP DPJP, dan CPOE dalam satu layar responsif tanpa reload halaman.

---

## 🩺 2. Alur Rawat Jalan Poliklinik (Outpatient Consultation)

### Tahapan Alur Kerja:
1. **Check-in Antrean Poliklinik**:
   - Pasien tiba di poli spesialis $\rightarrow$ Perawat poli melakukan check-in dan mengukur tanda vital awal (Skrining Awal Rawat Jalan).
2. **Pemanggilan & Konsultasi Dokter Spesialis**:
   - Dokter memanggil pasien melalui antrean poli.
   - Layar konsultasi dokter langsung memuat **Patient Summary HUD**: Usia, Diagnosa Terakhir, Riwayat Alergi, Riwayat Obat Rutin, Kunjungan Terakhir.
3. **Pencatatan SOAP & Diagnosa ICD-10**:
   - Dokter mengetik Anamnesis (S) dan Pemeriksaan Fisik (O).
   - Dokter memilih Diagnosa Primer & Sekunder (A) via pencarian cerdas ICD-10 dengan riwayat diagnosa tersering spesialisasi tersebut.
   - Dokter menyusun Rencana Tata Laksana / Terapi (P).
4. **Penerbitan Resep Elektronik & Order Penunjang**:
   - Dokter memilih obat dari formularium rumah sakit dengan indikasi stok real-time di farmasi rawat jalan.
   - CDSS secara otomatis memvalidasi adanya interaksi obat atau alergi secara instan.
   - Jika aman, resep langsung terkirim ke antrean farmasi rawat jalan.
5. **Rencana Kontrol Ulang & Pemulangan**:
   - Dokter menentukan jadwal kontrol berikutnya (misal: 1 minggu lagi) yang otomatis membukukan slot antrean di sistem perjanjian poliklinik.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Dokter harus berpindah antara tab "Catatan Medis", tab "Diagnosa", dan tab "CPOE Orders", menyebabkan dokter lupa apa yang baru saja diketik saat memilih obat.
* **Target Redesign**: **Doctor 3-Panel Ergonomic Workstation** (Panel Kiri: Riwayat Pasien, Panel Tengah: Editor SOAP & Diagnosa, Panel Kanan: Keranjang CPOE Order & Rekomendasi CDSS).

---

## 🩺 3. Alur Rawat Inap & Administrasi Obat (Inpatient & eMAR)

### Tahapan Alur Kerja:
1. **Admisi & Serah Terima Pasien Baru**:
   - Pasien diantar dari IGD/Poli ke Bangsal $\rightarrow$ Perawat bangsal menerima pasien dan memverifikasi identitas gelang (IPSG 1).
   - Pasien dialokasikan ke nomor ranjang di sistem (Status Bed berubah menjadi *OCCUPIED*).
2. **Asesmen Awal Keperawatan & Rencana Asuhan**:
   - Perawat mendokumentasikan asesmen awal rawat inap (Skala Jatuh Morse/Humpty Dumpty, Skala Dekubitus Norton/Braden, Asesmen Nyeri, Skrining Nutrisi).
3. **Visite Dokter & Catatan Perkembangan (CPPT)**:
   - DPJP melakukan visite, memeriksa perkembangan pasien, dan menuliskan instruksi medis di lembar CPPT terintegrasi.
4. **Pemberian Obat Terjadwal Bedside (eMAR 5-Benar)**:
   - Perawat membawa mobile workstation / tablet ke samping ranjang pasien.
   - Perawat memindai barcode gelang pasien $\rightarrow$ Layar menampilkan daftar obat yang harus diberikan pada jam tersebut.
   - Perawat memindai barcode setiap obat $\rightarrow$ Sistem mencocokkan dosis, rute, dan waktu.
   - Jika obat adalah High-Alert / Narkotika: Sistem meminta verifikasi kredensial perawat kedua (*Dual Nurse Verification*).
   - Perawat mengonfirmasi pemberian $\rightarrow$ Jadwal eMAR ter-update hijau seketika.
5. **Pemantauan Neraca Cairan & Tanda Vital**:
   - Perawat mencatat asupan cairan (infus, minum, sonde) dan keluaran cairan (urine, drain, muntah) secara berkala.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Modal 5-Rights scanner lambat dimuat dan tampilan jadwal eMAR horisontal terpotong pada layar laptop 1366x768.
* **Target Redesign**: **High-Density Inpatient Care Sheet** dengan tampilan shift 24-jam terpadu, tombol cepat *Administer All Scheduled Safe Meds*, dan pemindai barcode zero-latency.

---

## 🩺 4. Alur Pelayanan Farmasi & Dispensing FEFO

### Tahapan Alur Kerja:
1. **Penerimaan Resep Elektronik**:
   - Resep yang diterbitkan dokter langsung masuk ke antrean farmasi dengan pemisahan prioritas visual: **CITO (Merah)** vs **Reguler (Biru)**.
2. **Telaah Resep (Clinical Screening)**:
   - Apoteker menelaah resep (Kesesuaian dosis terhadap berat badan/usia, rute, interaksi obat, duplikasi terapi).
   - 1-Click Konfirmasi Telaah Resep atau 1-Click Intervensi Klinis (Kirim pesan klarifikasi ke dokter peresep).
3. **Alokasi Batch Obat (FEFO)**:
   - Sistem secara otomatis memilih nomor batch obat dengan tanggal kedaluwarsa paling dekat dari depo farmasi terkait.
4. **Penyiapan & Peracikan Obat**:
   - Petugas farmasi mengambil obat dari rak dan mencetak etiket aturan pakai (Label Barcode Pasien, Aturan Minum, Peringatan Khusus).
5. **Pemeriksaan Akhir & Penyerahan Obat (Dispensing)**:
   - Apoteker memindai etiket obat saat penyerahan kepada pasien/keluarga di loket farmasi rawat jalan atau perawat rawat inap.
   - Apoteker memberikan konseling dan mencatat edukasi obat (PIO) di sistem.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Antrean resep rawat jalan, rawat inap, dan IGD bercampur aduk; apoteker sulit melihat mana resep yang harus didahulukan dalam 3 detik pertama.
* **Target Redesign**: **Pharmacy High-Throughput Dispensing Studio** dengan visual queue berbasis SLA countdown, penandaan CITO mencolok, dan integrasi cetak etiket thermal 1-click.

---

## 🩺 5. Alur Layanan Diagnostik (Laboratorium & Radiologi)

### Tahapan Alur Kerja:
1. **Penerimaan Order & Pengambilan Spesimen**:
   - Order lab/rad muncul di worklist unit diagnostik.
   - Analis mencetak barcode spesimen vacutainer (Kode Pasien, Jenis Tes, Warna Tabung).
   - Pengambilan sampel darah/spesimen $\rightarrow$ Scan barcode penerimaan sampel (*Accessioning*).
2. **Pemrosesan & Input Hasil Analitik**:
   - Sampel diproses pada alat analyzer laboratorium atau pasien difoto pada modalitas radiologi.
   - Analis menginput hasil angka/teks pada formulir entri hasil.
   - Sistem membandingkan nilai hasil dengan rentang rujukan (Reference Range) dan hasil sebelumnya (Delta-Check).
3. **Penanganan Nilai Kritis (Panic Value)**:
   - Jika hasil berada dalam rentang nilai kritis (misal: Trombosit $< 20.000/\mu\text{L}$ atau Kalium $> 6.5\text{ mEq/L}$): Sistem memicu **CRITICAL VALUE ALERT** berkedip merah dan membuka form pelaporan nilai kritis ke DPJP.
4. **Validasi & Rilis Hasil Resmi**:
   - Dokter Spesialis Patologi Klinik / Radiologi menelaah dan menandatangani hasil secara digital.
   - Hasil terverifikasi langsung muncul di lembar rekam medis elektronik dokter pengirim tanpa perlu pengantaran kertas.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Nilai kritis tidak memicu notifikasi visual yang cukup mendesak di layar dokter; pembacaan citra PACS terpisah dari formulir pengetikan ekspertise radiologi.
* **Target Redesign**: **Diagnostics Dual-Studio** dengan deteksi nilai kritis otomatis, notifikasi push real-time ke ribbon dokter, dan viewer PACS terintegrasi 50:50 dengan editor laporan.

---

## 🩺 6. Alur Pembedahan & Kamar Operasi (Operating Theatre)

### Tahapan Alur Kerja:
1. **Penjadwalan & Persiapan Pra-Bedah**:
   - Dokter bedah menjadwalkan operasi $\rightarrow$ Pasien masuk ruang penerimaan IBS $\rightarrow$ Verifikasi puasa, informed consent, dan ketersediaan darah PMI.
2. **Sign In (Sebelum Induksi Anestesi)**:
   - Perawat anestesi & dokter anestesi mengonfirmasi identitas pasien, lokasi insisi, persetujuan operasi, kelengkapan mesin anestesi, dan riwayat alergi.
3. **Time Out (Sebelum Insisi Kulit)**:
   - Seluruh tim bedah (Operator, Anestesi, Perawat Sirkuler) berhenti sejenak: Konfirmasi nama pasien, prosedur operasi, sisi insisi, penayangan citra radiologi yang relevan, dan pemberian antibiotik profilaksis $\le 60$ menit sebelum insisi (JCI IPSG 4).
4. **Sign Out (Sebelum Penutupan Luka)**:
   - Perawat instrumen menghitung kelengkapan kassa, jarum, dan instrumen bedah; konfirmasi penamaan spesimen jaringan PA; pencatatan masalah alat.
5. **Pencatatan Laporan Operasi & Pemulihan PACU**:
   - Dokter bedah menuliskan laporan operasi rinci dan instruksi pasca-bedah.
   - Pasien dipindahkan ke ruang pemulihan (PACU) $\rightarrow$ Perawat PACU memantau tanda vital dan skor Aldrete hingga pasien memenuhi kriteria pindah bangsal ($\text{Aldrete} \ge 9$).

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Formulir WHO Surgical Checklist panjang dan kaku, memperlambat alur kerja darurat jika pasien harus dioperasi CITO.
* **Target Redesign**: **Surgical Command Stepper** dengan tombol konfirmasi checklist yang besar, kontras tinggi, dan pencegahan penutupan encounter sebelum Time Out divalidasi.

---

## 🩺 7. Alur Kepulangan Pasien, Billing Kasir & Klaim BPJS (Discharge & Casemix)

### Tahapan Alur Kerja:
1. **Instruksi Pemulangan Dokter (Discharge Order)**:
   - DPJP menyatakan pasien boleh pulang dan menyusun **Resume Medis Kepulangan (Discharge Summary)**: Diagnosa akhir, terapi pulang, jadwal kontrol, dan edukasi perawatan di rumah.
2. **Koding Casemix & Grouping INA-CBGs**:
   - Petugas koder menelaah berkas digital dan menginput kode ICD-10 & ICD-9-CM untuk menghasilkan estimasi klaim INA-CBGs.
3. **Konsolidasi Tagihan & Pembayaran Kasir**:
   - Kasir membuka akun tagihan pasien $\rightarrow$ Seluruh biaya tindakan, obat, lab, rad, dan akomodasi ranjang terkonsolidasi otomatis.
   - Sistem menghitung pemisahan tanggungan (Split Bill: Tanggungan BPJS vs Biaya Pribadi/Iur Bayar).
   - Pasien melunasi tagihan $\rightarrow$ Kasir menerbitkan kuitansi pelunasan dan Surat Bebas Administrasi Keuangan (SBAK).
4. **Pelepasan Ranjang (Bed Release & ADT Event)**:
   - Sistem secara otomatis mengirimkan event pelepasan ranjang (HL7 A03) $\rightarrow$ Status ranjang berubah menjadi *CLEANING* dan masuk ke antrean petugas *housekeeping*.
5. **Penguncian Rekam Medis (WORM Immutability Lock)**:
   - Berkas rekam medis dikunci secara permanen untuk mencegah perubahan data ilegal pasca-kepulangan.

### Temuan Audit & Solusi Redesign:
* **Problem Saat Ini**: Kasir harus menghitung selisih kelas BPJS secara manual dan status ranjang tidak otomatis berubah menjadi *Cleaning* saat kuitansi lunas diterbitkan.
* **Target Redesign**: **Unified Financial & Discharge Settlement Cockpit** dengan kalkulator split billing otomatis, integrasi grouping INA-CBG real-time, dan trigger otomatis pelepasan ranjang ke tim cleaning.
