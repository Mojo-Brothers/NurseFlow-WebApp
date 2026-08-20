# 🚀 SPRINT 4B.9: CLINICAL COMMAND & PATIENT SAFETY OPERATIONS LAYER
## Spesifikasi Formal Operasionalisasi Keselamatan Klinis, Escalation Queue, Akuntabilitas Peran & Matriks 50 Skenario Uji
**Versi Dokumen:** v1.0.0 (Formal Specification Baseline)  
**Tanggal Rilis:** 2026-08-20  
**Klasifikasi:** Enterprise Hospital Information System (HIS) Clinical Operations & Command Architecture  
**Otoritas:** Clinical Governance, Patient Safety & Health Informatics Council  
**Aksioma Inti:**  
> **"No Alert Without Accountability."**  
> *(Setiap sinyal perburukan klinis wajib terikat pada Peran Penanggung Jawab, Target Waktu SLA, Eskalasi Berjenjang, dan Jejak Audit Kriptografis).*  
> **"Clinical intelligence may interrupt attention, but it must never hijack patient context."**

---

## 🧭 1. EXECUTIVE SUMMARY: OPERATIONALIZING CLINICAL SAFETY

### 1.1 Transformasi dari "Deteksi" Menjadi "Operasionalisasi Tindakan"
Pada Sprint 4B.4 hingga 4B.8B, NurseFlow telah berhasil membangun mesin kecerdasan klinis deterministik (*Detection ➔ Trajectory ➔ Risk Stratification ➔ Alert Orchestration ➔ Human Workspace Embedding*).

Namun, sistem deteksi tercanggih sekalipun akan gagal menyelamatkan nyawa jika rumah sakit tidak memiliki sistem komando operasional yang dapat menjawab 5 pertanyaan kritis:
1. **Siapa klinisi/tim yang bertanggung jawab saat ini (*Responsible Actor*)?**
2. **Berapa sisa waktu tindakan sesuai standar keselamatan (*Remaining SLA*)?**
3. **Alert mana yang belum ditindaklanjuti dan terancam kadaluarsa (*Unacknowledged Alerts*)?**
4. **Kapan dan ke mana sistem harus melakukan eskalasi berjenjang otomatis (*Auto-Escalation Hierarchy*)?**
5. **Bagaimana distribusi beban kerja pasien kritis antar-staf perawat (*Workload Balancing*)?**

Sprint 4B.9 membangun **Clinical Command & Patient Safety Operations Layer** sebagai jembatan komando antara kecerdasan klinis mesin dan eksekusi operasional tim medis di seluruh rumah sakit.

---

## 🔗 2. PRINSIP "NO ALERT WITHOUT ACCOUNTABILITY" (7-LINK SAFETY CHAIN)

Setiap sinyal klinis yang diterbitkan oleh sistem harus melalui 7 rantai akuntabilitas tertutup (*Closed-Loop Accountability Chain*):

```text
┌────────────────────────────────────────────────────────────────────────┐
│               THE 7-LINK CLOSED-LOOP ACCOUNTABILITY CHAIN              │
├────────────────────────────────────────────────────────────────────────┤
│ 1. PATIENT IDENTIFIER   │ Ny. Siti Aminah | RM: 00-88-21-44 | Bed 302  │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 2. CLINICAL SIGNAL      │ NEWS2 3➔6 (+1.8/h) | Desaturasi SpO2 89%     │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 3. PRIORITY & SLA       │ P1 IMMEDIATE LIFE THREAT | Target SLA <= 5m  │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 4. RESPONSIBLE ROLE     │ Tim Jaga Shift A (Perawat Primer & Dokter)   │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 5. ACKNOWLEDGEMENT      │ Sr. Ratna (09:12:04 WIB) ➔ Snooze 30m Aktif │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 6. ACTION & ESCALATION  │ dr. Andi ➔ Panggilan Tim MET (09:14:20 WIB)  │
├─────────────────────────┼──────────────────────────────────────────────┤
│ 7. IMMUTABLE WORM AUDIT │ SHA-256 Merkle Ledger Linked (Audit Forensik)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 3. TOPOLOGI ARSITEKTUR KOMANDO OPERASIONAL

```text
                       PATIENT STREAM / SENSORS / EMR
                                     │
                                     ▼
                   ┌───────────────────────────────────┐
                   │ Clinical Engines (Sprint 4B.4–7)  │
                   │ Deterioration, Trajectory, Risk   │
                   └─────────────────┬─────────────────┘
                                     ▼
                   ┌───────────────────────────────────┐
                   │ Alert Orchestrator (Sprint 4B.8A) │
                   │ Deduplication & Breakthrough      │
                   └─────────────────┬─────────────────┘
                                     ▼
                   ┌───────────────────────────────────┐
                   │ Clinical Workspace (Sprint 4B.8B) │
                   │ IGD HUD, Ward Card, ICU Drawer    │
                   └─────────────────┬─────────────────┘
                                     ▼
        ┌─────────────────────────────────────────────────────────────┐
        │  SPRINT 4B.9: CLINICAL COMMAND & SAFETY OPERATIONS LAYER    │
        ├─────────────────────────────────────────────────────────────┤
        │ 📊 Patient Safety Command Board (Hospital & Ward Overview)   │
        │ ⏱️ Dynamic Escalation Queue & Real-Time SLA Monitor          │
        │ 🚨 Unacknowledged Alert Auto-Escalation Engine              │
        │ ⚖️ Team Acuity & Nurse Workload Balancing                   │
        │ 📋 Shift Handover Studio (SBAR with Live Clinical Vectors)   │
        │ 📈 Safety KPIs (Time-to-Ack, Overdue Breaches, Code Blue)   │
        │ 🛡️ Immutable Chain of Custody & Medicolegal Ledger          │
        └──────────────────────────────┬──────────────────────────────┘
                                       ▼
                         HUMAN CLINICAL COMMAND TEAM
              (Perawat Primer, Dokter Jaga, DPJP, Tim MET, Komite Mutu)
