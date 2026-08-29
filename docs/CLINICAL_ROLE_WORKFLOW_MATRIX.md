# 👥 MATRIKS PERAN KLINIS & OPERASIONAL RUMAH SAKIT (CLINICAL ROLE WORKFLOW MATRIX)
## NurseFlow Enterprise Hospital Information System 2026

**Dokumen Referensi:** Master Task — Clinical UX & Workflow Re-Engineering  
**Tanggal Rilis:** 26 Agustus 2026  
**Standar Baseline:** Joint Commission International (JCI 7th Ed), NIST Ergonomics for EHR Users, Kemenkes Permenkes 24/2022  

---

## 📌 Executive Summary

Dalam ekosistem rumah sakit enterprise, setiap tenaga kesehatan dan staf administrasi memiliki beban kognitif, kecepatan kerja (*time-to-task*), dan tanggung jawab keselamatan (*patient safety*) yang berbeda secara signifikan.

Dokumen ini memetakan **18 Persona / Role Pengguna Rumah Sakit**, menganalisis tujuan, tugas harian, kebutuhan informasi primer, alur kerja, tindakan berisiko tinggi (*critical / error-prone actions*), dan ekspektasi navigasi antarmuka.

---

## 🏥 Detail Analisis Peran (18 Roles)

---

### 1. Dokter Penanggung Jawab Pelayanan (DPJP / Spesialis / Dokter Umum)
* **Siapa Pengguna:** Dokter Spesialis / Dokter Umum di Poliklinik Rawat Jalan, Ruang Rawat Inap, atau Konsulen IGD.
* **Tujuan Utama:** Menegakkan diagnosis klinis yang akurat, merencanakan terapi, dan mendokumentasikan SOAP/CPPT secara cepat tanpa kehilangan waktu tatap muka dengan pasien.
* **Pekerjaan Utama:**
  1. Meninjau riwayat penyakit masa lalu, alergi, dan pengobatan aktif.
  2. Memeriksa hasil laboratorium, radiologi (PACS), dan tanda vital serial.
  3. Menulis asesmen SOAP / CPPT dan memilih kode diagnosa ICD-10 & prosedur ICD-9-CM.
  4. Menerbitkan order resep obat (CPOE), permintaan lab, dan radiologi.
  5. Menentukan rencana pemulangan (Discharge Plan) atau instruksi rawat inap.
* **Informasi yang Dibutuhkan:** Riwayat alergi (Hard-Stop Alert), tren tanda vital & NEWS2, hasil diagnostik historis, kontraindikasi obat (CDSS).
* **Workflow Alur:** Buka Antrean Poli $\rightarrow$ Pilih Pasien $\rightarrow$ Tinjau Ringkasan Klinis $\rightarrow$ Input SOAP $\rightarrow$ Terbitkan Order CPOE $\rightarrow$ Simpan \& Finalisasi.
* **Frequently Used Actions:** Autocomplete ICD-10, pencarian resep obat paket/template, periksa hasil lab.
* **Critical Action:** Preskripsi obat high-alert (LASA, sitotoksik, narkotika), penetapan diagnosa utama.
* **Error-Prone Action:** Salah memilih konsentrasi obat, terlewat membaca riwayat alergi pasien, salah memilih encounter kunjungan.
* **Information Priority:** High Alert Banner (Alergi/DNR) > Tanda Vital > Catatan SOAP Sebelumnya > Hasil Diagnostik > Input Form.
* **Expected Navigation:** Single-screen 3-pane layout; zero pop-up modal untuk penulisan SOAP & CPOE; keyboard shortcuts (`Ctrl+S` untuk simpan, `Ctrl+O` untuk order).

---

### 2. Perawat Triase Gawat Darurat (Emergency Triage Nurse)
* **Siapa Pengguna:** Perawat tersertifikasi BTCLS/ACLS di pos triase IGD.
* **Tujuan Utama:** Menilai tingkat kegawatan pasien dalam waktu $< 60$ detik dan mengalokasikan pasien ke zona perawatan yang tepat (Resusitasi, Merah, Kuning, Hijau).
* **Pekerjaan Utama:**
  1. Identifikasi cepat pasien (atau mendaftarkan Mr. X untuk kasus darurat tanpa identitas).
  2. Input cepat tanda vital (GCS, Tekanan Darah, Nadi, Laju Nafas, SpO2, Suhu, Nyeri).
  3. Penilaian keluhan utama dan mekanisme cedera (Trauma / Non-trauma).
  4. Klasifikasi tingkat triase berbasis algoritma ATS / ESI 5-Level.
  5. Pengiriman pasien ke zona resusitasi / kamar tindakan.
