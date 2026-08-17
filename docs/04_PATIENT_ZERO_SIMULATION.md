# 🧪 SIMULASI PASIEN PERTAMA (PATIENT ZERO END-TO-END EXECUTION)
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Laporan Rekonstruksi 30 Langkah Alur Klinis Nyata Pasien Baru Anonim (Mr. X) hingga Transfer Rawat Inap Definitif*

---

> **SKENARIO SIMULASI:** Kasus Nyata Pasien Pertama pada Hari Pertama Operasional RS (*Day-1 Zero Data Ingestion*)  
> **Identitas Pasien:** Pasien Baru Anonim (*Mr. X* $\rightarrow$ *Tn. Hendra Setiawan, S.T*)  
> **Keluhan Utama:** Penurunan Kesadaran Onset 35 Menit SMRS, Curiga Stroke Iskemik Akut  
> **Klasifikasi Triase:** ESI 2 Emergent (GCS 12, TD 185/110 mmHg)  
> **Tujuan Akhir:** Rawat Inap Bangsal Mawar (Kamar 301-B, Kelas 1)

---

## 🗺️ DIAGRAM 30-LANGKAH ALUR KERJA KLINIS PASIEN PERTAMA

```
[01. Tiba Ambulans] -> [02. Intake Triase] -> [03. 1-Click Mr. X] -> [04. Terbit MRX]
         |
         v
[05. Input ABCDE]   -> [06. Klasifikasi ESI 2] -> [07. Pasang Gelang] -> [08. Alert Dokter]
         |
         v
[09. Asesmen Perawat] -> [10. Morse Fall 70] -> [11. DPJP Buka SOAP] -> [12. Input S-O-A-P]
         |
         v
[13. ICD-10 I63.9]  -> [14. CPOE Lab Cito]  -> [15. CPOE CT-Scan]  -> [16. CPOE Resep Farmasi]
         |
         v
[17. Sampling LIS]  -> [18. Scan CT-Scan]   -> [19. LIS Rilis Hasil] -> [20. PACS Rilis Ekspertise]
         |
         v
[21. Farmasi Review]-> [22. Dispensing FEFO]-> [23. Perawat Terima] -> [24. eMAR Barcode Scan]
         |
         v
[25. Berikan Obat]  -> [26. SPRI Terbit]    -> [27. Alokasi Bed 301-B]-> [28. SBAR Handover]
         |
         v
[29. Transfer Fisik]-> [30. Encounter Status: INPATIENT (Episode Aktif Rawat Inap)]
```

---

## 📋 REKONSTRUKSI 30 LANGKAH KLINIS SIMULASI SECARA MENDALAM

### 1. Pasien Tiba di Pintu IGD (08:00 WIB)
Ambulans 118 tiba dengan sirine aktif membawa pasien laki-laki usia sekitar 58 tahun tidak sadarkan diri di atas brankar. Perawat IGD langsung menyambut di pintu masuk (*triage bay*).

### 2. Perawat Membuka Modul Triase Klinis (08:01 WIB)
Perawat triase membuka menu **`Gawat Darurat (IGD)`** ➔ **`Triase 5-Level (ATS/ESI)`** pada workstation tablet IGD.

### 3. Perawat Menekan Tombol Pasien Darurat Anonim (08:01:15 WIB)
Karena pasien tidak membawa KTP dan keluarga panik belum bisa menyerahkan berkas, perawat menekan tombol merah **`+ Pasien Darurat (Mr. X)`**.

### 4. Sistem Menerbitkan Nomor Rekam Medis Sementara (08:01:20 WIB)
Sistem secara otomatis meng-generate identitas sementara: `Tn. Mr. X (2252)` dengan Nomor RM: `MRX-20260817-2252` dan mengunci live clinical ribbon.

