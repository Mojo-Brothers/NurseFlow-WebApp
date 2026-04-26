# Skenario Alur Nyata 1: Pasien Kritis IGD (Suspek STEMI) 🚨

Panduan ini mendemonstrasikan bagaimana aplikasi NurseFlow HIS digunakan dalam skenario gawat darurat yang nyata, mulai dari pasien tiba hingga penanganan medis awal.

## 📋 Konteks Kasus
Seorang pria berusia 55 tahun tiba di IGD diantar oleh keluarganya. Pasien memegangi dada kiri, tampak pucat, dan berkeringat dingin. Keluarga menyatakan pasien mengeluh nyeri dada seperti ditindih beban berat sejak 30 menit yang lalu.

---

## Tahap 1: Pendaftaran Cepat (Front Desk / Admisi IGD)

**Standar JCI:** Identifikasi pasien yang tepat (IPSG 1) dan pencatatan Keluhan Utama (Chief Complaint).

1. Buka modul **Patient Directory**.
2. Klik tombol **[+ Register Patient]**.
3. Karena ini kondisi gawat, petugas fokus pada identitas minimal (Nama, Tanggal Lahir, atau MRN jika pasien lama).
4. **KRITIKAL:** Pada kolom **Chief Complaint (Keluhan Utama)**, petugas *wajib* mengetikkan: `"Nyeri dada kiri menjalar ke lengan, keringat dingin"`.
5. Simpan pendaftaran. Pasien otomatis masuk ke dalam **Worklist IGD**.

---

## Tahap 2: Triase Cepat (Perawat Triage)

**Standar JCI:** Penilaian awal yang cepat untuk memprioritaskan perawatan pasien berdasarkan tingkat keparahan (AOP - Assessment of Patients).

1. Buka modul **Triage**.
2. Di layar antrean, nama pasien akan muncul dengan keluhan utama *"Nyeri dada kiri menjalar ke lengan..."* (Teks merah/peringatan otomatis muncul karena kata kunci "Nyeri dada").
3. Perawat langsung melakukan *Primary Survey* (ABC) secara visual:
   * **Airway:** Paten (Bicara jelas tapi merintih).
   * **Breathing:** Spontan, sedikit sesak.
   * **Circulation:** Akral dingin, pucat.
4. Input Tanda Vital (TTV) awal di layar Triage:
   * **Sistolik/Diastolik:** 90/60 mmHg (Hipotensi)
   * **Nadi:** 110 x/menit (Takikardia)
   * **SpO2:** 94%
   * **Skala Nyeri:** 8/10
5. Berdasarkan data vital dan keluhan, perawat memilih **ESI Level 1 (Resusitasi)** atau **ESI Level 2 (Emergent)**.
6. Klik **[Proses Admisi & Triage]**. Sistem otomatis memberikan label "RED ZONE" pada pasien ini.

---

## Tahap 3: Asesmen Medis & Order (Dokter IGD - EMR)

**Standar JCI:** Dokumentasi rekam medis yang akurat dan *Computerized Provider Order Entry* (CPOE) untuk meminimalisir *medication error*.

1. Dokter membuka modul **Electronic Medical Record (EMR)**.
2. Di dalam *Patient Header*, dokter dapat melihat peringatan "RED ZONE", "ESI 1", dan TTV terakhir.
3. Dokter melakukan asesmen SOAP cepat:
   * **S (Subjective):** Nyeri dada tembus ke punggung.
   * **O (Objective):** Pasien tampak sakit berat, diaphoresis.
   * **A (Assessment):** Suspek STEMI (Acute Coronary Syndrome).
   * **P (Plan):** O2 3L/menit, EKG 12 Lead Cito, ISDN 5mg SL, Aspirin 160mg kunyah.
4. Dokter langsung masuk ke tab **CPOE (Order Entry)**:
   * Pilih kategori **Radiology/Cardiology** -> Order **EKG 12 Lead (CITO)**.
   * Pilih kategori **Pharmacy** -> Order **ISDN 5mg Sublingual (CITO)** & **Aspirin 160mg (CITO)**.
5. Klik **[Sign & Submit Orders]**. Perintah ini langsung *real-time* terkirim ke unit terkait tanpa perlu kertas.

---

## Tahap 4: Eksekusi & Audit Trail (Admin/Sistem)

**Standar JCI:** Keterlacakan (Traceability) dari seluruh intervensi medis yang diberikan kepada pasien.

1. Farmasi langsung menerima notifikasi order Cito di layar mereka dan segera menyiapkan obat.
2. Perawat IGD menerima obat dan memberikan ke pasien.
3. Segala perubahan, mulai dari triase hingga penginputan order obat oleh dokter, terekam secara *immutable* di dalam sistem log.
4. Kepala IGD / Auditor dapat membuka **Admin Hub** > **Audit Trail** untuk melihat detail waktu respons (Time-to-ECG, Time-to-Medication) untuk memastikan standar pelayanan terpenuhi.

---
> **Kesimpulan:** Melalui sistem terintegrasi NurseFlow, waktu tunggu (bottleneck) komunikasi antara Pendaftaran, Perawat Triase, Dokter, dan Penunjang (Farmasi/EKG) dihilangkan. Semuanya sinkron secara *real-time* dengan jejak audit yang jelas.