* **Informasi yang Dibutuhkan:** Skor ESI 1-5, ambang batas NEWS2 otomatis, ketersediaan bed di IGD Resusitasi/Tindakan, waktu tunggu kedatangan (SLA Countdown).
* **Workflow Alur:** Pasien Tiba $\rightarrow$ Identifikasi Kilat $\rightarrow$ Input Tanda Vital $\rightarrow$ Hitung ESI $\rightarrow$ Rute ke Zona IGD $\rightarrow$ Handover ke Tim Primer.
* **Frequently Used Actions:** Input angka tanda vital (Keypad/Numpad-first), pemilihan ESI 1-5, transfer bed IGD.
* **Critical Action:** Klasifikasi ESI-1 (Henti jantung/apnea) yang harus memicu Code Blue / Resusitasi secara instan.
* **Error-Prone Action:** Under-triage (misal: ESI-2 terklasifikasi ESI-3) akibat salah hitung tanda vital / tidak memperhatikan tanda kompensasi syok.
* **Information Priority:** ESI Severity Badge > Tanda Vital Abnormal > Keluhan Utama > Alokasi Bed.
* **Expected Navigation:** Full-screen rapid data-entry HUD, input angka menggunakan keyboard Numpad murni, zero modal dialog.

---

### 3. Perawat Ruang Rawat Inap (Inpatient Staff Nurse)
* **Siapa Pengguna:** Perawat pelaksana di bangsal rawat inap bedah, penyakit dalam, anak, atau kebidanan.
* **Tujuan Utama:** Memberikan asuhan keperawatan berkala, memantau perburukan klinis, dan melakukan administrasi obat bedside secara aman (5-Benar).
* **Pekerjaan Utama:**
  1. Observasi tanda vital terjadwal (per 4-8 jam) dan skor EWS / NEWS2 / PEWS.
  2. Dokumentasi asuhan keperawatan (SDKI / SLKI / SIKI) dan catatan perkembangan pasien terintegrasi (CPPT).
  3. Pemberian obat bedside (eMAR) dengan memindai barcode gelang pasien dan barcode obat.
  4. Pencatatan neraca cairan (fluid balance: intake infus/oral vs output urine/drain).
  5. Timbang terima pasien per pergantian shift menggunakan metode ISBAR.
* **Informasi yang Dibutuhkan:** Jadwal pemberian obat shift aktif, peringatan alergi, status kepatuhan obat, riwayat balance cairan 24 jam.
* **Workflow Alur:** Masuk Bangsal $\rightarrow$ Tinjau Worklist Shift $\rightarrow$ Buka Pasien $\rightarrow$ Input Vitals $\rightarrow$ Scan Gelang \& Obat $\rightarrow$ Catat eMAR $\rightarrow$ Generate Handover ISBAR.
* **Frequently Used Actions:** Scan barcode obat, centang pemberian dosis, input tanda vital harian, input balance cairan.
* **Critical Action:** Pemberian obat High-Alert / Elektrolit Pekat / Narkotika yang memerlukan *Dual Nurse Independent Verification*.
* **Error-Prone Action:** Salah pasien (tidak scan barcode gelang), salah waktu dosis, salah hitung tetesan infus.
* **Information Priority:** Alert Alergi > Jadwal Obat Jam Ini > Skor NEWS2 > Catatan Instruksi DPJP.
* **Expected Navigation:** Timeline visual eMAR horisontal, quick barcode modal dengan umpan balik visual hijau/merah yang jelas.

---

### 4. Apoteker / Tenaga Teknis Kefarmasian (Clinical Pharmacist)
* **Siapa Pengguna:** Apoteker klinis di Depo Farmasi Rawat Jalan, Rawat Inap, atau IGD.
* **Tujuan Utama:** Melakukan skrining administratif & klinis resep, mendeteksi interaksi/alergi obat, dan menyiapkan obat dengan prinsip FEFO tepat waktu.
* **Pekerjaan Utama:**
  1. Verifikasi resep dokter (telaah 7-Benar: tepat pasien, obat, dosis, rute, waktu, indikasi, dokumentasi).
  2. Melakukan intervensi farmasi klinis jika terdapat interaksi obat berat atau dosis toksik.
  3. Alokasi batch obat berdasarkan tanggal kedaluwarsa terdekat (FEFO).
  4. Peracikan sediaan farmasi (puyer, kapsul, sirup racikan, sitotoksik IV).
  5. Penyerahan obat kepada pasien/perawat disertai edukasi dan konseling (Pemberian Informasi Obat / PIO).
* **Informasi yang Dibutuhkan:** Indikasi klinis, klirens kreatinin (fungsi ginjal), riwayat alergi, stok batch FEFO, peringatan interaksi CDSS.
* **Workflow Alur:** Antrean Resep Masuk $\rightarrow$ Telaah Resep $\rightarrow$ Verifikasi / Intervensi $\rightarrow$ Alokasi Batch FEFO $\rightarrow$ Cetak Etiket $\rightarrow$ Dispensing $\rightarrow$ Konseling.
* **Frequently Used Actions:** Konfirmasi telaah resep (1-click approve), cetak etiket aturan pakai, cek stok batch.
* **Critical Action:** Menghentikan / memblokir resep dengan interaksi fatal (Contraindicated) atau riwayat anafilaksis.
* **Error-Prone Action:** Salah ambil obat LASA (Look-Alike Sound-Alike), salah memilih batch kedaluwarsa.
* **Information Priority:** Peringatan Kontraindikasi CDSS > Status CITO/Reguler > Rincian Resep > Stok FEFO.
* **Expected Navigation:** Dual-panel split screen (Kiri: Antrean Resep CITO/Reguler, Kanan: Rincian Telaah & Dispensing).