### 5. Pengisian Survei Primer ABCDE (08:02 WIB)
* **Airway:** Paten (Bebas dari sumbatan lendir).
* **Breathing:** Takipnea ringan, RR 24 x/menit, SpO2 92% udara ruangan.
* **Circulation:** Nadi teraba kuat dan cepat, HR 96 x/menit, TD 185/110 mmHg.
* **Disability:** GCS E3 V4 M5 (12 / Somnolen), Pupil isokor $\varnothing\ 3\text{mm}/3\text{mm}$ refleks cahaya $(+/+)$, hemiparesis kanan.
* **Exposure:** Suhu tubuh 36.8°C, Skala Nyeri 6/10.

### 6. Sistem Menetapkan Klasifikasi ESI 2 Emergent (08:03 WIB)
Mesin ESI v4 Engine NurseFlow menetapkan status **`🟠 ESI 2 (Emergent / Ancaman Kerusakan Organ)`** dan mengaktifkan stopwatch SLA respon dokter ($\le 10\text{ menit}$).

### 7. Gelang Identitas & Gelang Kuning Dicetak (08:03:30 WIB)
Printer barcode nirkabel mencetak gelang identitas putih darurat (`MRX-20260817-2252`) dan perawat memasang klip gelang kuning risiko jatuh di pergelangan tangan kiri pasien.

### 8. Dokter Menerima Notifikasi Pasien Kritis (08:04 WIB)
Layar kerja Dokter Jaga IGD memunculkan pop-up audio-visual: *"Pasien Kritis ESI 2 Baru Tiba di Bed A-01"*.

### 9. Asesmen Keperawatan Komprehensif Dilakukan (08:06 WIB)
Perawat melakukan anamnesis singkat ke keluarga dan mencatat bahwa pasien memegang kepala sebelum tidak sadar, memiliki riwayat hipertensi dan **alergi berat terhadap obat golongan Penisilin dan Sulfa**.

### 10. Pengkajian Risiko Jatuh Skala Morse (08:07 WIB)
Skor Morse Fall Scale dihitung = **70 (Risiko Tinggi)**. Perawat menaikkan kedua sisi penghalang tempat tidur (*bedrails*) dan mengunci roda tempat tidur.

### 11. Dokter Membuka Lembar Konsultasi EMR SOAP (08:08 WIB)
Dokter DPJP (`dr. Budi Santoso, Sp.B`) mengklik nama pasien pada worklist dan membuka lembar kerja CPPT SOAP terpadu.

### 12. Dokter Mengisi Catatan SOAP Medis (08:12 WIB)
* **S (Subjective):** Penurunan kesadaran mendadak 35 menit SMRS saat rapat kerja, sakit kepala hebat (*thunderclap*), muntah menyemprot 2x, pelo, hemiparesis dekstra.
* **O (Objective):** TTV TD 185/110 mmHg, GCS 12, Parese N. VII/XII dekstra sentral, kekuatan motorik $3/3$ dekstra, Babinski $(+)$.
* **A (Assessment):** Stroke iskemik akut onset baru $< 3$ jam dd/ perdarahan intrakranial, Hipertensi urgensi.
* **P (Plan):** O2 3 lpm, CT-Scan kepala Cito, panel lab Cito, pasang IVFD NaCl 0.9%, Citicoline 500mg IV, Ranitidine 50mg IV.

### 13. Dokter Menetapkan Kode Diagnosis ICD-10 (08:14 WIB)
* Diagnosis Primer: **`I63.9 - Cerebral infarction, unspecified`**
* Diagnosis Sekunder: **`I10 - Essential (primary) hypertension`**

### 14. Penerbitan CPOE Laboratorium Cito (08:15 WIB)
Dokter mencentang paket order: Darah Lengkap (CBC), GDS, Elektrolit Serum, Faal Hemostasis (PT/APTT/INR), dan Troponin-I Cito.

### 15. Penerbitan CPOE Radiologi Cito (08:15:30 WIB)
Dokter menerbitkan order radiologi: **`CT Scan Kepala Non-Kontras CITO (Protokol Stroke Akut)`**.

### 16. Penerbitan CPOE Resep Farmasi (08:16 WIB)
Dokter menerbitkan e-Prescription: Citicoline 500mg IV, Ranitidine 50mg IV, Amlodipine 10mg tab, dan Infus NaCl 0.9% 1500cc/24 jam.

