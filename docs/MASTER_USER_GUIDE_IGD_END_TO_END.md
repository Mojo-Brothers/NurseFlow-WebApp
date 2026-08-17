# 🏥 BUKU PANDUAN OPERASIONAL LENGKAP (END-TO-END MASTER USER MANUAL)
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Buku Panduan Implementasi Lapangan, Simulasi Alur Kerja Klinis, dan Standar Akreditasi JCI 7th Edition & KARS 2024*

---

> **DOKUMEN RESMI PELATIHAN & OPERASIONAL RUMAH SAKIT**  
> **Unit Target:** Instalasi Gawat Darurat (IGD), Rekam Medis (HIM), Laboratorium (LIS), Radiologi (PACS), Farmasi Klinis, dan Rawat Inap (Bangsal).  
> **Fasilitas Rujukan:** RSUP Nasional / Primaya Hospital Group  
> **Versi Sistem:** NurseFlow Enterprise HIS v2026.8.1-Enterprise (FHIR R4 & SATUSEHAT Verified)

---

# 📑 DAFTAR ISI

* [BAB 1: PENDAHULUAN & PRINSIP KESELAMATAN KLINIS](#bab-1-pendahuluan--prinsip-keselamatan-klinis)
* [BAB 2: ALUR BISNIS PASIEN IGD (PATIENT JOURNEY ARCHITECTURE)](#bab-2-alur-bisnis-pasien-igd-patient-journey-architecture)
* [BAB 3: MODUL TRIASE KLINIS (PANDUAN KHUSUS PERAWAT TRIASE)](#bab-3-modul-triase-klinis-panduan-khusus-perawat-triase)
* [BAB 4: MODUL PENDAFTARAN & ADMISI (PANDUAN PETUGAS FRONT OFFICE & HIM)](#bab-4-modul-pendaftaran--admisi-panduan-petugas-front-office--him)
* [BAB 5: MODUL ASESMEN KEPERAWATAN & RISIKO JATUH (PANDUAN PERAWAT IGD)](#bab-5-modul-asesmen-keperawatan--risiko-jatuh-panduan-perawat-igd)
* [BAB 6: MODUL EMR & CPPT DOKTER DPJP (PANDUAN DOKTER IGD / SPESIALIS)](#bab-6-modul-emr--cppt-dokter-dpjp-panduan-dokter-igd--spesialis)
* [BAB 7: MODUL LABORATORIUM KLINIS / LIS (PANDUAN ANALIS LABORATORIUM)](#bab-7-modul-laboratorium-klinis--lis-panduan-analis-laboratorium)
* [BAB 8: MODUL RADIOLOGI PACS & DICOM VIEWER (PANDUAN RADIOGRAFER & SP.RAD)](#bab-8-modul-radiologi-pacs--dicom-viewer-panduan-radiografer--sprad)
* [BAB 9: MODUL FARMASI ENTERPRISE & FEFO (PANDUAN APOTEKER KLINIS)](#bab-9-modul-farmasi-enterprise--fefo-panduan-apoteker-klinis)
* [BAB 10: MODUL eMAR ADMINISTRASI OBAT (PANDUAN PERAWAT PELAKSANA)](#bab-10-modul-emar-administrasi-obat-panduan-perawat-pelaksana)
* [BAB 11: MODUL SPRI & ADT BED MANAGEMENT (PANDUAN TRANSFER RAWAT INAP)](#bab-11-modul-spri--adt-bed-management-panduan-transfer-rawat-inap)
* [BAB 12: SERAH TERIMA PASIEN SBAR (INTER-DEPARTMENTAL HANDOVER)](#bab-12-serah-terima-pasien-sbar-inter-departmental-handover)
* [BAB 13: MATRIKS HAK AKSES & KEWENANGAN KLINIS (RBAC GOVERNANCE)](#bab-13-matriks-hak-akses--kewenangan-klinis-rbac-governance)
* [BAB 14: INDIKATOR MUTU KLINIS, SLA & AUDIT AKREDITASI (KARS PMKP & JCI)](#bab-14-indikator-mutu-klinis-sla--audit-akreditasi-kars-pmkp--jci)
* [BAB 15: PANDUAN TROUBLESHOOTING, FAQ & PROTOKOL SHADOW MODE](#bab-15-panduan-troubleshooting-faq--protokol-shadow-mode)

---

# SKENARIO PASIEN SIMULASI ACUAN

Untuk memberikan pemahaman kontekstual yang seragam di seluruh bab, buku panduan ini mengacu pada **Kasus Nyata Pasien Kritis**:

| Parameter Skenario | Nilai / Data Klinis Lapangan |
|---|---|
| **Status Pasien** | Pasien Baru (Belum pernah terdaftar sebelumnya di database RS) |
| **Identitas Awal** | Tidak Diketahui / Pasien Anonim (*Unknown Emergency Patient*) |
| **Nama Sementara** | **Tn. Mr. X** (Generated: `MRX-20260817-2252`) |
| **Identitas Definitif** | **Tn. Hendra Setiawan, S.T** (NIK: `3171051508820001`, No. BPJS: `0001234567890`) |
| **Jenis Kelamin / Usia**| Laki-Laki / Perkiraan 58 Tahun |
| **Moda Kedatangan** | Ambulans 118 Gawat Darurat dengan Sirine Aktif |
| **Pendamping** | Keluarga Inti (Istri) & Petugas Paramedik Ambulans |
| **Keluhan Utama** | Penurunan kesadaran mendadak sejak 35 menit lalu saat rapat kerja, sempat muntah proyektil, pelo, dan hemiparesis kanan |
| **Tanda Vital Awal** | TD: **185/110 mmHg**, HR: **96 x/m**, RR: **24 x/m**, SpO2: **92%**, Suhu: **36.8°C**, GCS: **12 (E3-V4-M5)**, Nyeri: **6/10** |
| **Kategori Triase** | **ESI 2 (Emergent / Risiko Tinggi / Ancaman Nyawa & Organ)** |
| **Diagnosis Kerja (A)**| `I63.9 - Cerebral Infarction / Stroke Non-Hemorrhagic Akut Onset Baru` & `I10 - Essential (Primary) Hypertension` |
| **Tujuan Akhir Disposisi** | **Rawat Inap Biasa (Bangsal Medikal / Stroke Unit Terpadu)** |

---

# BAB 1: PENDAHULUAN & PRINSIP KESELAMATAN KLINIS

## 1.1 Tujuan Sistem NurseFlow Enterprise HIS
NurseFlow dirancang bukan sekadar aplikasi pencatatan (*record keeping*), melainkan **mesin otomasi keselamatan pasien (*Clinical Safety Automation Engine*)** yang menghubungkan dokter, perawat, apoteker, analis laboratorium, radiografer, dan petugas admisi dalam satu ekosistem *real-time* berbasis standar data internasional HL7 FHIR R4 dan Kepmenkes No. 24/2022.

## 1.2 Filosofi *Clinical Safety First* & *Treatment Before Administration*
Di Instalasi Gawat Darurat (IGD), **setiap detik menentukan hidup dan mati pasien**. Sistem NurseFlow menerapkan prinsip hukum dan etika medis tertinggi:
1. **Dilarang Menunda Tindakan Medis:** Pasien darurat dilarang ditahan di loket administrasi atau diminta syarat KTP/BPJS sebelum dilakukan triase dan stabilisasi hemodinamik (UU Kesehatan No. 17/2023 Pasal 173).
2. **One-Click Anonymous Ingestion:** Perawat triase berhak membuat rekam medis darurat sementara (*Mr. / Mrs. X*) dalam 1 kali klik tanpa persetujuan loket kasir/admisi.
3. **Zero Data Loss Merge:** Saat identitas asli ditemukan, data triase dan tindakan darurat tidak boleh dihapus atau ditimpa, melainkan digabungkan secara legal (*Legal Identity Merge*) ke nomor RM master.

## 1.3 Standar Kepatuhan Akreditasi Internasional & Nasional
NurseFlow mengunci arsitekturnya pada parameter akreditasi:
* **JCI 7th Edition (Joint Commission International):** Standar COP (*Care of Patients*), AOP (*Assessment of Patients*), MMU (*Medication Management and Use*), dan IPSG 1–6 (*International Patient Safety Goals*).
* **KARS 2024 (Komisi Akreditasi Rumah Sakit):** Bab PMKP (*Peningkatan Mutu dan Keselamatan Pasien*), PAP (*Pelayanan dan Asuhan Pasien*), dan SKP (*Sasaran Keselamatan Pasien*).
* **Emergency Severity Index (ESI v4):** Standar algoritma triase 5 tingkat berbasis keparahan dan kebutuhan sumber daya.
* **Kemenkes SATUSEHAT:** Interoperabilitas interoperable dengan platform SATUSEHAT melalui standar RESTful FHIR R4.

---

# BAB 2: ALUR BISNIS PASIEN IGD (PATIENT JOURNEY ARCHITECTURE)

Berikut adalah peta perjalanan pasien (*Patient Journey Timeline*) end-to-end sejak kedatangan di pintu IGD hingga serah terima di bangsal rawat inap biasa:

```
+-----------------------------------------------------------------------------------+
|                           PASIEN TIBA DI PINTU IGD                                |
|             (Ambulans / Walk-in / Penurunan Kesadaran / Pasien Anonim)            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  [BAB 3] TAHAP 1: TRIASE KLINIS PERAWAT (RAPID ESI v4 INTAKE)                     |
|  * 1-Click Buat Pasien Darurat (Mr. X) -> Terbit No. RM Sementara                |
|  * Evaluasi Survei Primer ABCDE & Input TTV Lengkap                               |
|  * Klasifikasi ESI 1-5 & Stopwatch SLA KARS PMKP Aktif                            |
|  * Pasang Gelang Identitas Sementara & Gelang Risiko Jatuh Kuning                |
+-----------------------------------------------------------------------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
+------------------------------------------+ +--------------------------------------+
| [BAB 4] TAHAP 2: ADMISI & REGISTRASI     | | [BAB 5 & 6] TAHAP 3: ASESMEN MEDIS   |
| * Klaim Rekam Medis Sementara (MRX)      | | * Asesmen Keperawatan & Morse Fall   |
| * Penjamin Darurat (Jasa Raharja/Umum)   | | * Pemeriksaan Fisik CPPT SOAP DPJP   |
| * Keluarga Datang Bawa KTP/BPJS Asli     | | * Diagnosis ICD-10 (I63.9 & I10)     |
| * EMPI Identity Merge Guard (JCI IPSG 1) | | * Tanda Tangan Elektronik BSrE Ready |
+------------------------------------------+ +--------------------------------------+
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  [BAB 7 & 8] TAHAP 4: ORDER CPOE DIAGNOSTIK & PENUNJANG                           |
|  * CPOE Lab: Darah Lengkap, GDS, Elektrolit, Faal Hemostasis, Troponin Cito       |
|  * LIS Flebotomi Barcode Vacutainer & Pelaporan Nilai Kritis (< 15 Menit)         |
|  * CPOE Radiologi: CT-Scan Kepala Non-Kontras CITO (Protokol Stroke Akut)        |
|  * DICOM Worklist (MWL) & PACS Web Viewer Terintegrasi di Layar DPJP              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  [BAB 9 & 10] TAHAP 5: SIKLUS CPOE FARMASI & eMAR PEMBERIAN OBAT                  |
|  * Dokter Terbitkan E-Prescribing (Citicoline, Amlodipine, NaCl 0.9%, High-Alert) |
|  * Farmasis Lakukan Telaah 7-Prinsip Resep & CDSS Deteksi Alergi / Interaksi      |
|  * Dispensing Multi-Depot FEFO & Pelabelan Barcode 2D                             |
|  * Perawat eMAR: Scan Barcode Gelang + Scan Obat (5-Benar Obat)                   |
|  * High-Alert Double-Check (Dual Sign-off 2 PIN Perawat)                          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  [BAB 11 & 12] TAHAP 6: DECISION TO ADMIT, SPRI & TRANSFER RAWAT INAP             |
|  * Dokter Terbitkan Surat Perintah Rawat Inap (SPRI / Admission Order)            |
|  * Admisi / Perawat Alokasikan Bed Bangsal Mawar (Kamar 301-B) via ADT System     |
|  * Pengisian Lembar Transfer Internal SBAR (Situation, Background, Assessment, Rec)|
|  * Serah Terima Digital Antar-Perawat & Transisi Encounter EMERGENCY -> INPATIENT |
+-----------------------------------------------------------------------------------+
```

---

# BAB 3: MODUL TRIASE KLINIS (PANDUAN KHUSUS PERAWAT TRIASE)

## 3.1 Navigasi Membuka Modul Triase
1. Pada menu sidebar navigasi utama, klik **`Gawat Darurat (IGD)`**.
2. Pilih submenu **`Triase 5-Level (ATS/ESI)`** (URL: `/triage`).
3. Layar akan menampilkan **IGD Command Center** dengan matriks peta keterisian bed (*Bed Allocation Map*).
4. Klik tab merah bertuliskan **`⚡ Rapid ESI Intake`** di bagian atas layar.

## 3.2 Pembuatan Pasien Anonim / Emergency Unknown Patient (Mr. X)
Jika pasien tiba tanpa identitas atau keluarga belum bisa memberikan KTP/identitas:
1. Perhatikan bagian kiri atas formulir triase bertuliskan **Pilih Pasien Terdaftar**.
2. Klik tombol merah bertuliskan **`+ Pasien Darurat (Mr. X)`**.
3. Sistem secara otomatis:
   * Menerbitkan Nomor Rekam Medis Sementara dengan format: `MRX-[YYYYMMDD]-[RANDOM_DIGIT]` (Contoh: `MRX-20260817-2252`).
   * Menetapkan nama sementara: `Tn. Mr. X (2252)`.
   * Menetapkan penjamin sementara: `Jasa Raharja / Darurat Kemenkes`.
   * Mengunci **Live Clinical Context Ribbon** di bilah atas layar pada pasien darurat ini.

## 3.3 Pengisian Survei Primer ABCDE
Perawat melakukan pemeriksaan cepat dan mengisi formulir triase:
* **A - Jalan Nafas (Airway):**
  * Pilih `Paten (Bebas)` jika nafas bersih.
  * Pilih `Terancam (Threatened)` jika ada gurgling/snoring yang butuh reposisi.
  * Pilih `Tersumbat (Obstructed)` jika jalan nafas tertutup total $\rightarrow$ *Langsung memicu indikator ESI 1*.
* **B - Pernafasan (Breathing):**
  * Pilih `Normal / Adekuat` jika ekspansi dada simetris tanpa retraksi.
  * Pilih `Dyspnea (Sesak Berat)` jika ada takipnea, cuping hidung, atau sianosis.
  * Pilih `Apnea / Henti Nafas` $\rightarrow$ *Langsung memicu indikator ESI 1*.
* **C - Sirkulasi (Circulation):**
  * Pilih `Kuat & Teratur` jika pulsasi arteri radialis teraba kuat.
  * Pilih `Syok / Hipoperfusi` jika akral dingin, basah, pucat, nadi filiformis, CRT $> 2\text{ detik}$.
  * Pilih `Perdarahan Masif Tak Terkontrol` $\rightarrow$ *Memicu protokol transfusi masif & ESI 1*.
* **D - Skala Koma Glasgow / Disability (GCS):**
  * **Eye (1–4):** $3$ (Membuka mata dengan perintah suara).
  * **Verbal (1–5):** $4$ (Bicara disorientasi / pelo / konfused).
  * **Motorik (1–6):** $5$ (Melokalisir rangsang nyeri pada ekstremitas).
  * *Total GCS terhitung otomatis:* **12 (Somnolen / Penurunan Kesadaran)**.

## 3.4 Pengisian Tanda Vital Objektif & Skala Nyeri
Masukkan nilai numerik tanda vital pada kolom yang tersedia:
* **Tekanan Darah Sistolik:** `185` mmHg
* **Tekanan Darah Diastolik:** `110` mmHg
* **Frekuensi Nadi (HR):** `96` bpm
* **Frekuensi Nafas (RR):** `24` x/menit
* **Saturasi Oksigen (SpO2):** `92` % (pada udara ruangan)
* **Suhu Tubuh:** `36.8` °C
* **Skala Nyeri (NRS 0–10):** `6` (Nyeri kepala hebat / thunderclap)

## 3.5 Klasifikasi Otomatis Algoritma ESI v4
Sistem *Triage Clinical Engine* NurseFlow secara otomatis mengevaluasi parameter klinis:

```
                    +--------------------------------+
                    |  Apakah Pasien Butuh Tindakan  |
                    |  Resusitasi Segera / Henti     |  YA  -->  [ ESI 1: RESUSITASI ]
                    |  Jantung / Henti Nafas?        |           Respon: 0 Menit (Cito)
                    +--------------------------------+
                                   | TIDAK
                                   v
                    +--------------------------------+
                    |  Apakah Pasien Berada Dalam    |
                    |  Risiko Tinggi / Penurunan     |  YA  -->  [ ESI 2: EMERGENT ]
                    |  Kesadaran / Nyeri Ekstrem?    |           Respon: <= 10 Menit
                    +--------------------------------+
                                   | TIDAK
                                   v
                    +--------------------------------+
                    |  Berapa Banyak Sumber Daya     |
                    |  Diagnostik / Terapi Dibutuh-  |
                    |  kan Pasien?                   |
                    +--------------------------------+
                      /            |               \
                     /             |                \
              2+ Sumber Daya  1 Sumber Daya    0 Sumber Daya
                    v              v                v
             [ ESI 3: URGENT ] [ ESI 4: SEMI ]  [ ESI 5: NON ]
             Respon: <= 30 mnt Respon: <= 60 mnt Respon: <= 120 mnt
```

* **Hasil pada Pasien Simulasi:** Karena GCS = 12 (penurunan kesadaran) dan defisit neurologis akut dengan TD 185/110 mmHg, badge klasifikasi menyala jingga: **`🟠 ESI 2 (HIGH RISK / CONFUSED / SEVERE PAIN)`**.

## 3.6 Finalisasi Asesmen Triase & Stopwatch SLA
1. Pastikan seluruh kolom bertanda bintang `*` telah terisi.
2. Pada kolom **Keluhan Utama**, ketik: *"Penurunan kesadaran mendadak sejak 35 menit lalu, bicara pelo, muntah proyektil, kelemahan anggota gerak kanan."*
3. Klik tombol biru: **`Simpan Asesmen Triase & Mulai Stopwatch SLA`**.
4. Sistem memunculkan notifikasi sukses hijau, memindahkan layar ke **IGD Command Center**, dan menyalakan timer SLA KARS PMKP waktu tanggap dokter.

---

> ### ⚠️ KOTAK PERINGATAN KESELAMATAN (PERAWAT TRIASE)
> 1. **DILARANG MENUNGGU ADMINISTRASI:** Jangan pernah menunda pengkajian ABCDE atau pemberian oksigen hanya karena pasien belum terdaftar di loket admisi.
> 2. **DILARANG MEMINTA KTP SEBELUM TRIASE:** Keselamatan pasien adalah prioritas mutlak. Pembuatan nomor MR darurat (`Mr. X`) menjamin tindakan medis dapat langsung diorder.
> 3. **PASANG GELANG IDENTITAS SEGERA (JCI IPSG 1):** Pasang gelang identitas darurat pada pergelangan tangan pasien yang memuat Nama (`Mr. X`), No. MR sementara (`MRX-...`), dan Tanggal Lahir/Perkiraan Umur.
> 4. **PASANG GELANG KUNING RISIKO JATUH (JCI IPSG 6):** Pasien dengan penurunan kesadaran (GCS 12) atau stroke **WAJIB** langsung dipasangi klip/gelang risiko jatuh warna kuning dan penghalang tempat tidur (*bedrails*) dinaikkan.

---

# BAB 4: MODUL PENDAFTARAN & ADMISI (PANDUAN PETUGAS FRONT OFFICE & HIM)

## 4.1 Mengklaim Pasien Anonim di Front Office
Ketika perawat triase membuat pasien darurat `Mr. X`, data tersebut langsung masuk ke antrean admisi:
1. Buka menu **`Pasien & EMPI`** ➔ **`Antrean Registrasi / Front Office`** (URL: `/front-office`).
2. Tab **`Meja Pendaftaran`** akan menampilkan baris pasien berlabel merah muda: `Tn. Mr. X (2252)` dengan status `EMERGENCY_ACTIVE`.
3. Petugas admisi menetapkan penjamin awal sebagai `Jasa Raharja (Kecelakaan)` atau `Darurat Kemenkes / Umum Sementara` agar tagihan awal tindakan resusitasi dapat diproses.

## 4.2 Mendaftarkan Identitas Asli dari KTP / Kartu BPJS
Ketika keluarga pasien tiba di loket pendaftaran dan menyerahkan dokumen identitas resmi:
1. Masuk ke menu **`Pasien & EMPI`** ➔ **`Pencarian & EMPI Guard`** (URL: `/patients`).
2. Klik tombol biru **`+ Registrasi Pasien Baru (EMPI Gateway)`**.
3. Isi data sesuai e-KTP dan Kartu BPJS Kesehatan:
   * **Nama Lengkap:** `Tn. Hendra Setiawan, S.T`
   * **Nomor Induk Kependudukan (NIK 16 Digit):** `3171051508820001`
   * **Tanggal Lahir:** `1982-08-15` (Usia: 44 Tahun)
   * **Jenis Kelamin:** `Laki-Laki`
   * **Nomor WhatsApp / HP:** `081299887766`
   * **Penjamin Biaya:** Pilih `BPJS Kesehatan (JKN)`
   * **Nomor Kartu BPJS:** `0001234567890`
   * **Riwayat Alergi:** `Penicillin G, Sulfa`
4. Klik tombol **`Daftarkan Pasien Master`**. Sistem akan menerbitkan Nomor Rekam Medis Definitif: `MRN-2026-142171`.

## 4.3 Menjalankan Penggabungan Rekam Medis (EMPI Identity Merge Guard)
Untuk menyatukan tindakan medis yang sudah dilakukan pada pasien `Mr. X` ke rekam medis definitif `Tn. Hendra Setiawan, S.T`:
1. Pada menu **`Pencarian & EMPI Guard`**, pilih pasien `Tn. Hendra Setiawan, S.T`.
2. Klik tombol aksi **`EMPI Duplicate & Identity Merge Guard`**.
3. Sistem membuka jendela modal verifikasi merger:
   * **Primary Master Record (Definitif):** `MRN-2026-142171` (`Tn. Hendra Setiawan, S.T`)
   * **Secondary Emergency Record (Sementara):** `MRX-20260817-2252` (`Tn. Mr. X`)
4. Periksa kecocokan data visual: jam kedatangan, keluhan stroke, dan bed penempatan IGD.
5. Masukkan alasan merger: *"Keluarga membawa e-KTP & kartu BPJS asli atas nama Tn. Hendra Setiawan, S.T"*.
6. Klik tombol merah: **`Execute Legal Merge (JCI HIM Standard)`**.
7. **Hasil Sistem:** Seluruh catatan triase perawat, hasil laboratorium, pembacaan radiologi, dan status bed otomatis bermigrasi ke `MRN-2026-142171` tanpa ada data yang hilang (*Zero Clinical Data Loss*).

---

> ### ⚠️ KOTAK PERINGATAN KESELAMATAN (PETUGAS ADMISI)
> 1. **JANGAN MEMBUAT REKAM MEDIS GANDA:** Jika pasien sebelumnya pernah berobat di RS ini, cari NIK terlebih dahulu di database EMPI. Jangan membuat nomor RM baru jika nomor RM lama sudah ada.
> 2. **WAJIB MERGE BUKAN HAPUS:** Dilarang keras menghapus (*delete*) data pasien `Mr. X`. Tindakan medis yang sudah terjadi pada `Mr. X` memiliki konsekuensi legal dan finansial yang wajib dipertahankan melalui mekanisme **EMPI Merge**.
> 3. **VERIFIKASI FISIK DUA PERAWAT:** Sebelum melakukan merger rekam medis darurat, konfirmasi nomor bed dan gelang fisik ke perawat penanggung jawab IGD.

---

# BAB 5: MODUL ASESMEN KEPERAWATAN & RISIKO JATUH (PANDUAN PERAWAT IGD)

## 5.1 Navigasi Asesmen Keperawatan
1. Pada menu sidebar, klik **`Pelayanan Klinis`** ➔ **`Nursing Workspace & eMAR`** (URL: `/nursing`).
2. Pilih pasien `Tn. Hendra Setiawan, S.T` dari daftar pasien aktif.
3. Klik tab **`Pengkajian & SDKI/SIKI`**.

## 5.2 Pengkajian Risiko Jatuh Skala Morse (Morse Fall Scale - JCI IPSG 6)
Isi instrumen pengkajian risiko jatuh:

| Parameter Morse Fall Scale | Pilihan Klinis Pasien | Skor |
|---|---|:---:|
| 1. Riwayat jatuh dalam 3 bulan terakhir | Tidak | 0 |
| 2. Diagnosis sekunder ($\ge 2$ diagnosis medis) | Ya (Stroke Akut + Hipertensi) | 15 |
| 3. Alat bantu jalan | Tidak ada / Tirah baring dibantu perawat | 0 |
| 4. Terpasang infus intravena / heparin lock | Ya (Terpasang IVFD NaCl 0.9%) | 20 |
| 5. Gaya berjalan / berpindah | Gangguan mobilitas berat (Hemiparesis) | 20 |
| 6. Status mental | Disorientasi / Penurunan kesadaran (GCS 12) | 15 |
| **TOTAL SKOR MORSE** | **RISIKO TINGGI JATUH (HIGH FALL RISK)** | **70** |

* **Intervensi Wajib Perawat:** Pasang tanda segitiga jatuh warna kuning di atas bed, pasang gelang kuning di pergelangan tangan kiri, kunci roda tempat tidur (*bed brakes*), dan posisikan tombol pemanggil perawat (*nurse call*) dalam jangkauan.

## 5.3 Skrining Alergi Obat & Makanan (JCI IPSG 1)
1. Periksa riwayat alergi: Pasien memiliki riwayat alergi `Penicillin G` dan `Sulfa`.
2. Klik tombol **`+ Tag High-Alert Allergy`** pada formulir keperawatan.
3. Sistem secara otomatis memunculkan **Allergy Warning Banner** merah menyala di seluruh modul (Doctor Workspace, Farmasi, dan eMAR) guna mencegah resep antibiotik golongan penisilin.

---

# BAB 6: MODUL EMR & CPPT DOKTER DPJP (PANDUAN DOKTER IGD / SPESIALIS)

## 6.1 Navigasi Lembar Konsultasi SOAP Dokter
1. Buka menu **`Pelayanan Klinis`** ➔ **`Doctor Workspace (SOAP)`** (URL: `/doctor-workspace`).
2. Pada tab **`Antrean Pasien (Worklist)`**, cari pasien `Tn. Hendra Setiawan, S.T`.
3. Klik tombol biru: **`Buka Konsultasi (SOAP) ➔`**.
4. Layar akan memuat lembar kerja CPPT terintegrasi dengan data tanda vital triase yang terisi otomatis.

## 6.2 Pengisian Format SOAP Terintegrasi (Permenkes No. 24/2022)

### A. Subjective (S) - Anamnesis / Alloanamnesis:
> *"Pasien laki-laki 58 tahun dibawa ambulans dengan keluhan penurunan kesadaran mendadak sejak 35 menit SMRS saat sedang rapat kerja. Menurut keluarga (istri), pasien tiba-tiba memegang kepala mengeluh nyeri kepala hebat mendadak (thunderclap), bicara pelo, lalu muntah menyemprot 2 kali dan lengan serta tungkai kanan mendadak lemas tidak dapat digerakkan. Riwayat hipertensi 10 tahun tidak teratur minum obat. Riwayat DM disangkal. Alergi obat: Penicillin dan Sulfa."*

### B. Objective (O) - TTV & Status Generalis / Neurologis:
* **TTV Terverifikasi:** TD 185/110 mmHg, HR 96 x/m, RR 24 x/m, SpO2 92% (udara ruangan), Suhu 36.8°C.
* **Status Generalis:** Mata: Konjungtiva anemis (-/-), Sklera ikterik (-/-). Thoraks: Cor S1-S2 murni reguler, Pulmo vesikuler (+/+), ronki (-/-), wheezing (-/-). Abdomen: Supel, bising usus normal, nyeri tekan (-). Ekstremitas: Akral hangat, CRT $< 2$ detik, edema (-/-).
* **Status Neurologis:** 
  * GCS: **E3 V4 M5 (Total: 12)**.
  * Pupil: Isokor $\varnothing\ 3\text{mm} / 3\text{mm}$, Refleks Cahaya Langsung $(+/+)$, Tidak Langsung $(+/+)$.
  * Nervus Kranialis: Parese N. VII dan N. XII dekstra tipe sentral (UMN).
  * Motorik: Ekstremitas Dekstra $3/3$, Ekstremitas Sinistra $5/5$.
  * Refleks Fisiologis: BPR $+3/+2$, TPR $+3/+2$, KPR $+3/+2$, APR $+3/+2$.
  * Refleks Patologis: Babinski Dekstra $(+)$, Chaddock Dekstra $(+)$, Sinistra $(-)$.
  * Rangsang Meningeal: Kaku kuduk $(-)$, Kernig $(-)$, Brudzinski I-II $(-)$.

### C. Assessment (A) - Diagnosis Kerja ICD-10 Standar:
Pada kolom pencarian diagnosis ICD-10:
1. **Diagnosis Utama:** Ketik `I63.9` ➔ Pilih **`I63.9 - Cerebral infarction, unspecified (Stroke Non-Hemorrhagic Akut Onset Baru Onset < 3 Jam)`**.
2. **Diagnosis Sekunder:** Ketik `I10` ➔ Pilih **`I10 - Essential (primary) hypertension (Krisis Hipertensi / Urgensi)`**.

### D. Plan (P) - Rencana Terapi, Monitoring & Disposisi:
Ketik instruksi komprehensif pada lembar kerja:
1. **Airway & Breathing:** O2 kanul nasal 3–4 liter/menit, pertahankan SpO2 $\ge 95\%$.
2. **Diagnostik CITO:**
   * CITO CT-Scan Kepala Non-Kontras (Protokol Stroke Akut).
   * CITO Panel Laboratorium: Darah Lengkap, GDS, Elektrolit, Faal Hemostasis (PT/APTT/INR), Ureum, Kreatinin, Troponin-I.
   * EKG 12-Lead (Skrining Fibrilasi Atrium).
3. **Medikamentosa & Stabilisasi Hemodinamik:**
   * IVFD NaCl 0.9% 1500 ml / 24 jam via infus pump.
   * Target penurunan tekanan darah bertahap: Turunkan MAP maksimal 15–20% dalam 24 jam pertama (hindari hipotensi mendadak).
   * Injeksi Citicoline 500 mg / 12 jam IV.
   * Injeksi Ranitidine 50 mg / 12 jam IV (Gastroprotektor).
   * Amlodipine 10 mg tab 1x1 p.o (via NGT jika disfagia berat).
   * Clopidogrel 75 mg tab (1x1 p.o pasca CT-Scan membuktikan non-hemoragik).
4. **Disposisi Klinis:** Pilih **`INPATIENT_ADMISSION`** (Rencana Transfer ke Bangsal Rawat Inap Biasa / Stroke Unit Terpadu).

## 6.3 Penandatanganan Digital Rekam Medis (Digital Signature BSrE)
1. Klik tombol hijau: **`Simpan & Tanda Tangani Elektronik (BSrE Ready)`**.
2. Sistem mengunci dokumen CPPT secara permanen (*immutable cryptographically sealed record*), menghasilkan barcode digital signature dengan timestamp ISO, dan mengirimkan notifikasi order otomatis ke modul Lab, Radiologi, dan Farmasi.

---

> ### ⚠️ KOTAK PERINGATAN KESELAMATAN (DOKTER DPJP)
> 1. **WAJIB KODE DIAGNOSIS ICD-10:** Dilarang menyimpan rekam medis tanpa kode ICD-10 valid guna mencegah penolakan klaim BPJS Kesehatan (*V-Claim 2.0*) dan ketidaksesuaian rekam medis KARS.
> 2. **DILARANG INSTRUKSI VERBAL TANPA DOKUMENTASI (JCI IPSG 2):** Seluruh permintaan obat dan tindakan penunjang wajib dimasukkan ke menu **CPOE (Computerized Physician Order Entry)**. Jika dalam kondisi darurat ekstrem menggunakan telepon, penerima pesan wajib melakukan protokol **TBaK (Tulis, Baca, Konfirmasi / Read-Back)** dalam $< 24$ jam.
> 3. **ALERT KONTRAINDIKASI ALERGI:** Sistem akan menolak resep otomatis jika dokter meresepkan antibiotik turunan penisilin atau sulfa pada pasien ini.

---

# BAB 7: MODUL LABORATORIUM KLINIS / LIS (PANDUAN ANALIS LABORATORIUM)

## 7.1 Alur Pemesanan & Pengambilan Sampel (LIS CPOE)
1. Perawat IGD membuka menu **`Layanan Diagnostik`** ➔ **`Laboratorium (LIS)`** (URL: `/lab`).
2. Order dokter untuk pasien `Tn. Hendra Setiawan, S.T` otomatis muncul pada tab **`Flebotomi & Accessioning`**:
   * *Paket Darah Lengkap (CBC)* ➔ Tabung Ungu (EDTA).
   * *Gula Darah Sewaktu (GDS) & Elektrolit (Na, K, Cl)* ➔ Tabung Kuning (SST Gel).
   * *Faal Hemostasis (PT, APTT, INR)* ➔ Tabung Biru Terang (Natrium Sitrat 3.2%).
   * *Troponin-I Cito* ➔ Tabung Merah / Kuning.
3. Klik tombol **`Cetak Barcode Spesimen`** dan tempelkan stiker barcode unik pada masing-masing tabung vacutainer di depan pasien setelah verifikasi 2 identitas (Nama & Tanggal Lahir).
4. Update status sampel: `COLLECTED` ➔ `IN_TRANSIT_TO_LAB`.

## 7.2 Entri Hasil & Validasi Analis Laboratorium
1. Petugas analis lab membuka workstation LIS pada tab **`Workstation Analitikal & Validasi Sp.PK`**.
2. Scan barcode tabung atau pilih nama pasien `Tn. Hendra Setiawan, S.T`.
3. Masukkan hasil uji kuantitatif dari mesin *Auto-Analyzer*:

| Parameter Uji | Nilai Hasil | Nilai Rujukan | Interpretasi Klinis |
|---|---|---|---|
| Hemoglobin | **14.2** g/dL | 13.0 – 17.5 | Normal |
| Leukosit | **9,800** /uL | 4,500 – 11,000 | Normal |
| Trombosit | **245,000** /uL | 150,000 – 450,000 | Normal |
| Hematokrit | **42.5** % | 40.0 – 52.0 | Normal |
| Gula Darah Sewaktu (GDS) | **148** mg/dL | 70 – 140 | Sedikit Meningkat (Stress Hyperglycemia) |
| Natrium (Na) | **138** mEq/L | 135 – 147 | Normal |
| Kalium (K) | **4.1** mEq/L | 3.5 – 5.0 | Normal |
| Klorida (Cl) | **101** mEq/L | 95 – 105 | Normal |
| PT (Prothrombin Time) | **12.4** detik | 11.0 – 15.0 | Normal |
| APTT | **31.2** detik | 25.0 – 35.0 | Normal |
| INR | **1.02** | 0.8 – 1.2 | Normal |
| Troponin-I Kuantitatif | **0.02** ng/mL | < 0.04 | Negatif (Tidak ada infark miokard) |

## 7.3 Protokol Nilai Kritis (Critical Value Alert - JCI IPSG 2)
Jika terdapat parameter yang masuk kategori kritis (contoh: *GDS > 400 mg/dL* atau *Kalium < 2.5 mEq/L*):
1. Sistem LIS otomatis memicu **Lampu Peringatan Merah Berkedip** di pojok kanan atas layar dokter dan perawat IGD.
2. Analis laboratorium wajib menelepon perawat IGD dalam waktu **$\le 15$ menit** sejak hasil tervalidasi.
3. Catat di sistem: Nama Penerima Telepon, Jam Lapor, dan konfirmasi bahwa perawat telah melakukan *Read-Back* (TBaK).

---

# BAB 8: MODUL RADIOLOGI PACS & DICOM VIEWER (PANDUAN RADIOGRAFER & SP.RAD)

## 8.1 Modality Worklist (MWL) & Eksekusi Pemindaian
1. Radiografer membuka menu **`Layanan Diagnostik`** ➔ **`PACS & DICOM Web Viewer`** (URL: `/pacs`).
2. Pada panel **`Modality Worklist (MWL)`**, order CITO dokter langsung terbaca:
   * **Jenis Pemeriksaan:** `CT Scan Kepala Non-Kontras CITO (Protokol Stroke Akut)`
   * **No. Aksesi:** `ACC-20260817-02` | **Modalitas:** `CT` | **Prioritas:** `STAT / CITO`
3. Radiografer membawa pasien ke ruang CT-Scan, memposisikan kepala pasien, dan melakukan pemindaian irisan aksial 5mm dari basis kranii hingga verteks.
4. Mesin CT-Scan mengirimkan citra DICOM langsung ke server PACS NurseFlow via protokol `DICOM C-STORE / STOW-RS`.

## 8.2 Evaluasi Citra pada PACS DICOM Web Viewer
Dokter DPJP dan Dokter Spesialis Radiologi dapat langsung menginspeksi citra tanpa menginstal software pihak ketiga:
1. Buka tab **`DICOM Viewer`** pada modul PACS.
2. Gunakan alat manipulasi citra:
   * **VOI LUT / Windowing Presets:** Pilih preset **`Brain Window (WL: 40, WW: 80)`** untuk mendeteksi edema sitotoksik dini / hilangnya diferensiasi substansia grisea-alba, atau **`Bone Window (WL: 400, WW: 2000)`** untuk menyingkirkan fraktur kranii.
   * **Zoom & Pan:** Perbesar area ganglia basalis dan kapsula interna sinistra/dekstra.
   * **Measure / Kaliper:** Ukur densitas jaringan dalam satuan Hounsfield Unit (HU).
3. **Hasil Temuan Citra:**
   * Tidak tampak lesi hiperdens (perdarahan intrakranial akut disingkirkan / non-hemoragik).
   * Tampak area hipodens samar (*early ischemic sign*) pada regio kapsula interna dan lobus temporoparietal dekstra.
   * Sulsi dan ventrikel dalam batas normal, tidak tampak deviasi *midline shift*.

## 8.3 Pengisian Ekspertise Radiolog & Rilis Hasil
1. Dokter Spesialis Radiologi mengetik ekspertise pada tab **`Ekspertise Sp.Rad`**:
   > **Kesimpulan:** *"Infark serebri akut (stroke iskemik) regio kapsula interna dekstra. Tidak tampak tanda-tanda perdarahan intrakranial akut maupun massa intrakranial."*
2. Klik **`Validasi & Rilis Hasil ke EMR`**. Hasil langsung tampil di lembar CPPT DPJP.

---

# BAB 9: MODUL FARMASI ENTERPRISE & FEFO (PANDUAN APOTEKER KLINIS)

## 9.1 Penerimaan Resep Elektronik & Telaah 7-Prinsip (JCI MMU)
1. Apoteker IGD membuka menu **`Farmasi Enterprise`** ➔ **`Multi-Depot FEFO & Telaah Resep`** (URL: `/farmasi-fefo`).
2. Klik tab **`Telaah & Dispensing`**. Resep CPOE pasien `Tn. Hendra Setiawan, S.T` akan berada di antrean teratas.
3. Sistem CDSS (*Clinical Decision Support System*) menampilkan hasil skrining:
   * *Alergi:* Pasien alergi Penicillin $\rightarrow$ Resep aman (tidak mengandung beta-laktam).
   * *Interaksi Obat:* Amlodipine + Clopidogrel $\rightarrow$ Tidak ditemukan interaksi mayor kontraindikasi.
4. Lakukan verifikasi **7-Prinsip Telaah Resep Farmasi Klinis (Permenkes No. 73/2016)** dengan mencentang kotak:
   * [x] 1. Tepat Pasien
   * [x] 2. Tepat Obat
   * [x] 3. Tepat Dosis
   * [x] 4. Tepat Rute
   * [x] 5. Tepat Waktu
   * [x] 6. Tepat Dokumentasi
   * [x] 7. Tepat Indikasi

## 9.2 Pengambilan Obat Berbasis FEFO & Pelabelan Etiket Barcode
1. Sistem menampilkan daftar lot batch obat berdasarkan kedaluwarsa terdekat (**First-Expired First-Out**):
   * `Citicoline 500 mg Injeksi` ➔ Lot `LOT-CIT-2026A` (Exp: 2026-12-31) ➔ Potong stok 2 ampul.
   * `Ranitidine 50 mg Injeksi` ➔ Lot `LOT-RAN-2026C` (Exp: 2027-02-28) ➔ Potong stok 2 ampul.
   * `Amlodipine 10 mg Tablet` ➔ Lot `LOT-AML-2027A` (Exp: 2027-08-31) ➔ Potong stok 10 tablet.
   * `Infus NaCl 0.9% 500 ml` ➔ Lot `LOT-NACL-2027` ➔ Potong stok 3 kolf.
2. Apoteker mencetak label etiket obat yang memuat **Barcode 2D Unik**, Nama Pasien, No. RM, Aturan Pakai, dan Tanda Peringatan Khusus.
3. Klik tombol: **`Verifikasi Resep & Potong Stok FEFO`**. Obat diserahkan ke ruang perawat IGD.

---

# BAB 10: MODUL eMAR ADMINISTRASI OBAT (PANDUAN PERAWAT PELAKSANA)

## 10.1 Navigasi Jadwal eMAR Pasien
1. Perawat membuka menu **`Pelayanan Klinis`** ➔ **`Nursing Workspace & eMAR`** (URL: `/nursing`).
2. Klik tab **`eMAR (5-Benar Obat)`**.
3. Sistem menyusun jadwal pemberian obat pasien dalam rentang 24 jam secara kronologis (*Shift Pagi, Siang, Malam*).

## 10.2 Proses Closed-Loop Barcode Medication Administration (BCMA)
Sebelum menyuntikkan atau memberikan obat kepada pasien:
1. Klik tombol **`Berikan Obat`** pada jadwal obat terkait (misal: *Citicoline 500mg IV*).
2. Sistem membuka modal verifikasi administrasi obat:
   * **Langkah 1:** Arahkan scanner barcode ke **Gelang Pasien** $\rightarrow$ Sistem memvalidasi identitas pasien (JCI IPSG 1).
   * **Langkah 2:** Arahkan scanner barcode ke **Etiket Obat** $\rightarrow$ Sistem mencocokkan formula obat, dosis, dan rute (JCI IPSG 3).
3. Jika barcode cocok, sistem memberikan konfirmasi centang hijau **5-Benar Obat (Tepat Pasien, Obat, Dosis, Rute, Waktu)**.

## 10.3 Protokol Verifikasi Ganda Obat Kewaspadaan Tinggi (High-Alert Dual Check)
Jika obat yang diberikan masuk kategori **High-Alert / Narkotika / Elektrolit Pekat / Infus Drip Titrasi** (contoh: *Insulin Drip, Nicardipine Drip, Heparin, Kalium Klorida Pekat*):
1. Layar sistem akan mengunci dan memunculkan jendela **`High-Alert Dual Sign-Off Verification`**.
2. **Perawat Primer (Pemberi):** Memasukkan User ID & PIN verifikasi.
3. **Perawat Sekunder (Saksi Independen):** Melakukan pengecekan fisik konsentrasi obat pada spuit/infus pump, lalu memasukkan User ID & PIN saksi.
4. Klik **`Konfirmasi Administrasi Obat (Mark as GIVEN)`**.
5. Waktu pemberian, dosis aktual, dan identitas kedua perawat otomatis tercatat dalam log audit yang tidak dapat diubah (*immutable audit trail*).

---

# BAB 11: MODUL SPRI & ADT BED MANAGEMENT (PANDUAN TRANSFER RAWAT INAP)

## 11.1 Penerbitan Surat Perintah Rawat Inap (SPRI / Admission Order)
Setelah kondisi hemodinamik pasien terstabilisasi di IGD dan hasil CT-Scan mengonfirmasi stroke iskemik:
1. Dokter DPJP membuka Doctor Workspace, klik tombol **`Terbitkan SPRI / Admission Order`**.
2. Pilih unit perawatan tujuan: **`Bangsal Rawat Inap Medikal Dewasa (Bangsal Mawar)`**.
3. Tetapkan kriteria ruang: *Kamar Rawat Inap Biasa Kelas 1 (2 Tempat Tidur) dengan fasilitas Oksigen Sentral & Monitoring TTV*.
4. Dokter menandatangani SPRI secara elektronik.

## 11.2 Alokasi Tempat Tidur Melalui ADT Bed Management Center
1. Petugas Admisi / Perawat membuka menu **`Riwayat Kunjungan (Encounters)`** atau **`Bed Management Center`** (URL: `/encounters`).
2. Sistem menampilkan denah interaktif seluruh bangsal rumah sakit.
3. Pada **Bangsal Mawar**, cari tempat tidur yang berstatus hijau **`🟢 VACANT / SANITIZED`** (Contoh: `Bed Mawar 301-B`).
4. Klik bed tersebut dan pilih opsi **`Tempatkan Pasien (Allocate Bed)`**.
5. Masukkan No. RM `MRN-2026-142171` (`Tn. Hendra Setiawan, S.T`).
6. Status bed seketika berubah menjadi **`🔴 OCCUPIED`**, mengunci ketersediaan bed agar tidak terjadi alokasi ganda (*Anti Double-Booking Guard*).

---

# BAB 12: SERAH TERIMA PASIEN SBAR (INTER-DEPARTMENTAL HANDOVER)

Sesuai standar **JCI IPSG 2** dan **KARS SKP 2**, proses transfer pasien antar unit (IGD ke Rawat Inap) **WAJIB** menggunakan teknik komunikasi terstruktur **SBAR (Situation, Background, Assessment, Recommendation)**:

```
+----------------------------------------------------------------------------------------------------+
|                       FORMULIR TRANSFER INTERNAL PASIEN ANTAR-RUANGAN (SBAR)                       |
+----------------------------------------------------------------------------------------------------+

1. SITUATION (S):
   * Nama Pasien     : Tn. Hendra Setiawan, S.T | No. RM: MRN-2026-142171 | Usia: 44 Th (Laki-Laki)
   * DPJP Penanggung : dr. Budi Santoso, Sp.B / dr. Neurologi Sp.N
   * Ruang Asal      : Instalasi Gawat Darurat (Bed RES-01 / Akut)
   * Ruang Tujuan    : Bangsal Mawar (Kamar 301-B, Kelas 1)
   * Diagnosis Masuk : Stroke Non-Hemorrhagic Akut Onset Baru (ICD-10: I63.9) + Krisis Hipertensi (I10)
   * Keluhan Terkini : Kesadaran membaik (GCS 13-14), hemiparesis dekstra kekuatan 3/3, bicara masih pelo

2. BACKGROUND (B):
   * Riwayat Penyakit : Hipertensi kronis 10 tahun tidak terkontrol.
   * Riwayat Alergi   : ALERGI PENICILLIN G DAN SULFA (Gelang Merah Terpasang).
   * Tindakan di IGD  : Stabilisasi ABC, O2 kanul nasal 3 lpm, CT-Scan kepala non-kontras (hasil: infark
                        kapsula interna dekstra, perdarahan disingkirkan), IVFD NaCl 0.9% 20 tpm lancar.
   * Terapi Diberikan : Injeksi Citicoline 500mg IV (Jam 08:30), Injeksi Ranitidine 50mg IV (Jam 08:30).

3. ASSESSMENT (A):
   * Tanda Vital Saat Transfer : TD: 150/95 mmHg (MAP terkontrol), HR: 84 x/m, RR: 20 x/m, SpO2: 97% O2
   * Status Neurologis         : GCS E4 V4 M5 (13), Pupil Isokor 3mm/3mm RC (+/+), Babinski Dekstra (+)
   * Skor Risiko Jatuh         : Morse Fall Scale = 70 (RISIKO TINGGI - Gelang Kuning Terpasang)
   * Status Akses & Alat Medis : IV Catheter No. 20G di dorsum manus sinistra (hari ke-1, flebitis -),
                                 Kateter Urin No. 16F (produksi urin 150cc kuning jernih / 2 jam).

4. RECOMMENDATION (R):
   * Monitoring TTV & GCS berkala setiap 2-4 jam di bangsal.
   * Lanjutkan terapi IVFD NaCl 0.9% 1500cc/24 jam dan jadwal injeksi Citicoline 500mg/12 jam (Next: 20:30).
   * Berikan terapi oral Amlodipine 10mg p.o malam ini jika TD sistolik > 140 mmHg.
   * Tirah baring posisi head-up 30 derajat, pasang bedrails kedua sisi.
   * Konsultasi Fisioterapi / Rehabilitasi Medik untuk mobilisasi bertahap pasca 24 jam stabilisasi.
   * Jadwalkan Rawat Bersama Spesialis Neurologi (dr. Sp.N) shift pagi besok.

+----------------------------------------------------------------------------------------------------+
| Tanda Tangan Digital Perawat Pengirim (IGD)   | Tanda Tangan Digital Perawat Penerima (Bangsal)    |
| Ns. Sarah Amelia, S.Kep (NIP: 19940815-001)   | Ns. Ratna Dewi, S.Kep (NIP: 19960212-004)          |
| Tanggal/Jam: 17 Agustus 2026 - Pukul 09:15 WIB| Tanggal/Jam: 17 Agustus 2026 - Pukul 09:20 WIB     |
+----------------------------------------------------------------------------------------------------+
```

Setelah kedua perawat menandatangani formulir SBAR secara digital:
1. Status Encounter pasien resmi bertransisi dari **`EMERGENCY`** menjadi **`INPATIENT`**.
2. Pasien secara sah menjadi tanggung jawab tim keperawatan rawat inap bangsal.

---

# BAB 13: MATRIKS HAK AKSES & KEWENANGAN KLINIS (RBAC GOVERNANCE)

Untuk menjamin keamanan data medis pasien sesuai ISO 27001 dan UU PDP No. 27/2022:

| Modul / Fitur Sistem | Perawat Triase | Petugas Admisi | Dokter DPJP | Analis Lab | Radiografer / Sp.Rad | Farmasis Klinis | Perawat Rawat Inap |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Rapid Triase & Pasien Anonim (Mr. X)** | **PENUH (R/W)** | Baca (R) | Baca (R) | - | - | - | Baca (R) |
| **Registrasi EMPI & Merge Guard** | Baca (R) | **PENUH (R/W)** | - | - | - | - | - |
| **Pengkajian Keperawatan & Morse** | **PENUH (R/W)** | - | Baca (R) | - | - | - | **PENUH (R/W)** |
| **CPPT SOAP Medis & ICD-10** | Baca (R) | - | **PENUH (R/W)** | - | - | - | Baca (R) |
| **Penerbitan CPOE Diagnostik** | Verifikasi | - | **PENUH (R/W)** | - | - | - | Verifikasi |
| **Validasi Hasil Lab (LIS)** | Baca (R) | - | Baca (R) | **PENUH (R/W)** | - | - | Baca (R) |
| **Ekspertise Radiologi (PACS)** | Baca (R) | - | Baca (R) | - | **PENUH (R/W)** | - | Baca (R) |
| **Telaah Resep & FEFO Dispensing**| - | - | - | - | - | **PENUH (R/W)** | - |
| **Administrasi Obat (eMAR)** | **PENUH (R/W)** | - | Baca (R) | - | - | Baca (R) | **PENUH (R/W)** |
| **Penerbitan SPRI Rawat Inap** | - | Baca (R) | **PENUH (R/W)** | - | - | - | - |
| **Alokasi Bed Bangsal & ADT** | Baca (R) | **PENUH (R/W)** | Baca (R) | - | - | - | **PENUH (R/W)** |
| **Serah Terima SBAR Transfer** | **PENUH (R/W)** | Baca (R) | Baca (R) | - | - | - | **PENUH (R/W)** |

*Keterangan:* `PENUH (R/W)` = Hak Akses Baca dan Tulis/Eksekusi; `Baca (R)` = Hak Akses Lihat Data Saja; `-` = Tidak Memiliki Izin Akses.

---

# BAB 14: INDIKATOR MUTU KLINIS, SLA & AUDIT AKREDITASI (KARS PMKP & JCI)

Seluruh aktivitas staf terekam secara otomatis dalam *Continuous Quality Improvement (CQI) Dashboard*:

| Indikator Keselamatan & Mutu | Standar Acuan | Target SLA Mutu | Dampak Kegagalan SLA |
|---|---|:---:|---|
| **Door-to-Triage Time** | KARS PMKP & ESI v4 | **$\le 2$ Menit** | Keterlambatan identifikasi henti nafas/jantung |
| **Door-to-Doctor Time (ESI 1)** | JCI COP 3 / Resusitasi | **$0$ Menit (Segera)** | Kematian sel otak / henti sirkulasi permanen |
| **Door-to-Doctor Time (ESI 2)** | JCI COP 3 / Emergent | **$\le 10$ Menit** | Perluasan area infark stroke / syok ireversibel |
| **Door-to-CT Scan Brain (Stroke)**| AHA/ASA Stroke Guideline| **$\le 25$ Menit** | Hilangnya *golden period* trombolisis / tindakan Cito |
| **Critical Value Reporting Time** | JCI IPSG 2 / KARS SKP 2 | **$\le 15$ Menit** | Pasien mengalami aritmia fatal / krisis metabolik |
| **Medication Administration Error**| JCI IPSG 3 & MMU | **$0$ Insiden (Zero Error)** | Kejadian Tidak Diharapkan (KTD) / Syok Anafilaksis |
| **High-Alert Dual-Sign Compliance**| JCI IPSG 3 | **$100\%$ Terverifikasi** | Overdosis obat keras / kematian akibat kalium pekat |
| **SBAR Handover Completeness** | JCI IPSG 2 / Transfer SOP| **$100\%$ Lengkap** | Miskomunikasi rencana terapi & salah identifikasi pasien |

---

# BAB 15: PANDUAN TROUBLESHOOTING, FAQ & PROTOKOL SHADOW MODE

## 15.1 Pertanyaan Sering Diajukan (FAQ) Lapangan

### Q1: Apa yang harus dilakukan jika scanner barcode eMAR di kamar pasien mati/rusak?
* **Jawaban:** Gunakan input manual verifikasi 2 identitas (Nama Pasien + Tanggal Lahir) pada modal darurat eMAR, masukkan alasan bypass scanner (*"Barcode scanner hardware error"*), dan laporkan segera ke tim IT Support (Ext. 101). Jangan pernah memberikan obat tanpa verifikasi identitas visual.

### Q2: Bagaimana jika pasien darurat anonim Mr. X ternyata meninggal sebelum identitas aslinya ditemukan?
* **Jawaban:** Tetap gunakan nomor rekam medis `MRX-...`. Petugas admisi bersama kepolisian/forensik akan menerbitkan Berita Acara Pasien Anonim (BAPA). Seluruh rekam medis triase dan tindakan resusitasi ditutup dengan status `DISCHARGED_DECEASED`. Dilarang menghapus rekam medis tersebut.

### Q3: Apakah dokter spesialis di luar rumah sakit bisa membaca CT-Scan dan menyetujui SPRI?
* **Jawaban:** Ya. NurseFlow HIS memiliki fitur *Web DICOM Viewer* dan *Tele-Consultation Portal* yang dapat diakses secara aman oleh dokter konsulen melalui tablet/smartphone terenkripsi SSL.

## 15.2 Protokol Uji Coba Lapangan (Shadow Mode Protocol)
Sebelum implementasi *Full Go-Live*, seluruh staf wajib mengikuti tahapan **Shadow Mode 48 Jam**:
1. **Parallel Run:** Staf mendokumentasikan pelayanan secara ganda (kertas manual dan NurseFlow HIS) selama 2 hari shift kerja.
2. **Audit Diskrepansi:** Tim champion membandingkan keselarasan data antara lembar kertas dan sistem komputer setiap akhir shift.
3. **Cut-Off Mandiri:** Setelah diskrepansi mencapai $0\%$ dan kecepatan entri perawat $\le 90\text{ detik}$, sistem resmi dideklarasikan **LIVE OPERATIONAL 100% PAPERLESS**.

---
**DOKUMEN INI TELAH DISETUJUI OLEH:**
* **Komite Medik & Keselamatan Pasien (KMKP):** *dr. Surya Johnson, Sp.PD-KGEH*
* **Komite Keperawatan:** *Ns. Ratna Sari, S.Kep., M.Kep*
* **Direktur Medis & Keperawatan:** *dr. Budi Santoso, Sp.B*
* **Chief Technology Officer (CTO):** *NurseFlow Enterprise Architecture Group*
