# 🚀 SPRINT 4B.8B: CLINICAL INTELLIGENCE WORKSPACE INTEGRATION
## Spesifikasi Formal Integrasi UI/UX, Patient Context Lock, Role-Based Action & Matriks 50 Skenario Uji
**Versi Dokumen:** v1.0.0 (Formal Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Clinical Intelligence Workspace Architecture  
**Otoritas:** Clinical Safety, Human Factors & Health Informatics Council  
**Prinsip Desain:**  
> **"Intelligence menyatu dengan workflow klinisi di tempat keputusan dibuat — bukan halaman AI terpisah."**  
> **"Menjawab 3 Pertanyaan dalam < 5 Detik: WHO (Pasien mana?), WHAT (Ada apa?), WHY (Kenapa penting?)."**  
> **"Strict Patient Context Lock: Event pasien lain TIDAK BOLEH memindahkan konteks pasien yang sedang dibuka."**

---

## 🧭 1. EXECUTIVE SUMMARY & FILOSOFI WORKSPACE INTEGRATION

### 1.1 Menghilangkan "Silo AI" Terpisah
Kelemahan terbesar implementasi AI/Clinical Decision Support (CDSS) di rumah sakit konvensional adalah menempatkan analitik pada tab atau menu terpisah (misal: menu *"AI Insights"*). Dokter dan perawat yang sibuk tidak akan pernah membuka menu terpisah tersebut di tengah kegentingan klinis.

Sprint 4B.8B mengintegrasikan seluruh output dari **Sprint 4B.4 (Deterioration), 4B.5 (Governance), 4B.6 (Trajectory), 4B.7 (Risk Stratification), dan 4B.8A (Alert Orchestrator)** langsung ke dalam 3 ruang kerja inti:
1. **IGD Rapid Workspace**: Penilaian triase instan, deteksi syok awal, kartu resusitasi ESI-1/2, dan tombol panggilan cito tim gawat darurat.
2. **Inpatient Ward Central Board**: Papan pengawas bangsal sentral dengan pengurutan prioritas otomatis berdasarkan hitung mundur SLA (*countdown timer*), peringatan pre-krisis dini, dan pencegahan kematian tak terduga (*unexpected ward mortality*).
3. **ICU Acuity Workspace**: Drawer telemetri multi-organ kontinu, visualisasi grafik vektor organ 6 dimensi, dan deteksi *Incipient MODS*.

---

## ⏱️ 2. KERANGKA KEPUTUSAN KLINIS 5 DETIK (THE 5-SECOND DECISION FRAMEWORK)

Setiap komponen visual Clinical Intelligence di NurseFlow dirancang agar dokter atau perawat dapat memahami situasi dalam **kurang dari 5 detik**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🔴 HIGH RISK (URGENT CLINICAL REVIEW — SLA <= 15 MIN)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. WHO?  │ Ny. Siti Aminah | RM: 00-88-21-44 | Bed 302 (Bangsal Melati)│
├──────────┼─────────────────────────────────────────────────────────────┤
│ 2. WHAT? │ RAPID DETERIORATION PRE-CRISIS                              │
│          │ NEWS2: 3 ➔ 5 | Trajectory: +1.8/h | Status: HIGH RISK       │
├──────────┼─────────────────────────────────────────────────────────────┤
│ 3. WHY?  │ • Respiratory: RR 20 ➔ 26 ➔ 30 x/m (+4.0/h), SpO2 90%       │
│          │ • Hemodynamic: MAP 82 ➔ 68 mmHg (-6.5 mmHg/h)               │
│          │ • Sepsis      : Laktat meningkat 1.2 ➔ 2.6 mmol/L           │
├──────────┴─────────────────────────────────────────────────────────────┤
│ TINDAKAN: Tinjauan Spesialis DPJP / Re-evaluasi AGD Cito                │
│ [VIEW EVIDENCE]   [ACKNOWLEDGE (30M)]   [ESCALATE TO MET]   [OVERRIDE] │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏥 3. KONTRAK INTEGRASI IGD RAPID WORKSPACE

### 3.1 Penempatan Visual & Format Komponen
Pada IGD Rapid Workspace ([`EmergencyWorkspace.jsx`](file:///c:/ALL%20DATA/BERKAS%20ROBBY/APPS%20PROJECT/NurseFlow-WebApp/src/modules/emergency/components/EmergencyWorkspace.jsx)), Clinical Intelligence dirender sebagai **Rapid Triage Card Header & Bedside Banner**:
* **Acuity Badge Berkedip (P1/P2)**: Merah menyala (*Flash Red*) untuk P1 (`IMMEDIATE_LIFE_THREAT`) dan Amber untuk P2 (`URGENT_CLINICAL_ACTION`).
* **Cito Quick Action Button**: 
  - P1: Tombol merah besar `[CALL RESUSCITATION / AIRWAY TEAM]` (1-klik).
  - P2: Tombol `[NOTIFY TRIAGE DOCTOR]`.
* **Trajektori Mini-Sparkline**: Menampilkan kurva TTV 2 jam terakhir langsung di kartu triase tanpa perlu klik ganda.

---

## 🏢 4. KONTRAK INTEGRASI INPATIENT WARD CENTRAL BOARD

### 4.1 Papan Pengawas Sentral Bangsal Rawat Inap
Pada Station Nurse & Monitor Bangsal:
* **Pengurutan Prioritas Dinamis (SLA Countdown Queue)**: Pasien diurutkan dari atas ke bawah berdasarkan urgensi waktu tindakan:
  $$\text{Urutan Tampilan} = \text{Priority Tier} (\text{P1} \rightarrow \text{P2} \rightarrow \text{P3} \rightarrow \text{P4}) + \text{Remaining SLA Seconds}$$
* **Indikator Countdown Visual**: Timer berjalan mundur (misal: `00:14:32 remaining`); jika SLA habis, kartu berubah warna menjadi merah dengan label `OVERDUE REVIEW`.
* **Aksi Cepat Perawat**: Tombol `[ACKNOWLEDGE]` menghentikan bunyi alarm chime di nurse station dan memulai jendela *Snooze 30 Menit*.

---

## 🩺 5. KONTRAK INTEGRASI ICU ACUITY WORKSPACE

### 5.1 Telemetry Acuity Drawer
Pada ruang perawatan intensif (ICU/HCU/ICCU):
* **Drawer Vektor Organ 6-Dimensi**: Menampilkan status simultan: Hemodinamik, Respiratorik, Neurologik, Renal/Metabolik, Sepsis, dan Paparan Obat Risiko Tinggi.
* **Continuous Inotrope & Ventilator Integration**: Mengkorelasikan laju titrasi Norepinefrin/Vasopresin dengan respon MAP pasien.
* **Breakthrough Overlay**: Jika terjadi aritmia atau desaturasi mendadak di tengah pemantauan, drawer menampilkan banner merah *Breakthrough Event*.

---

## 🔒 6. ARSITEKTUR PATIENT CONTEXT LOCK & WRONG-PATIENT PREVENTION

> [!CAUTION]
> **HUKUM KESELAMATAN MUTLAK:**  
> Ketika dokter/perawat sedang membuka rekaman medis **Pasien A**, masuknya alert atau event baru untuk **Pasien B TIDAK BOLEH SECARA OTOMATIS MEMINDAHKAN KONTEKS ATAU FORM INPUT AKTIF KE PASIEN B!**

```text
┌────────────────────────────────────────────────────────────────────────┐
│ DOKTER SEDANG MENGISI SOAP PASIEN A (BED 101)                          │
├────────────────────────────────────────────────────────────────────────┤
│ ⚡ EVENT MASUK: Pasien B (Bed 108) mengalami Krisis P1 Apneu!         │
│                                                                        │
│ ❌ TINDAKAN TERLARANG (FATAL): Memindahkan layar dokter ke Pasien B    │
│    (Mengakibatkan dokter salah menginput resep Pasien B ke Pasien A)  │
│                                                                        │
│ ✅ PERILAKU YANG BENAR (PATIENT CONTEXT LOCK):                         │
│    1. Layar dokter TETAP TERKUNCI pada Pasien A.                       │
│    2. Muncul Toast / Ribbon Notification non-intrusif di pojok atas:   │
│       "🔴 ALERT P1: Pasien B (Bed 108) Krisis Apneu [BUKA DI TAB BARU]"│
│    3. Konteks SOAP Pasien A tersimpan aman tanpa distorsi.             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💡 7. KONTRAK EXPLAINABILITY 3 TINGKATAN (LEVEL 1, 2, 3)

```text
┌────────────────────────────────────────────────────────────────────────┐
│ LEVEL 1: BANNER STRIP (Dibaca <= 2 detik)                              │
│ 🔴 CRITICAL CARDIORESPIRATORY COLLAPSE | NEWS2: 8 | SLA: <= 5 Menit    │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 2: EXPANDED ACCORDION (Dibaca <= 10 detik)                       │
│ • Respirasi : RR 32 x/m (+6.0/h) | SpO2 88% O2 4L (Hipoksemia Berat)   │
│ • Hemodinamik : MAP 64 mmHg (-8.0 mmHg/h) | HR 128 bpm (Takikardia)     │
│ • Renal : Produksi urine 0.2 ml/kg/jam selama 3 jam (Oliguria)         │
├────────────────────────────────────────────────────────────────────────┤
│ LEVEL 3: DEEP EVIDENCE LEDGER MODAL ([VIEW EVIDENCE])                  │
│ • Grafik Sparkline runtun waktu 6 jam dengan titik observasi           │
│ • Tabel kronologis nilai lab kritis & titrasi medikasi                 │
│ • Referensi Aturan Tata Kelola: HOSP-MET-RULE-V2026.08 (Versioned)     │
│ • Hash Kriptografis WORM SHA-256 Merkle Ledger                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 8. MATRIKS OTORISASI & HAK AKSES PERAN (ROLE-BASED PERMISSION)

| Peran Klinisi | Lihat Alert | Acknowledge (Snooze) | Eskalasi ke MET | Override Level Risiko (DPJP) |
| :--- | :---: | :---: | :---: | :---: |
| **Perawat Bangsal (Ward Nurse)** | ✅ | ✅ (Snooze 30m) | ⚠️ (Minta Dokter/MET) | ❌ (Dilarang) |
| **Dokter Jaga (Resident/GP)** | ✅ | ✅ (Snooze 60m) | ✅ (Aktivasi Cito) | ❌ (Dilarang) |
| **Dokter Penanggung Jawab (DPJP)** | ✅ | ✅ (Bebas) | ✅ (Aktivasi Cito) | ✅ (**Wajib PIN & Alasan**) |
| **Kepala Ruangan / Supervisor** | ✅ | ✅ | ✅ | ❌ |

---

## 🔑 9. ALUR OVERRIDE RISIKO OLEH DPJP (DENGAN TANDA TANGAN PIN WORM)

1. **Akses Khusus DPJP**: Hanya akun dengan peran `DPJP` yang dapat menekan tombol `[OVERRIDE RISK]`.
2. **Modal Autentikasi 2-Faktor**:
   - Memasukkan PIN Otorisasi Klinis (6 digit).
   - Memilih Kategori Justifikasi: `CHRONIC_BASELINE`, `PALLIATIVE_GOAL`, `PLANNED_PROCEDURE`, `ARTIFACT_CONFIRMED`.
   - Mengisi Catatan Klinis Wajib ($\ge 15$ karakter).
3. **Pencatatan Kekal (WORM SHA-256)**:
   - Sistem menghasilkan hash kriptografis baru yang mengikat identitas DPJP, waktu presisi, justifikasi, dan state sebelumnya ke ledger audit forensik.

---

## ⏰ 10. SIKLUS HIDUP ALERT: ACKNOWLEDGE, SNOOZE & AUTO-WAKE

1. **Tombol [ACKNOWLEDGE]**:
   - Suara chime alarm berhenti seketika.
   - Status visual berubah dari `ACTIVE` (merah menyala) menjadi `ACKNOWLEDGED` (kuning stabil dengan tag nama perawat).
2. **Intelligent Snooze & Countdown**:
   - Timer countdown menampilkan sisa waktu snooze (misal: `Snooze: 28m remaining`).
3. **Mekanisme Auto-Wake Cerdas**:
   - Jika dalam masa snooze pasien mengalami akselerasi perburukan (misal: $\text{SpO2} < 88\%$, $\text{MAP} < 60$, atau $\text{GCS} \le 8$), status snooze **GUGUR OTOMATIS (*AUTO-WAKE*)** dan alarm kembali membunyikan sinyal `ACTIVE`.

---

## 🚨 11. ALUR ESKALASI MET (MEDICAL EMERGENCY TEAM)

1. **Klik Tombol [ESCALATE TO MET]**:
   - Sistem membuka modal konfirmasi eskalasi dengan rangkuman SBAR otomatis.
   - Menghubungi pager/notifikasi Tim MET & Dokter ICU bertugas.
   - Mengubah status kluster menjadi `ESCALATED` dan mencatat waktu respon tim di papan pengawas.

---

## 💥 12. PROTOKOL VISUAL DYNAMIC BREAKTHROUGH

Jika pasien yang berstatus `ACKNOWLEDGED` atau berisiko P2 mendadak mengalami ancaman gawat darurat baru (misal: Anafilaksis atau Stridor):
* Antarmuka **MENAMPILKAN BANNER MERAH BERKEDIP BREAKTHROUGH OVERLAY**.
* Menyertakan label: `⚡ BREAKTHROUGH EVENT: ANAPHYLAXIS POST-ANTIBIOTIC`.
* Membatalkan snooze dan memprioritaskan pasien ke baris paling atas (*Top of Queue*).

---

## ⚠️ 13. PENANGANAN DATA KADALUARSA (STALE DATA) & DATA DEFICIT

1. **Peringatan Data Kadaluarsa (*Stale Data Warning*)**:
   - Jika observasi TTV terakhir berusia $> 4\text{ jam}$ pada pasien bangsal, sistem menampilkan badge abu-abu: `⚠️ STALE VITALS (> 4H) — OBSERVASI ULANG DIPERLUKAN`.
2. **Peringatan Data Kosong (*Data Deficit Warning*)**:
   - Jika parameter vital seperti SpO2 atau Kesadaran belum diisi, sistem menampilkan banner `DATA DEFICIT RE-ASSESSMENT REQUIRED` untuk mencegah mortalitas tersembunyi.

---

## 📑 14. ISOLASI MULTI-TAB & KONSISTENSI DATA

* Menggunakan `BroadcastChannel` dan `persistenceAdapter` untuk menyinkronkan status `ACKNOWLEDGED` antar-tab secara instan tanpa perlu me-reload halaman.
* Memastikan tidak ada kontaminasi memori (*zero state contamination*) ketika 1 user membuka 5 tab pasien berbeda.

---

## ♿ 15. AKSESIBILITAS, KEYBOARD NAVIGATION & STANDAR WCAG 2.1 AA

* **Rasio Kontras Warna**: Memenuhi rasio kontras $\ge 4.5:1$ untuk teks dan badge darurat.
* **Shortcut Keyboard**:
  - `Alt + A`: Acknowledge alert pasien aktif.
  - `Alt + E`: Buka modal View Evidence.
  - `Alt + M`: Buka modal Eskalasi MET.
  - `Escape`: Menutup modal aktif.
* **ARIA Live Region**: `aria-live="assertive"` untuk notifikasi P1, memastikan pembaca layar (*screen reader*) segera mengumumkan peringatan kritis.

---

## 🧩 16. ARSITEKTUR KOMPONEN UI WORKSPACE

```text
src/components/clinical/
├── ClinicalIntelligenceCard.jsx      ──> Kartu pasien kompak untuk Inpatient Ward Board
├── ClinicalIntelligenceHud.jsx       ──> Header baris untuk IGD Rapid Triage Card
├── EvidenceLedgerModal.jsx           ──> Modal Level 3 Deep Evidence Ledger & Sparkline
├── DpjpOverrideModal.jsx             ──> Modal 2-Faktor Override Risiko dengan PIN
└── MetEscalationModal.jsx            ──> Modal aktivasi Tim Emergency & SBAR Summary
```

---

## 🚫 17. EXPLICIT NON-GOALS & BOUNDARIES

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NURSEFLOW SPRINT 4B.8B UI BOUNDARY COVENANT                               │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ ❌ WHAT 4B.8B WILL NEVER DO (NON-GOALS)            │ ✅ WHAT 4B.8B DELIVERS (CORE CAPABILITIES)        │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. NO Separate "AI Insights" Isolated Page         │ 1. Deep Seamless Embedding in Ward, IGD, ICU      │
│ 2. NO Unsolicited Patient Context Hijacking        │ 2. Strict Patient Context Lock (Zero Context Shift│
│ 3. NO Unauthorized Nurse Override of DPJP Policy   │ 3. Strict Role-Based PIN Authorization            │
│ 4. NO Silent Alarm Muting Without Audit Hash       │ 4. Cryptographic WORM SHA-256 Audit Trail         │
│ 5. NO Blind Snoozing on Deteriorating Patients     │ 5. Intelligent Auto-Wake on Sudden Drop           │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🧪 18. MATRIKS 50 SKENARIO UJI INTEGRASI WORKSPACE (50-SCENARIO TEST MATRIX)

| ID | Kategori Pengujian | Deskripsi Skenario & Input | Ekspektasi Verifikasi UI / Workspace |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Patient Context Lock** | Dokter membuka Pasien A (Bed 101), alert P1 Pasien B (Bed 108) masuk | Konteks aktif **TETAP PASIEN A**; notifikasi Pasien B muncul di toast non-intrusif |
| **TC-02** | **5-Second Decision (WHO)** | Render kartu pasien bangsal | Nama pasien, No RM, dan Bed tampil jelas di header kartu |
| **TC-03** | **5-Second Decision (WHAT)**| Render status risiko pada kartu | Menampilkan Severity, Trajectory (+1.8/h), dan Level Risiko (HIGH RISK) |
| **TC-04** | **5-Second Decision (WHY)** | Render accordion Level 2 explainability | Tepat 3 faktor fisiologis pendorong utama dengan nilai dan tren ditampilkan |
| **TC-05** | **Level 1 Headline Display**| Render baris kompak di ward central board | Headline string tampil padat, terbaca $\le 2$ detik |
| **TC-06** | **Level 3 Evidence Modal**  | User mengklik tombol `[VIEW EVIDENCE]` | Modal terbuka menampilkan sparkline 6 jam, tabel lab, dan aturan protokol RS |
| **TC-07** | **Nurse Acknowledge Action**| Perawat menekan tombol `[ACKNOWLEDGE]` | Status berubah ke `ACKNOWLEDGED`, audio alarm berhenti, countdown snooze mulai |
| **TC-08** | **Snooze Countdown Visual** | Kluster dalam status snooze 30 menit | Badge timer menghitung mundur secara real-time (`Snooze: 29:58`) |
| **TC-09** | **Auto-Wake on SpO2 Crash** | Pasien status snooze mengalami SpO2 drop 84% | Status snooze **BATAL OTOMATIS**; badge kembali ke `ACTIVE` merah berkedip |
| **TC-10** | **Auto-Wake on MAP Collapse**| Pasien status snooze mengalami MAP anjlok 55 mmHg | Status snooze batal otomatis; alarm suara kembali aktif |
| **TC-11** | **Auto-Wake on GCS Drop**   | Pasien status snooze mengalami penurunan GCS ke 7 | Status snooze batal otomatis; modal emergency P1 disorot |
| **TC-12** | **Doctor MET Escalation**   | Dokter mengklik `[ESCALATE TO MET]` | Modal SBAR muncul; status kluster berubah ke `ESCALATED` |
| **TC-13** | **DPJP Override Button Auth**| User login sebagai Perawat membuka kartu | Tombol `[OVERRIDE RISK]` berstatus disabled / tersembunyi |
| **TC-14** | **DPJP Override Execution** | DPJP login, masukkan PIN 6 digit + alasan | Level risiko berubah; hash audit SHA-256 WORM terbentuk |
| **TC-15** | **DPJP Override Rejection** | DPJP memasukkan PIN salah 3x | Override ditolak; error security dicatat di ledger |
| **TC-16** | **Breakthrough Banner**     | Pasien P2 mendadak mengalami Anafilaksis | Banner merah `⚡ BREAKTHROUGH EVENT: ANAPHYLAXIS` muncul di atas kartu |
| **TC-17** | **Breakthrough Stridor**    | Pasien pasca ekstubasi mengalami stridor | Banner `⚡ BREAKTHROUGH: POST-EXTUBATION STRIDOR` muncul seketika |
| **TC-18** | **IGD Rapid Triage HUD**    | Pasien masuk triage IGD dengan NEWS2 = 7 | Badge `ESI-1_RESUSCITATION` merah & tombol `[CALL RESUSCITATION]` aktif |
| **TC-19** | **IGD Cito Action Click**   | Perawat klik tombol `[CALL RESUSCITATION]` | Event panggilan darurat diterbitkan ke pager tim resusitasi |
| **TC-20** | **Inpatient Queue Sorting** | 5 pasien di bangsal dengan berbagai SLA | Pasien terurut: P1 (Top) $\rightarrow$ P2 $\rightarrow$ P3 $\rightarrow$ P4 berdasarkan sisa SLA |
| **TC-21** | **Overdue SLA Highlight**   | Target SLA 15 menit telah habis (00:00) | Kartu berubah warna merah menyala dengan teks `OVERDUE REVIEW` |
| **TC-22** | **ICU Drawer Telemetry**    | Membuka telemetry drawer di ICU | Menampilkan 6 vektor organ dan grafik laju perubahan |
| **TC-23** | **ICU Inotrope Titration**  | Titrasi Norepinefrin meningkat di ICU | Drawer mengaitkan dosis inotropik dengan kurva MAP |
| **TC-24** | **Stale Data Warning**      | TTV pasien terakhir diinput 5 jam lalu | Badge abu-abu `⚠️ STALE VITALS (> 4H)` ditampilkan |
| **TC-25** | **Data Deficit Warning**    | Pasien tanpa data SpO2 dan Kesadaran | Banner kuning `DATA DEFICIT: UKUR TTV LENGKAP` ditampilkan |
| **TC-26** | **Motion Artifact Display** | TTV ditandai artefak gerakan probe lepas | Menampilkan label `DATA KUALITAS RENDAH (SENSOR NOISE)` |
| **TC-27** | **Palliative DNR Badge**    | Pasien dengan status DNR aktif | Menampilkan badge ungu `PALLIATIVE COMFORT PATHWAY`; tanpa alarm MET |
| **TC-28** | **COPD Scale 2 Badge**      | Pasien PPOK dengan target SpO2 88-92% | Badge hijau `PPOK TARGET 88-92% AKTIF`; tanpa false alarm hipoksemia |
| **TC-29** | **Pediatric PALS Banner**   | Pasien anak usia 2 tahun mengalami takikardia | Menampilkan label `PEDIATRIC DECOMPENSATION ALERT (PALS)` |
| **TC-30** | **Multi-Tab Sync (Acknowledge)**| Perawat Acknowledge di Tab 1 | Tab 2 yang membuka bangsal yang sama ikut ter-update instan |
| **TC-31** | **Multi-Tab Context Safety**| Tab 1 buka Pasien A, Tab 2 buka Pasien B | Masing-masing tab mempertahankan konteks pasien tanpa tertukar |
| **TC-32** | **Keyboard Alt+A Shortcut** | Menekan `Alt + A` saat kartu aktif terpilih | Menjalankan aksi Acknowledge tanpa klik mouse |
| **TC-33** | **Keyboard Alt+E Shortcut** | Menekan `Alt + E` | Membuka modal View Evidence |
| **TC-34** | **Keyboard Alt+M Shortcut** | Menekan `Alt + M` | Membuka modal Eskalasi MET |
| **TC-35** | **Keyboard Escape Shortcut**| Menekan tombol `Escape` pada modal | Modal tertutup dan fokus kembali ke kartu pasien |
| **TC-36** | **High-Contrast Dark Mode** | Beralih ke tema Dark Mode | Seluruh teks dan badge memenuhi standar kontras WCAG 2.1 AA |
| **TC-37** | **ARIA Live Region Alert**  | Alert P1 baru diterbitkan | Elemen `aria-live="assertive"` mengumumkan pesan kritis ke screen reader |
| **TC-38** | **Resolution Animation**    | Pasien stabil dan status menjadi `RESOLVED`| Kartu bertransisi halus (*fade-out*) dari daftar prioritas aktif |
| **TC-39** | **Optimistic UI Update**    | Aksi Acknowledge dijalankan saat jaringan lambat| UI merespon instan (< 50 ms) sambil menyelaraskan background fetch |
| **TC-40** | **Network Offline Warning** | Jaringan terputus saat monitoring | Badge `OFFLINE MONITORING — MENGGUNAKAN LOCAL CACHE` muncul |
| **TC-41** | **Duplicate Click Throttle**| User mengklik tombol Acknowledge 5x cepat | Hanya 1 request yang diproses (Debounced / Throttled) |
| **TC-42** | **Sparkline Time Window**   | Mengubah jendela sparkline dari 2h ke 6h | Grafik menyesuaikan skala waktu dan titik observasi |
| **TC-43** | **SBAR Copy to Clipboard**  | Mengklik tombol `[COPY SBAR SUMMARY]` | Teks ringkasan format SBAR tersalin ke clipboard |
| **TC-44** | **Versioned Protocol Audit**| Kueri link protokol pada modal evidence | Menampilkan ID protokol `HOSP-MET-RULE-V2026.08` |
| **TC-45** | **WORM Hash Copy**          | User mengklik tombol salin hash audit | SHA-256 hash tersalin untuk verifikasi komite medik |
| **TC-46** | **Concurrent 50 Patient UI**| Render daftar bangsal berisi 50 pasien aktif | Render selesai dalam < 100 ms tanpa lag / frame drop |
| **TC-47** | **Rapid Patient Switch**    | User beralih cepat antara Pasien 1 s.d. 10 | State setiap pasien termuat akurat tanpa sisa state sebelumnya |
| **TC-48** | **Role Switch Simulation**  | User berganti peran dari Perawat ke DPJP | Tombol Override langsung aktif secara reaktif |
| **TC-49** | **Responsive Tablet Layout**| Render pada viewport tablet (768px) | Tata letak kartu menyesuaikan fleksibel (*responsive grid*) |
| **TC-50** | **End-to-End Workspace Flow**| Siklus penuh: Triage IGD $\rightarrow$ Bangsal $\rightarrow$ ICU | Konsistensi data kluster terverifikasi utuh sepanjang perjalanan |

---

## 📌 19. KESIMPULAN & TAHAP SELANJUTNYA

Dokumen ini merupakan cetak biru spesifikasi formal untuk **Sprint 4B.8B: Clinical Intelligence Workspace Integration**. 

Dengan spesifikasi ini:
1. Peringatan klinis menyatu secara intuitif pada alur kerja dokter dan perawat di IGD, Bangsal, dan ICU.
2. Keselamatan pasien terjamin mutlak melalui **Patient Context Lock** dan **Wrong-Patient Prevention**.
3. Seluruh alur kerja tervalidasi melalui **50 skenario uji deterministik**.

Dokumen ini diajukan untuk **Persetujuan Arsitektural Pengguna** sebelum tahap implementasi dimulai.