```

---

## 📊 4. KONTRAK PATIENT SAFETY COMMAND BOARD

### 4.1 Tingkat Rumah Sakit (*Hospital-Wide Executive View*)
Papan Komando Sentral Rumah Sakit menampilkan:
* **Peta Akuitas Rumah Sakit (*Hospital Acuity Heatmap*)**: Distribusi pasien P1/P2/P3/P4 di seluruh unit (IGD, ICU, HCU, Bangsal Rawat Inap Bedah, Non-Bedah, Kebidanan, Anak).
* **Indeks Kapasitas Tempat Tidur Kritis**: Ketersediaan bed ICU/HCU vs pasien bangsal berisiko tinggi yang membutuhkan transfer cito.
* **Tingkat Kepatuhan SLA Real-Time**: Persentase alert yang ditanggapi tepat waktu dalam 24 jam terakhir (Target $> 95\%$).

### 4.2 Tingkat Bangsal (*Ward Level Station Board*)
Papan Komando Stasiun Perawat menampilkan:
* **Antrean Prioritas Respons Cepat**: Pasien diurutkan berdasarkan sisa hitung mundur SLA (*Remaining SLA Countdown*).
* **Indikator Beban Kerja Staf (*Staff Assignment Indicator*)**: Setiap pasien memiliki tag perawat penanggung jawab shift aktif.
* **Visualisasi Peringatan Terancam (*Threatened SLA Highlight*)**: Kartu pasien berubah kuning berkedip saat sisa SLA $< 25\%$, dan merah menyala saat terjadi *SLA Breach*.

---

## ⏱️ 5. MESIN ESKALASI BERJENJANG OTOMATIS (AUTO-ESCALATION HIERARCHY)

Jika suatu alert klinis tidak direspons (*Unacknowledged / Unactioned*) dalam batas waktu yang ditentukan oleh protokol rumah sakit, sistem menjalankan **Eskalasi Berjenjang Otomatis**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│              ESKALASI BERJENJANG OTOMATIS BERDASARKAN WAKTU            │
├────────────────────────────────────────────────────────────────────────┤
│ T = 0 Menit  │ Alert P1 Terbit ➔ Notifikasi ke Perawat Bangsal & Station│
├──────────────┼─────────────────────────────────────────────────────────┤
│ T + 3 Menit  │ Belum di-Acknowledge ➔ Visual Kuning Berkedip + Chime   │
├──────────────┼─────────────────────────────────────────────────────────┤
│ T + 5 Menit  │ SLA BREACH (Level 1) ➔ Pager Dokter Jaga Bangsal Aktif  │
├──────────────┼─────────────────────────────────────────────────────────┤
│ T + 10 Menit │ UNRESPONSIVE (Level 2) ➔ Pager Tim MET & DPJP Berdering │
├──────────────┼─────────────────────────────────────────────────────────┤
│ T + 15 Menit │ CRITICAL FAILURE (Level 3) ➔ Notifikasi Kepala Ruangan  │
│              │ & Pelaporan Otomatis ke Log Insiden Keselamatan Pasien  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚖️ 6. PENYEIMBANG BEBAN KERJA & AKUITAS STAF (WORKLOAD BALANCING)

* **Skor Beban Akuitas Perawat (*Nurse Acuity Load Score*)**:
  $$\text{Acuity Score} = \sum (\text{Bobot Pasien P1} \times 4 + \text{P2} \times 2 + \text{P3} \times 1 + \text{P4} \times 0.5)$$
* **Deteksi Overload Perawat**: Jika seorang perawat merawat $> 2$ pasien P1 atau Acuity Score $> 10$, sistem memunculkan rekomendasi *Re-assignment* ke perawat lain yang berbeban lebih rendah guna mencegah *cognitive fatigue*.

---

## 📋 7. SHIFT HANDOVER STUDIO (SBAR DENGAN VEKTOR KLINIS LANGSUNG)

Integrasi operasional serah terima jaga (*Shift Handover*) antar-perawat/dokter:
* **Ekstraksi SBAR Otomatis**: Menghasilkan ringkasan Situation, Background, Assessment, Recommendation secara otomatis dari cluster data terkini.
* **Integrasi Vektor Trajektori**: Menampilkan grafik tren laju 8 jam terakhir langsung pada lembar serah terima.
* **Tanda Tangan Elektronik Ganda (*Dual Digital Sign-off*)**: Perawat yang menyerahkan dan perawat penerima menandatangani berkas handover secara digital dengan audit log WORM.

---

## 📈 8. INDIKATOR KINERJA KESELAMATAN (SAFETY KPIS & ANALYTICS)

Sistem melacak metrik mutu secara terus-menerus:
1. **Median Time-to-Acknowledge (TTA)**: Waktu dari alert terbit hingga dikonfirmasi perawat.
2. **Median Time-to-Escalate (TTE)**: Waktu dari konfirmasi hingga dokter/tim MET dihubungi.
3. **SLA Breach Rate (%)**: Persentase keterlambatan respons terhadap standar protokol rumah sakit.
4. **Unexpected Ward Cardiac Arrest Rate**: Angka kejadian henti jantung di bangsal umum per 1.000 hari rawat inap.
5. **False Alarm Reduction Efficiency**: Rasio deduplikasi alert yang berhasil diredam tanpa membungkam perburukan baru.

---

## 👥 9. MATRIKS HAK AKSES & OTORISASI PERAN KOMANDO

| Peran Staf | Dashboard Bangsal | Hospital Command Board | Eskalasi MET Cito | Handover Sign-off | Laporan Mutu & KARS |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Perawat Primer (Ward Nurse)** | ✅ | ❌ | ⚠️ (Minta Dokter) | ✅ | ❌ |
| **Ketua Tim / Kepala Ruangan** | ✅ | ✅ (Unitnya) | ✅ | ✅ | ✅ |
| **Dokter Jaga (Resident/GP)** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **DPJP Spesialis** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tim MET / Koordinator ICU** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Komite Mutu & Keselamatan** | ❌ | ✅ (Read-Only) | ❌ | ❌ | ✅ (Full Export) |

---

## 🚫 10. EXPLICIT NON-GOALS & BOUNDARIES

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NURSEFLOW SPRINT 4B.9 BOUNDARY COVENANT                                   │
├────────────────────────────────────────────────────┬───────────────────────────────────────────────────┤
│ ❌ WHAT 4B.9 WILL NEVER DO (NON-GOALS)             │ ✅ WHAT 4B.9 DELIVERS (CORE CAPABILITIES)         │
├────────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 1. NO Autonomous Medical Order Creation            │ 1. Deterministic Escalation & Notification Routing│
│ 2. NO Automatic Patient Bed Relocation (Without MD)│ 2. Real-Time Acuity-Based Bed Capacity Tracking   │
│ 3. NO Alert Suppression Without Named Staff Audit  │ 3. Strict Closed-Loop Accountability Trail        │
│ 4. NO Silent Dropping of Overdue Alerts            │ 4. Hierarchical Auto-Escalation to Supervisors    │
│ 5. NO Manual Data Re-entry in Shift Handover       │ 5. Auto-Populated SBAR Handover with Live Vectors │
└────────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

---

## 🧪 11. MATRIKS 50 SKENARIO UJI VALIDASI OPERASIONAL (TC-01 s.d. TC-50)

| ID | Kategori Pengujian | Deskripsi Skenario & Input | Ekspektasi Verifikasi Command Layer |
| :--- | :--- | :--- | :--- |
| **TC-01** | **Closed-Loop Chain (Link 1)** | Alert diterbitkan untuk Pasien A | Terikat langsung pada ID Pasien, No RM, dan Lokasi Bed akurat |
| **TC-02** | **Closed-Loop Chain (Link 2)** | Sinyal klinis multi-parameter | Menampilkan rincian parameter TTV dan laju per jam |
| **TC-03** | **Closed-Loop Chain (Link 3)** | Prioritas P1 diterbitkan | Target SLA terhitung otomatis $\le 5\text{ menit}$ |
| **TC-04** | **Closed-Loop Chain (Link 4)** | Penugasan perawat shift | Nama perawat penanggung jawab tampil jelas pada kartu |
| **TC-05** | **Closed-Loop Chain (Link 5)** | Perawat menekan Acknowledge | Timestamp konfirmasi & nama perawat tercatat di ledger |
| **TC-06** | **Closed-Loop Chain (Link 6)** | Eskalasi ke Tim MET dijalankan | Pager/notifikasi terkirim dengan ringkasan SBAR lengkap |
| **TC-07** | **Closed-Loop Chain (Link 7)** | Seluruh siklus alert selesai | Rantai audit SHA-256 Merkle root tersimpan utuh tanpa gap |
| **TC-08** | **Hospital Acuity Heatmap** | 50 pasien tersebar di 5 bangsal | Heatmap menampilkan distribusi akuitas P1-P4 per bangsal |
| **TC-09** | **Ward Priority Queue Sort** | Antrean bangsal dengan berbagai sisa SLA | Terurut dari sisa SLA terpendek ke terpanjang |
| **TC-10** | **Threatened SLA Warning** | Sisa SLA tersisa $< 25\%$ | Kartu menampilkan border kuning berkedip (*Threatened SLA*) |
| **TC-11** | **SLA Breach Trigger (T+5m)** | Alert P1 tidak direspons dalam 5m | Status berubah ke `SLA_BREACHED`; notifikasi dokter jaga terkirim |
| **TC-12** | **Auto-Escalation Level 2 (T+10m)**| Alert tetap unacknowledged di T+10m | Sistem otomatis mengirim eskalasi ke Tim MET & DPJP |
| **TC-13** | **Auto-Escalation Level 3 (T+15m)**| Alert tidak ditindaklanjuti di T+15m | Notifikasi terkirim ke Kepala Ruangan & tercatat insiden mutu |
| **TC-14** | **Nurse Workload Score Calc** | Perawat memegang 1 P1, 2 P2, 2 P3 | Skor akuitas terhitung tepat $(1\times4 + 2\times2 + 2\times1 = 10)$ |
| **TC-15** | **Nurse Overload Alert** | Beban perawat melebihi ambang batas | Peringatan `NURSE_OVERLOAD_DETECTED` muncul dengan opsi re-assign |
| **TC-16** | **Workload Re-assignment** | Memindahkan pasien dari Perawat A ke B | Penugasan ter-update real-time dan tercatat di audit trail |
| **TC-17** | **SBAR Auto-Population** | Membuka modal shift handover | Field Situation, Background, Assessment, Recommendation terisi |
| **TC-18** | **Handover Trajectory Graph** | Menampilkan lembar serah terima | Grafik mini-sparkline 8 jam TTV tersemat pada lembar |
| **TC-19** | **Dual Digital Sign-off** | Perawat A menyerahkan, Perawat B terima | Formulir terkunci dengan tanda tangan ganda kedua perawat |
| **TC-20** | **Handover Lock Enforcement** | Mencoba mengedit handover pasca tanda tangan | Sistem memblokir mutasi (Immutable Handover Record) |
| **TC-21** | **Time-to-Acknowledge KPI** | Menghitung median TTA bangsal | KPI TTA teragregasi akurat dari rentang waktu log |
| **TC-22** | **Time-to-Escalate KPI** | Menghitung median TTE bangsal | KPI TTE terhitung akurat sesuai selisih waktu aksi |
| **TC-23** | **SLA Breach Rate KPI** | 5 dari 100 alert mengalami breach | Rasio breach terhitung tepat $5.0\%$ |
| **TC-24** | **False Alarm Reduction KPI** | Menghitung rasio alert terdeduplikasi | Menghitung efisiensi reduksi alarm secara transparan |
| **TC-25** | **ICU Bed Capacity Alert** | Pasien P1 butuh ICU saat bed ICU penuh | Menampilkan peringatan `CRITICAL_BED_DEFICIT` ke manajemen |
| **TC-26** | **Cross-Ward Transfer Flow** | Pasien dipindahkan dari Melati ke ICU | State kluster berpindah mulus tanpa kehilangan riwayat |
| **TC-27** | **IGD-to-Ward Handoff** | Transfer pasien triase P1 ke ruang rawat | SBAR triase terlampir otomatis pada penerimaan bangsal |
| **TC-28** | **Unassigned Patient Warning** | Pasien masuk bangsal tanpa perawat tertag | Menampilkan highlight merah `UNASSIGNED_PRIMARY_NURSE` |
| **TC-29** | **Role Filter in Command Board** | User memilih filter 'Hanya Pasien Saya' | Tampilan memfilter kartu sesuai penugasan user aktif |
| **TC-30** | **Multi-Unit Supervisor View** | Kepala Keperawatan memantau 3 bangsal | Dashboard menampilkan data lintas unit secara terpadu |
| **TC-31** | **Chime Escalation Level 1** | Alert P1 baru terbit | Membunyikan nada dering chime standar di station |
| **TC-32** | **Chime Escalation Level 2** | Alert P1 mengalami SLA breach | Nada chime berubah menjadi nada darurat tempo tinggi |
| **TC-33** | **Silent Mode Safety Guard** | Pengguna mencoba mematikan suara alarm | Ditolak tanpa konfirmasi otorisasi supervisor |
| **TC-34** | **Offline Command Cache** | Jaringan terputus saat monitoring | Data operasional tersimpan di cache lokal IndexedDB |
| **TC-35** | **Offline Sync Reconciliation** | Jaringan pulih kembali | Log aksi offline disinkronkan ke server tanpa duplikasi |
| **TC-36** | **Medicolegal Export PDF** | Komite Mutu mengunduh log audit insiden | Menghasilkan berkas kronologis dengan hash WORM valid |
| **TC-37** | **KARS Incident Classification** | Alert breach diklasifikasikan | Terpetakan ke kategori KNC/KTD sesuai regulasi Kemenkes |
| **TC-38** | **National Quality Indicator Export**| Kueri data indikator mutu nasional | Menghasilkan agregat kepatuhan respon klinis |
| **TC-39** | **Breakthrough Override on Handover**| Pasien gawat saat proses serah terima | Handover memunculkan banner interupsi darurat |
| **TC-40** | **Multi-Tab Command Consistency** | Perubahan penugasan perawat di Tab 1 | Tab 2 di monitor lain ter-update seketika |
| **TC-41** | **Zero Cross-Contamination Stress**| 100 pasien dimonitor bersamaan | Tidak ada data pasien yang tertukar antar-baris |
| **TC-42** | **Keyboard Command Palette** | Menekan `Ctrl + K` pada Command Board | Membuka navigasi pencarian cepat pasien/bed |
| **TC-43** | **Shift Summary Report Export** | Mengakhiri shift jaga 8 jam | Menghasilkan lembar rekapitulasi shift otomatis |
| **TC-44** | **Palliative DNR Flag in Queue** | Pasien DNR masuk daftar pantau | Kartu diberi label ungu dan dikecualikan dari auto-MET |
| **TC-45** | **COPD Scale 2 Filter in Queue** | Pasien PPOK dalam antrean | Ambang batas saturasi disesuaikan ke 88-92% |
| **TC-46** | **Concurrent 100 Patient Board Load**| Render papan pengawas 100 pasien | Render selesai dalam $< 150\text{ ms}$ |
| **TC-47** | **Rapid Staff Re-assignment** | Mengubah penugasan 10 pasien sekaligus | Update batch selesai dalam $< 50\text{ ms}$ |
| **TC-48** | **Audit Trail Integrity Verification**| Memvalidasi keutuhan hash seluruh aksi | Seluruh hash terverifikasi valid tanpa manipulasi |
| **TC-49** | **Mobile Responsiveness for MD** | Dokter membuka command queue di ponsel | Antarmuka beradaptasi ke tampilan daftar vertikal rapi |
| **TC-50** | **Full Operational Lifecycle Flow**| Siklus penuh: Deteksi $\rightarrow$ Penugasan $\rightarrow$ Respons $\rightarrow$ Eskalasi $\rightarrow$ Handover $\rightarrow$ Audit | Seluruh rantai 7-link terverifikasi 100% konsisten |

---

## 📌 12. KESIMPULAN

Dokumen ini merupakan cetak biru spesifikasi formal untuk **Sprint 4B.9: Clinical Command & Patient Safety Operations Layer**. Dokumen ini diajukan untuk ditinjau dan disahkan sebelum tahap implementasi dimulai.