---

### 5. Analis Laboratorium (Medical Laboratory Technologist)
* **Siapa Pengguna:** Analis laboratorium patologi klinik di laboratorium sentral / IGD.
* **Tujuan Utama:** Menerima spesimen, memproses sampel pada alat analizer, memasukkan hasil uji laboratorium, dan melaporkan nilai kritis secara cepat.
* **Pekerjaan Utama:**
  1. Penerimaan spesimen (*accessioning*) dan verifikasi kelayakan sampel (bebas hemolisis, bekuan).
  2. Input hasil parameter laboratorium kuantitatif (angka) dan kualitatif.
  3. Deteksi Delta-Check (perbandingan dengan hasil sebelumnya) dan Panic Value (Nilai Kritis).
  4. Validasi teknis dan pelaporan nilai kritis ke DPJP/Perawat dalam batas waktu $< 15$ menit (JCI Standard).
  5. Pengiriman hasil terverifikasi ke rekam medis elektronik.
* **Informasi yang Dibutuhkan:** Jenis tabung vacutainer, diagnosis klinis pengantar, rentang nilai rujukan (Reference Range) berbasis usia/gender, status puasa pasien.
* **Workflow Alur:** Terima Sampel $\rightarrow$ Scan Barcode Tabung $\rightarrow$ Running Analyzer $\rightarrow$ Input Hasil $\rightarrow$ Evaluasi Delta-Check $\rightarrow$ Validasi $\rightarrow$ Rilis.
* **Frequently Used Actions:** Input angka hasil, navigasi antar-baris menggunakan tombol `Enter` / `Tab`, 1-click validasi hasil normal.
* **Critical Action:** Identifikasi Panic Value (misal: Kalium 2.1 mEq/L atau Hb 4.2 g/dL) yang wajib dicatat di log nilai kritis.
* **Error-Prone Action:** Tertukar spesimen antar-pasien jika barcode tidak dipindai, salah input desimal angka hasil.
* **Information Priority:** Status CITO > Indikator Nilai Kritis (Merah Berkedip) > Nilai Rujukan > Nilai Sebelumnya.
* **Expected Navigation:** Data-grid tabel padat dengan keyboard navigation murni; peringatan visual tebal untuk nilai kritis di luar rentang.

---

### 6. Radiografer & Dokter Spesialis Radiologi (Radiology & PACS)
* **Siapa Pengguna:** Radiografer (pelaksana akuisisi foto) dan Dokter Spesialis Radiologi (penulis expertise).
* **Tujuan Utama:** Mengakuisisi citra diagnostik berkualitas tinggi dan menyusun ekspertise bacaan radiologi terstruktur secara akurat.
* **Pekerjaan Utama:**
  1. Mengelola Modality Worklist (MWL) untuk pemanggilan pasien ke ruang X-Ray, CT-Scan, MRI, atau USG.
  2. Meninjau citra radiologi DICOM pada viewer resolusi tinggi dengan alat bantu ukur (windowing, zoom, pan, Cobb angle).
  3. Menulis laporan ekspertise radiologi terstruktur (Klinis, Deskripsi, Kesimpulan, Rekomendasi).
  4. Menandai temuan radiologis kritis (misal: Pneumotoraks tension, Perdarahan Intraserebral).
* **Informasi yang Dibutuhkan:** Indikasi klinis dokter pengirim, riwayat tindakan bedah/implan, citra serial sebelumnya untuk komparasi.
* **Workflow Alur:** Terima Order RIS $\rightarrow$ Panggil Pasien $\rightarrow$ Akuisisi Citra $\rightarrow$ Sinkronisasi PACS $\rightarrow$ Buka Viewer DICOM $\rightarrow$ Tulis Ekspertise $\rightarrow$ Tanda Tangan Digital.
* **Frequently Used Actions:** Window leveling citra, komparasi 2 studi berdampingan, pemilihan template ekspertise normal.
* **Critical Action:** Pelaporan temuan radiologi darurat (Critical Imaging Finding) ke dokter IGD/DPJP.
* **Error-Prone Action:** Salah sisi lateralitas (Kiri vs Kanan), pengetikan deskripsi pada studi pasien yang salah.
* **Information Priority:** Citra DICOM Web Viewer > Indikasi Klinis > Template Ekspertise > Status Laporan.
* **Expected Navigation:** Split view 50:50 (Viewer Citra di sisi kiri, Formulir Ekspertise di sisi kanan) tanpa perlu beralih jendela.

---