### 17. Pengambilan Sampel Laboratorium & Barcode Vacutainer (08:18 WIB)
Perawat melakukan flebotomi, menempelkan barcode spesimen dari modul LIS, dan mengirimkan tabung sampel ke laboratorium cito.

### 18. Pemeriksaan CT-Scan Kepala di Ruang Radiologi (08:25 WIB)
Pasien ditransfer ke ruang radiologi dengan monitor portabel. Radiografer melakukan pemindaian CT-Scan kepala non-kontras dan citra DICOM langsung terkirim ke PACS server.

### 19. Analis Laboratorium Memvalidasi & Merilis Hasil (08:35 WIB)
Hasil lab selesai: Hemoglobin 14.2 g/dL, Trombosit 245,000 /uL, GDS 148 mg/dL, Elektrolit normal, PT 12.4 dtk, APTT 31.2 dtk, Troponin negatif. Hasil otomatis tersinkronisasi ke rekam medis.

### 20. Dokter Spesialis Radiologi Merilis Ekspertise PACS (08:40 WIB)
Sp.Rad mengevaluasi irisan aksial pada DICOM Viewer: *"Tampak early ischemic sign pada kapsula interna dekstra. Tidak tampak perdarahan intrakranial akut."* Hasil dirilis ke EMR.

### 21. Apoteker Menerima Resep & Melakukan Telaah 7-Prinsip (08:42 WIB)
Apoteker memverifikasi resep di modul Farmasi Enterprise: Skrining alergi Penicillin PASS, interaksi obat aman, 7-prinsip telaah resep terverifikasi.

### 22. Farmasi Melakukan Dispensing FEFO (08:45 WIB)
Obat disiapkan dari batch kedaluwarsa terdekat (FEFO) dan diberi label barcode 2D unik.

### 23. Perawat Menerima Obat di Ruang Perawat IGD (08:48 WIB)
Perawat IGD menerima paket obat dan memvalidasi kesesuaian fisik dengan e-Prescription.

### 24. Perawat Menjalankan Modul eMAR (08:50 WIB)
Perawat membuka jadwal eMAR, memindai barcode gelang pasien, lalu memindai barcode pada ampul obat Citicoline 500mg.

### 25. Pemberian Obat Dilakukan & Tercatat (08:52 WIB)
Sistem memvalidasi **5-Benar Obat** dan perawat menyuntikkan obat secara intravena bolus perlahan. Status obat otomatis berubah menjadi **`GIVEN`**.

### 26. Dokter Menerbitkan Surat Perintah Rawat Inap / SPRI (08:55 WIB)
Mengingat kondisi stabil dan terdiagnosis stroke iskemik, DPJP menerbitkan SPRI ke Bangsal Rawat Inap Medikal Dewasa (Bangsal Mawar).

### 27. Alokasi Tempat Tidur Bangsal Mawar (09:00 WIB)
Petugas Admisi / Perawat mengalokasikan tempat tidur **`Bed Mawar 301-B (Kelas 1)`** melalui sistem ADT. Status bed berubah menjadi `OCCUPIED`.

### 28. Pengisian Formulir Serah Terima SBAR (09:10 WIB)
Perawat IGD mengisi lembar transfer SBAR (Situation, Background, Assessment, Recommendation) secara lengkap di sistem.

### 29. Pasien Ditransfer ke Bangsal Mawar (09:15 WIB)
Pasien dibawa ke Bangsal Mawar didampingi perawat IGD dan keluarga. Perawat bangsal memverifikasi kondisi fisik dan menandatangani formulir transfer digital.

### 30. Transisi Status Kunjungan: INPATIENT (09:20 WIB)
Encounter pasien resmi bertransisi dari `EMERGENCY` menjadi **`INPATIENT`**. Pasien pertama rumah sakit resmi memulai episode rawat inapnya dengan catatan medis yang 100% lengkap, terhubung, dan audit-ready.
