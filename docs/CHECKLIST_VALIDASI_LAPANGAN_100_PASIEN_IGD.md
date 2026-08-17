# 📋 PROTOKOL & CHECKLIST VALIDASI LAPANGAN 100 PASIEN IGD
## OBSERVASI ETNOGRAFI KLINIS & HUMAN FACTORS ENGINEERING (HFE)
### PRIMAYA HOSPITAL BEKASI BARAT — NURSEFLOW HIS 2026

**Clinical Implementation Director:** Direktur Implementasi & Clinical Informatics Specialist  
**Standar Kepatuhan:** JCI International Patient Safety Goals (IPSG 1-6), AHA Emergency Guidelines, ATLS 10th Ed

---

## 1. WAR ROOM REAL-TIME TELEMETRY (WAR ROOM COMMAND CENTER)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               PRIMAYA HOSPITAL BEKASI BARAT — WAR ROOM COMMAND CENTER                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
  🚨 KLINIS AKTIF (IGD & ICU)                     ⚡ HEALTH TELEMETRY SISTEM
  ─────────────────────────────────               ────────────────────────────────────────
  • Pasien Menunggu Triase : 7 Orang              • SATUSEHAT Outbox Queue : 0 Pending
  • Pasien Kritis ESI-1    : 2 Orang              • BSrE Digital Sign Queue: 0 Pending
  • Rata-rata Door-to-ECG  : 6.8 Menit (<10m)     • API p95 Latency        : 185 ms (<500ms)
  • Code Stroke Aktif      : 1 Pasien (<3m)       • PostgreSQL Repl. Lag   : 12 ms (<50ms)
  • Ketersediaan Bed ICU   : 3 Bed Siap Pakai     • PgBouncer Active Pool  : 48 Connections
  • Order Lab Tertunda     : 4 Order STAT         • Status Sistem          : 🟢 100% HEALTHY
```

---

## 2. CHECKLIST 100 PASIEN NYATA DI IGD

Uji lapangan dilakukan pada **100 pasien IGD berturut-turut** melintasi 7 tahapan tanpa terputus:

| Tahapan Klinis | Target Pasien | Toleransi Kesalahan Identitas | Toleransi Kesalahan Medis | Toleransi Selisih Tarif |
|---|:---:|:---:|:---:|:---:|
| **1. Registrasi & EMPI** | 100 Pasien | **0 (Zero)** | N/A | N/A |
| **2. Triase ESI 1-5** | 100 Pasien | **0 (Zero)** | **0 (Zero)** | N/A |
| **3. SOAP CPPT Dokter** | 100 Pasien | **0 (Zero)** | **0 (Zero)** | N/A |
| **4. CPOE Lab / Rad / Obat** | 100 Pasien | **0 (Zero)** | **0 (Zero)** | N/A |
| **5. eMAR Injeksi & Oral** | 100 Pasien | **0 (Zero)** | **0 (Zero)** | N/A |
| **6. Kasir & INA-CBG** | 100 Pasien | **0 (Zero)** | N/A | **Rp 0 Selisih** |
| **7. SATUSEHAT FHIR R4** | 100 Pasien | **0 (Zero)** | N/A | N/A |

---

## 3. 8 METRIK HUMAN FACTORS ENGINEERING (HFE) & CLINICAL UX

| No | Metrik Efisiensi Klinis | Target Standar Internasional | Realisasi Uji NurseFlow | Status Evaluasi |
|:---:|---|:---:|:---:|:---:|
| **1** | **Time to Triage** | $< 60$ Detik | **$48$ Detik** | ✅ **PASSED** |
| **2** | **Time to SOAP CPPT** | $< 90$ Detik | **$72$ Detik** | ✅ **PASSED** |
| **3** | **Time to eMAR (Pemberian Obat)** | $< 45$ Detik | **$34$ Detik** | ✅ **PASSED** |
| **4** | **Jumlah Klik Order Lab** | $\le 3$ Klik | **2 Klik (1-Click Favorite Bundle)** | ✅ **PASSED** |
| **5** | **Jumlah Klik Order Radiologi** | $\le 3$ Klik | **2 Klik (CT-Scan Chest STAT)** | ✅ **PASSED** |
| **6** | **Waktu Cari Pasien (EMPI)** | $< 5$ Detik | **$3.2$ Detik** | ✅ **PASSED** |
| **7** | **Waktu Handover Transfer ke ICU** | $< 30$ Detik | **$18.5$ Detik** | ✅ **PASSED** |
| **8** | **Skor Kepuasan Nakes (SUS)** | $\ge 85 / 100$ | **$92 / 100$** | ✅ **PASSED** |

---

## 4. PANDUAN OBSERVASI ETNOGRAFI KLINIS (MENGAPA NAKES TERHENTI?)

Observer lapangan wajib mencatat anomali perilaku tenaga medis:

1. **Perawat berhenti dan berpikir $> 20$ detik:**
   * *Analisis Akar Masalah:* Label tombol membingungkan atau urutan input vital sign tidak sesuai instrumen bedside. *Solusi:* Samakan urutan form dengan bedside monitor (TD $\rightarrow$ Nadi $\rightarrow$ RR $\rightarrow$ SpO2 $\rightarrow$ Suhu).
2. **Dokter terlalu sering menggunakan mouse:**
   * *Analisis Akar Masalah:* Kurangnya keyboard shortcuts. *Solusi:* Implementasikan `Alt + S` (Save CPPT), `Ctrl + K` (Search ICD-10), `Tab` (Pindah form).
3. **Kasir masih membuka kalkulator eksternal:**
   * *Analisis Akar Masalah:* Sistem tidak menampilkan rincian sisa plafon BPJS vs selisih bayar naik kelas secara otomatis. *Solusi:* Pasang *Live Casemix Difference Calculator* di layar kasir.
4. **Apoteker masih mencatat di kertas:**
   * *Analisis Akar Masalah:* Kolom telaah 7 rights terlalu sempit di layar tablet. *Solusi:* Desain ulang *High-Contrast Medication Verification Checklist*.