### 7. Dokter Spesialis Bedah & Dokter Anestesi (Operating Theatre / IBS)
* **Siapa Pengguna:** Tim bedah kamar operasi (Dokter Bedah, Dokter Anestesi, Perawat Instrumen/Sirkuler).
* **Tujuan Utama:** Menjalankan prosedur pembedahan yang aman sesuai pedoman JCI IPSG 4 (Pencegahan Salah Sisi, Salah Prosedur, Salah Pasien).
* **Pekerjaan Utama:**
  1. Pelaksanaan WHO Surgical Safety Checklist (Sign In sebelum induksi, Time Out sebelum insisi, Sign Out sebelum penutupan luka).
  2. Penulisan laporan operasi (prosedur, temuan intraoperatif, komplikasi, jumlah perdarahan, spesimen PA).
  3. Pemantauan anestesi kontinu (tanda vital intraoperatif, pemakaian gas anestesi, cairan, obat darurat).
  4. Penilaian pemulihan pasca-anestesi di ruang PACU / RR menggunakan skor Aldrete / Bromage / Steward.
* **Informasi yang Dibutuhkan:** Informed consent operasi digital, sisi operasi (penandaan lokasi insisi), riwayat alergi anestesi, ketersediaan darah PMI.
* **Workflow Alur:** Pasien Masuk OK $\rightarrow$ Sign In $\rightarrow$ Induksi Anestesi $\rightarrow$ Time Out $\rightarrow$ Insisi Pembedahan $\rightarrow$ Sign Out $\rightarrow$ Laporan Operasi $\rightarrow$ Transfer PACU.
* **Frequently Used Actions:** Verifikasi checklist WHO, input durasi operasi, input skor Aldrete PACU.
* **Critical Action:** Validasi Time Out (Konfirmasi identitas, informed consent, sisi operasi, dan profilaksis antibiotik tepat waktu).
* **Error-Prone Action:** Terlewatnya pengisian checklist WHO jika tidak diwajibkan secara sistem sebelum penutupan encounter bedah.
* **Information Priority:** Status Checklist WHO > Tanda Vital Intraoperatif > Laporan Pembedahan > Transfer PACU.
* **Expected Navigation:** High-contrast touch/mouse-friendly stepper checklist dengan penandaan visual hijau/kuning/merah.

---

### 8. Petugas Kasir & Billing Rumah Sakit (Cashier & Patient Accounts)
* **Siapa Pengguna:** Staf kasir dan keuangan front office yang melayani pembayaran pasien pulang atau deposit ranap.
* **Tujuan Utama:** Menghitung total tagihan akhir pasien secara transparan, memisahkan penjamin (Split Bill), dan menerbitkan kuitansi resmi.
* **Pekerjaan Utama:**
  1. Menarik seluruh mutasi tindakan, farmasi, lab, radiologi, dan akomodasi ranjang pasien.
  2. Menerapkan skema penjaminan (BPJS Kesehatan, Asuransi Swasta, Perusahaan, atau Pembayaran Pribadi).
  3. Menerima pembayaran multi-metode (Tunai, QRIS, Kartu Debit/Kredit, Transfer Bank).
  4. Menerbitkan kuitansi pelunasan dan Surat Bebas Administrasi Keuangan (SBAK) untuk pemulangan ranjang.
* **Informasi yang Dibutuhkan:** Rincian biaya per unit layanan, status verifikasi klaim BPJS (SEP), deposit yang telah disetor sebelumnya.
* **Workflow Alur:** Pasien Diinstruksikan Pulang $\rightarrow$ Buka Akun Tagihan $\rightarrow$ Split Invoice $\rightarrow$ Input Pembayaran $\rightarrow$ Cetak Kuitansi $\rightarrow$ Rilis SBAK.
* **Frequently Used Actions:** Split bill 1-click (BPJS vs Selisih Kelas), kalkulasi kembalian tunai, cetak kuitansi thermal/A4.
* **Critical Action:** Pelunasan tagihan yang mengunci mutasi finansial secara permanen (WORM Finansial).
* **Error-Prone Action:** Salah memilih metode bayar, duplikasi pembayaran pada koneksi lambat.
* **Information Priority:** Total Tagihan Pasien > Rincian Pemisahan Penjamin > Form Pembayaran > Riwayat Deposit.
* **Expected Navigation:** Ringkasan tagihan terpusat dengan font nominal angka monospaced yang mudah dibaca (*high-contrast financial table*).

---

### 9. Casemix Coder (Klaim BPJS & INA-CBGs)
* **Siapa Pengguna:** Petugas rekam medis dan casemix yang melakukan koding diagnosis dan prosedur untuk klaim BPJS Kesehatan.
* **Tujuan Utama:** Mengonversi berkas rekam medis menjadi kode ICD-10 & ICD-9-CM yang valid untuk menghasilkan grouping INA-CBGs yang tepat dan mencegah *fraud / dispute* klaim.
* **Pekerjaan Utama:**
  1. Telaah kelengkapan rekam medis digital (Resume Medis, Laporan Operasi, Hasil Lab/Rad).
  2. Koding diagnosa primer, diagnosa sekunder (komorbiditas/komplikasi), dan prosedur utama/sekunder.
  3. Simulasi tarif INA-CBG dan evaluasi selisih biaya riil rumah sakit (*Cost vs Tariff Variance*).
  4. Finalisasi berkas klaim dan pengiriman ke server bridging E-Klaim BPJS.
* **Informasi yang Dibutuhkan:** Ringkasan resume medis, hasil laboratorium penunjang diagnosa, tarif INA-CBG hasil grouping.
* **Workflow Alur:** Buka Antrean Berkas Pulang $\rightarrow$ Review Resume Medis $\rightarrow$ Koding ICD-10 \& ICD-9-CM $\rightarrow$ Grouping INA-CBG $\rightarrow$ Verifikasi Tarif $\rightarrow$ Finalisasi Klaim.
* **Frequently Used Actions:** Pencarian kode ICD dengan rekomendasi otomatis, periksa dokumen pendukung (*one-click document viewer*).
* **Critical Action:** Penentuan diagnosa primer yang menentukan kode CBG utama.
* **Error-Prone Action:** Up-coding atau unbundling prosedur yang berpotensi ditolak verifikator BPJS.
* **Information Priority:** Resume Medis > Koding ICD-10/ICD-9 > Hasil Grouping INA-CBG > Biaya Riil Pasien.
* **Expected Navigation:** 2-kolom (Kiri: Viewer Berkas Rekam Medis Elektronik, Kanan: Form Koding & Simulasi INA-CBG).

---

### 10. Front Desk & Registrasi Pasien (Admitting Officer)
* **Siapa Pengguna:** Petugas pendaftaran di loket rawat jalan, rawat inap, atau IGD.
* **Tujuan Utama:** Mendaftarkan pasien dengan cepat, memvalidasi identitas tunggal (EMPI), dan menerbitkan encounter kunjungan.
* **Pekerjaan Utama:**
  1. Pencarian data induk pasien berdasarkan NIK / No. BPJS / Nama + Tgl Lahir.
  2. Pendaftaran pasien baru dengan perekaman identitas lengkap dan persetujuan umum (*General Consent* digital).
  3. Penerbitan Surat Eligibilitas Peserta (SEP) BPJS Kesehatan via integrasi VClaim.
  4. Pembuatan nomor antrean poliklinik dan pencetakan gelang identitas barcode (IPSG 1).
* **Informasi yang Dibutuhkan:** Kuota dokter poli, status keaktifan kepesertaan BPJS, status nomor rekam medis ganda.
* **Workflow Alur:** Panggil Nomor Antrean $\rightarrow$ Identifikasi Pasien $\rightarrow$ Buat Kunjungan $\rightarrow$ Verifikasi BPJS $\rightarrow$ Cetak Gelang/Karcis.
* **Frequently Used Actions:** Scan e-KTP, tarik data kepesertaan BPJS via NIK, cetak karcis antrean.
* **Critical Action:** Penerbitan gelang identitas barcode dengan 2 identifier (Nama dan Nomor Rekam Medis).
* **Error-Prone Action:** Membuat rekam medis baru untuk pasien lama yang sudah memiliki nomor RM (duplikasi EMPI).
* **Information Priority:** Status Validasi EMPI > Data Demografi > Pilihan Poliklinik & Dokter > Tombol Cetak Gelang.
* **Expected Navigation:** Fast keyboard-navigable form dengan auto-focus pada field pencarian NIK.

---

### 11. Petugas Bank Darah Rumah Sakit (Blood Bank Technician)
* **Siapa Pengguna:** Analis bank darah / BDRS yang mengelola stok darah dan uji silang serasi.
* **Tujuan Utama:** Memastikan ketersediaan dan keamanan kantong darah bagi pasien yang membutuhkan transfusi.
* **Pekerjaan Utama:**
  1. Pencatatan penerimaan kantong darah dari UTD PMI dengan label barcode ISBT-128.
  2. Pemantauan suhu lemari pendingin darah (*cold chain monitoring* $2^\circ\text{C} - 6^\circ\text{C}$).
  3. Pelaksanaan uji silang serasi (Crossmatch Mayor, Minor, Auto-kontrol).
  4. Rilis kantong darah kompatibel kepada perawat ruangan disertai kartu identitas transfusi.
* **Informasi yang Dibutuhkan:** Golongan darah & Rhesus pasien, riwayat reaksi transfusi sebelumnya, sisa masa simpan kantong darah.
* **Workflow Alur:** Terima Permintaan Darah $\rightarrow$ Uji Golongan Darah $\rightarrow$ Uji Crossmatch $\rightarrow$ Rilis Kantong Kompatibel $\rightarrow$ Handover Bedside.
* **Frequently Used Actions:** Scan barcode ISBT-128 kantong darah, verifikasi hasil crossmatch kompatibel/inkompatibel.
* **Critical Action:** Verifikasi golongan darah ABO & Rhesus sebelum merilis kantong darah (Kesalahan = Reaksi Transfusi Hemolitik Akut).
* **Error-Prone Action:** Menyerahkan kantong darah yang belum selesai uji crossmatch pada situasi non-darurat.
* **Information Priority:** Peringatan Inkompatibilitas (Merah Hard-Stop) > Golongan Darah & Rhesus > No. Kantong ISBT-128.
* **Expected Navigation:** Visual card stok darah per golongan (A, B, AB, O) dengan indikator kedaluwarsa berbasis warna.

---

### 12. Perawat Intensive Care Unit (ICU / ICCU / PICU Nurse)
* **Siapa Pengguna:** Perawat spesialis perawatan intensif.
* **Tujuan Utama:** Melakukan pemantauan hemodinamik ketat per jam dan titrasi obat inotropik / vasoaktif penyelamat nyawa.
* **Pekerjaan Utama:**
  1. Pencatatan tanda vital per jam (Tekanan Darah Invasif/Arteri Line, CVP, Nadi, SpO2, Suhu Inti).
  2. Pemantauan parameter ventilator mekanik (Mode, FiO2, PEEP, Tidal Volume, Peak Pressure).
  3. Titrasi infus kontinu obat kritis (Norepinefrin, Dopamin, Dobutamin, Fentanil, Midazolam, Insulin).
  4. Perhitungan skor keparahan penyakit harian (SOFA Score / APACHE II).
* **Informasi yang Dibutuhkan:** Tren MAP (Mean Arterial Pressure) vs dosis titrasi obat, hasil analisa gas darah (AGD/BGA) serial, target balance cairan harian.
* **Workflow Alur:** Pemantauan Bedside Per Jam $\rightarrow$ Input Parameter Ventilator \& Hemodinamik $\rightarrow$ Sesuaikan Titrasi Obat $\rightarrow$ Evaluasi AGD $\rightarrow$ Catat SOFA Score.
* **Frequently Used Actions:** Input tanda vital per jam, penyesuaian laju syringe pump (mcg/kg/menit), pencatatan suction/ETT.
* **Critical Action:** Perubahan laju titrasi obat vasoaktif yang memerlukan verifikasi dosis aman.
* **Error-Prone Action:** Salah konversi satuan dosis (misal: mg/jam vs mcg/kg/menit), terlewat mencatat tetesan syringe pump yang habis.
* **Information Priority:** Tren MAP \& Laju Vasopresor > Parameter Ventilator > Analisa Gas Darah > Skor SOFA.
* **Expected Navigation:** Lembar observasi intensif 24 jam berbasis grid waktu horizontal dengan grafik tren real-time.

---

### 13. Petugas Manajemen Ranjang & Admisi (Bed Management Coordinator)
* **Siapa Pengguna:** Staf admisi rawat inap / pengendali kapasitas ranjang sentral.
* **Tujuan Utama:** Mengoptimalkan utilitas ranjang rumah sakit (BOR), mempercepat *bed turnover*, dan mencegah penumpukan pasien di IGD (*bed block*).
* **Pekerjaan Utama:**
  1. Menerima permintaan rawat inap dari IGD dan Poliklinik.
  2. Memilihkan ranjang yang sesuai dengan kelas rawat, jenis kelamin, dan kebutuhan isolasi/spesialisasi.
  3. Memantau antrean pembersihan ranjang oleh tim *housekeeping*.
  4. Menganalisis metrik Barber-Johnson (BOR, LOS, TOI, BTO) harian.
* **Informasi yang Dibutuhkan:** Peta ranjang real-time per lantai/bangsal, status ranjang (Tersedia, Terisi, Dipesan, Kotor/Cleaning, Pemeliharaan).
* **Workflow Alur:** Permintaan Rawat Inap Masuk $\rightarrow$ Cari Ranjang Sesuai Kelas $\rightarrow$ Alokasikan Ranjang (Reserve) $\rightarrow$ Kirim Pasien $\rightarrow$ Update Status Occupied.
* **Frequently Used Actions:** Filter ranjang berdasarkan kelas/bangsal, ubah status ranjang (Cleaning $\rightarrow$ Available).
* **Critical Action:** Penempatan pasien penyakit menular pada ruang isolasi bertekanan negatif.
* **Error-Prone Action:** Menempatkan pasien beda jenis kelamin dalam satu kamar rawat bersama non-isolasi.
* **Information Priority:** Peta Ranjang Bangsal > Antrean Pasien Menunggu Ranjang > Status Housekeeping.
* **Expected Navigation:** Visual Floor Plan / Grid Ranjang Interaktif dengan indikator warna status ranjang yang kontras.

---

### 14. Petugas Rekam Medis (Medical Records Officer)
* **Siapa Pengguna:** Staf rekam medis (Kearsipan & Legalitas Dokumen).
* **Tujuan Utama:** Memastikan kelengkapan berkas rekam medis digital (KLPCM), validitas tanda tangan digital BSrE, dan kepatuhan retensi dokumen Permenkes 24/2022.
* **Pekerjaan Utama:**
  1. Verifikasi kelengkapan resume medis rawat jalan dan rawat inap dalam batas waktu $< 24$ jam pasca-pulang.
  2. Audit keabsahan tanda tangan elektronik dokter dan tenaga medis.
  3. Pengecekan rekam medis untuk rujukan eksternal atau keperluan hukum/pengadilan (*medicolegal*).
  4. Pengarsipan dan penguncian berkas rekam medis (*Medical Record Final Lock*).
* **Informasi yang Dibutuhkan:** Status kelengkapan resume medis per dokter, log akses rekam medis, masa berlaku dokumen general consent.
* **Workflow Alur:** Pasien Pulang $\rightarrow$ Audit Kelengkapan Dokumen $\rightarrow$ Kirim Notifikasi ke DPJP jika Tidak Lengkap $\rightarrow$ Kunci Berkas Rekam Medis.
* **Frequently Used Actions:** Audit kelengkapan 1-click, cetak salinan rekam medis resmi dengan watermark.
* **Critical Action:** Penguncian berkas rekam medis secara permanen (WORM) yang mencegah modifikasi pasca-finalisasi.
* **Error-Prone Action:** Melepaskan dokumen rekam medis ke pihak ketiga tanpa surat kuasa pasien yang sah.
* **Information Priority:** Daftar Berkas Belum Lengkap (KLPCM) > Status Tanda Tangan Digital > Log Akses Pasien.
* **Expected Navigation:** Worklist tabel audit berkas dengan filter berdasarkan nama DPJP dan tanggal kepulangan.

---

### 15. Staf Logistik & Gudang Farmasi (Logistics & Inventory Officer)
* **Siapa Pengguna:** Petugas gudang logistik farmasi dan barang medis habis pakai (BMHP).
* **Tujuan Utama:** Menjaga ketersediaan stok obat/BMHP esensial, mencegah kekosongan stok (*stockout*), dan meminimalkan kerugian akibat obat kedaluwarsa.
* **Pekerjaan Utama:**
  1. Penerimaan barang dari PBF (Pedagang Besar Farmasi) dan pencocokan dengan Surat Pesanan (PO) serta faktur.
  2. Input nomor batch, tanggal kedaluwarsa, dan harga beli per satuan sediaan.
  3. Pemenuhan permintaan mutasi barang (*Material Request*) dari depo rawat jalan, rawat inap, OK, dan IGD.
  4. Pelaksanaan stok opname berkala dan penyesuaian stok (*Stock Adjustment*).
* **Informasi yang Dibutuhkan:** Stok minimum (Buffer Stock), Reorder Point (ROP), daftar obat mendekati kedaluwarsa (Near-Expired $< 3$ bulan).
* **Workflow Alur:** Barang Masuk dari PBF $\rightarrow$ Periksa Fisik \& Suhu $\rightarrow$ Input Penerimaan Faktur $\rightarrow$ Alokasi Rak $\rightarrow$ Distribusi ke Depo.
* **Frequently Used Actions:** Terima faktur PBF, setujui permintaan mutasi depo, cetak kartu stok.
* **Critical Action:** Pencatatan penerimaan obat Narkotika & Psikotropika dengan nomor batch dan faktur resmi.
* **Error-Prone Action:** Salah input tanggal kedaluwarsa obat, salah memilih satuan terkecil (misal: Box vs Strip vs Tablet).
* **Information Priority:** Notifikasi Stok Kritis (Mendekati Nol) > Daftar Obat Near-Expired > Antrean Permintaan Mutasi Depo.
* **Expected Navigation:** Tabel inventori multi-gudang dengan indikator visual ketersediaan stok dan filter batch kedaluwarsa.

---

### 16. Komite Medik & Mutu Pelayanan (Medical Committee & Quality Director)
* **Siapa Pengguna:** Ketua Komite Medik, Sub-Komite Kredensial, Sub-Komite Mutu Profesi, dan Direktur Pelayanan Medis.
* **Tujuan Utama:** Menjamin kompetensi dokter yang berpraktek dan memantau kepatuhan standar klinis berstandar JCI.
* **Pekerjaan Utama:**
  1. Evaluasi kredensial STR & SIP dokter sebelum penerbitan Surat Penugasan Klinis (SPK) dan Rincian Kewenangan Klinis (RKK).
  2. Audit kepatuhan Clinical Pathway rumah sakit (misal: Kasus Demam Berdarah, Stroke, Sepsis, Appendicitis).
  3. Pemantauan Indikator Mutu Nasional (INM) dan keselamatan pasien (Insiden Keselamatan Pasien / IKP: KTD, KNC, KTC, Sentinel).
  4. Penyelenggaraan audit medis dan peninjauan kembali insiden klinis (*Root Cause Analysis* / RCA).
* **Informasi yang Dibutuhkan:** Status masa berlaku STR/SIP seluruh dokter, persentase kepatuhan Clinical Pathway, laporan insiden keselamatan.
* **Workflow Alur:** Pengajuan Kredensial Baru $\rightarrow$ Verifikasi Berkas $\rightarrow$ Terbitkan Rekomendasi RKK $\rightarrow$ Tanda Tangan SPK $\rightarrow$ Monitoring Kepatuhan Klinis.
* **Frequently Used Actions:** Verifikasi kewenangan klinis dokter, audit kepatuhan rekam medis digital.
* **Critical Action:** Pembekuan kewenangan klinis sementara (*Suspension of Clinical Privileges*) jika terjadi pelanggaran berat.
* **Error-Prone Action:** Membiarkan dokter beroperasi dengan STR/SIP yang telah kedaluwarsa.
* **Information Priority:** Dokter dengan STR/SIP Kedaluwarsa > Laporan Insiden Sentinel > Kepatuhan Clinical Pathway.
* **Expected Navigation:** Dashboard tata kelola kredensialing terpusat dengan filter berdasarkan spesialisasi dan departemen.

---

### 17. Administrator Sistem & IT Rumah Sakit (Hospital IT / System Administrator)
* **Siapa Pengguna:** Tenaga IT rumah sakit yang bertanggung jawab atas ketersediaan infrastruktur, keamanan sistem, dan integrasi eksternal.
* **Tujuan Utama:** Menjaga *high availability* sistem 24/7, memastikan kepatuhan integrasi SATUSEHAT Kemenkes & BPJS VClaim, dan mengelola keamanan RBAC.
* **Pekerjaan Utama:**
  1. Pemantauan kesehatan koneksi database PostgreSQL, API Gateway, dan outbox message queue.
  2. Monitoring transmisi FHIR R4 ke SATUSEHAT (sukses vs gagal / retries).
  3. Manajemen akun pengguna, hak akses berbasis role (RBAC), dan pembatasan multi-tenant.
  4. Peninjauan audit trail forensik keamanan, anomali login, dan kepatuhan ISO 27001.
* **Informasi yang Dibutuhkan:** Status latency API, jumlah item outbox tertahan (*orphaned processing*), log error sistem terenkripsi.
* **Workflow Alur:** Monitoring Dashboard IT $\rightarrow$ Investigasi Error Log $\rightarrow$ Konfigurasi Integrasi SATUSEHAT/BPJS $\rightarrow$ Backup & Pemeliharaan.
* **Frequently Used Actions:** Reset password pengguna, uji coba kirim payload FHIR, cek status konektivitas database.
* **Critical Action:** Pemulihan sistem saat insiden (*Disaster Recovery failover*) dan penguncian akun mencurigakan.
* **Error-Prone Action:** Mengubah konfigurasi endpoint integrasi di production tanpa uji coba sandbox.
* **Information Priority:** Status Health Check Server > Antrean Error Outbox SATUSEHAT > Log Anomali Keamanan.
* **Expected Navigation:** Developer / Admin Console terstruktur dengan telemetri live chart dan visualisasi status gerbang kualitas.

---

### 18. Direksi & Manajemen Rumah Sakit (Hospital Executive / Board of Directors)
* **Siapa Pengguna:** Direktur Utama, Direktur Medis, Direktur Keuangan, dan Dewan Pengawas Rumah Sakit.
* **Tujuan Utama:** Memperoleh visibilitas menyeluruh terhadap kinerja operasional, finansial, dan keselamatan pasien rumah sakit dalam satu layar eksekutif (*single pane of glass*).
* **Pekerjaan Utama:**
  1. Pemantauan tren Bed Occupancy Rate (BOR), Average Length of Stay (ALOS), dan Gross Death Rate (GDR).
  2. Pemantauan pendapatan harian rumah sakit, laju klaim BPJS, dan status piutang penjamin.
  3. Evaluasi waktu tunggu layanan (IGD, Rawat Jalan, Farmasi, dan Kamar Operasi).
  4. Pengambilan keputusan strategis terkait alokasi sumber daya, dokter, dan tempat tidur.
* **Informasi yang Dibutuhkan:** Ringkasan KPI eksekutif, status antrean puncak, grafik tren pendapatan vs target, rasio staf terhadap pasien.
* **Workflow Alur:** Buka Executive Cockpit $\rightarrow$ Tinjau Ringkasan BOR \& Finansial $\rightarrow$ Drill-down Departemen Bermasalah $\rightarrow$ Terbitkan Instruksi Manajemen.
* **Frequently Used Actions:** Filter periode (Hari ini, Minggu ini, Bulan ini), export laporan ringkas PDF/Excel.
* **Critical Action:** Identifikasi dini potensi krisis kapasitas rumah sakit (misal: BOR IGD $> 95\%$).
* **Error-Prone Action:** Salah interpretasi data agregat jika metrik tidak diperbarui secara real-time dari database transaksional.
* **Information Priority:** KPI Utama (BOR, Pendapatan, Waktu Tunggu) > Peringatan Kapasitas > Grafik Tren Bulanan.
* **Expected Navigation:** Clean, modern, distraction-free executive command cockpit dengan visualisasi grafik interaktif.
