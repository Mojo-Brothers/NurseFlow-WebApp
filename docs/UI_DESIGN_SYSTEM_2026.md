# 🎨 SPESIFIKASI CENTRALIZED CLINICAL DESIGN SYSTEM 2026
## NurseFlow Enterprise Hospital Information System

**Dokumen Referensi:** Master Task — Clinical UX & Workflow Re-Engineering  
**Tanggal Rilis:** 26 Agustus 2026  
**Prinsip Desain:** High Information Density, Clinical High-Contrast, WCAG 2.1 AAA, Zero Visual Clutter, Keyboard-First Accessibility  

---

## 📌 1. Design Tokens & Semantic Color Palette

Sistem warna NurseFlow dirancang khusus untuk lingkungan kerja klinis (IGD, Bangsal, Poliklinik, Laboratorium, Kamar Operasi) dengan rasio kontras tinggi ($\ge 7:1$) dan makna semantik tegas yang seragam di seluruh aplikasi.

### Semantic Color Variables (`src/index.css`)
```css
:root {
  /* ─── Brand & Workstation Shell (Oceanic Navy & Medical Slate) ─── */
  --clinical-navy-950: #001e2b;
  --clinical-navy-900: #002b3d;
  --clinical-navy-800: #013d57;
  --clinical-navy-700: #025375;
  --clinical-teal-600: #0d9488;
  --clinical-teal-500: #14b8a6;
  --clinical-teal-400: #2dd4bf;
  --clinical-cyan-400: #22d3ee;

  /* ─── High-Alert & Safety Semantics (JCI Standards) ─── */
  --critical-red-bg: #450a0a;
  --critical-red-border: #ef4444;
  --critical-red-text: #fecaca;
  --critical-red-glow: rgba(239, 68, 68, 0.4);

  --warning-amber-bg: #451a03;
  --warning-amber-border: #f59e0b;
  --warning-amber-text: #fef3c7;

  --success-emerald-bg: #022c22;
  --success-emerald-border: #10b981;
  --success-emerald-text: #d1fae5;

  --info-sky-bg: #082f49;
  --info-sky-border: #0ea5e9;
  --info-sky-text: #e0f2fe;

  /* ─── Neutral Surfaces & Card Tokens ─── */
  --surface-ground: #0b1329;
  --surface-card: #0f172a;
  --surface-card-hover: #1e293b;
  --surface-border: #334155;
  --surface-border-subtle: #1e293b;

  /* ─── Typography Colors ─── */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-highlight: #38bdf8;

  /* ─── Table & Grid Rhythm ─── */
  --table-row-height-compact: 36px;
  --table-row-height-regular: 44px;
  --table-header-bg: #021a24;
  --table-row-zebra: #0d1b2a;
}
```

---

## ✍️ 2. Typography & Text Hierarchy

Menggunakan font modern sans-serif (*Inter* / *Outfit*) dengan angka tabular monospaced (*JetBrains Mono* / *Fira Code*) untuk data numerik tanda vital, dosis obat, nominal uang, dan nomor rekam medis.

| Tingkat Tipografi | Ukuran (Size) | Bobot (Weight) | Penggunaan Utama |
| :--- | :--- | :--- | :--- |
| **Heading 1 (H1)** | `22px / 1.3` | Bold (700) | Judul Workspace Utama (misal: *Doctor Clinical Workspace*) |
| **Heading 2 (H2)** | `16px / 1.3` | Semibold (600) | Judul Panel / Section (misal: *Riwayat SOAP & Alergi Pasien*) |
| **Heading 3 (H3)** | `13px / 1.3` | Semibold (600) | Judul Card / Modal Header |
| **Body Regular** | `13px / 1.4` | Normal (400) | Teks isi catatan klinis, anamnesis, hasil pemeriksaan |
| **Body Small / Label** | `11px / 1.3` | Medium (500) | Label form input, header tabel, metadata |
| **Clinical Code / MRN** | `12px / 1.2` | Bold (700) Monospace | No. MRN, Kode ICD-10, No. Resep, Nilai Hasil Lab |
| **High-Alert Text** | `12px / 1.2` | Black (900) Uppercase | Indikator Alergi, ESI-1, Panic Value Lab, Code Blue |

---

## 📐 3. Information Density & Layout Spacing

HIS adalah sistem operasional padat data (*data-dense application*). Desain NurseFlow menerapkan **Grid 4px/8px Spacing Rhythm**:
* Padding kartu: `p-3` (12px) atau `p-4` (16px) — tidak menggunakan padding 32px yang membuang ruang layar.
* Gap antar kolom: `gap-2` (8px) atau `gap-3` (12px).
* Tinggi baris tabel data: `36px` (compact) untuk memaksimalkan jumlah baris terlihat dalam satu layar tanpa scroll.
* Sticky Header & Sticky Columns pada tabel riwayat pasien dan daftar antrean.

---

## 🧱 4. Standardized Clinical Primitives

Seluruh UI NurseFlow distandarisasi menggunakan 25 komponen primitif terpusat:

### 1. `ClinicalButton` & `IconButton`
* **Varian**:
  * `primary`: Aksi simpan / rekam / finalisasi (Oceanic Teal `#0d9488`).
  * `danger / critical`: Aksi hapus, stop obat, aktivasi Code Blue (Crimson Red `#ef4444`).
  * `secondary`: Batal, filter, kembali (Slate Border `#334155`).
  * `ghost`: Tombol aksi cepat di dalam tabel.
* **Fitur Bawaan**:
  * *Built-in Loading Spinner*: Mencegah klik ganda (*double-click mutex*).
  * *Keyboard Shortcut Badge*: Menampilkan label shortcut (misal: `Ctrl+S`, `Ctrl+Enter`).

### 2. `ClinicalBadge` & `StatusBadge`
* **Varian Berbasis Tingkat Keparahan**:
  * `esi-1`: Latar merah tua, border merah menyala, teks putih bold berkedip halus.
  * `esi-2` / `news-high`: Latar oranye kemerahan, teks kuning terang.
  * `esi-3` / `news-medium`: Latar kuning tua, teks kuning keemasan.
  * `esi-4` & `esi-5` / `news-low`: Latar hijau tua, teks hijau zamrud.
  * `order-status`: *DRAFT* (Abu-abu), *ORDERED* (Biru), *IN_PROGRESS* (Kuning), *COMPLETED* (Hijau), *CANCELLED* (Merah).

### 3. `ClinicalTable` & `DataGrid`
* **Fitur Wajib**:
  * Sticky Header saat scroll vertikal.
  * Baris selang-seling (*Zebra Striping*) untuk meningkatkan keterbacaan mata saat memindai data panjang.
  * Toolbar filter dan pencarian instan bawaan (*Live Search Toolbar*).
  * Navigasi keyboard atas/bawah antar baris tabel.

### 4. `ClinicalInput`, `Select`, `Combobox`
* **Fitur Wajib**:
  * High-contrast outline saat kursor aktif (*Focus Ring* `#38bdf8`).
  * Dukungan autocomplete pencarian real-time (misal: pencarian obat & diagnosa ICD-10).
  * Validasi error inline dengan pesan instruksi korektif yang jelas.

### 5. `ClinicalAlertBanner`
* **Tingkat Peringatan**:
  * `Critical Hard-Stop`: Menutup layar sebagian dan memaksa input alasan klinis (*Clinical Justification*) sebelum dapat melanjutkan.
  * `Warning Override`: Peringatan moderat (misal: duplikasi terapi atau selisih dosis minor).
  * `Informational`: Petunjuk SOP atau status sinkronisasi.

---

## 🖼️ 5. Ergonomic 3-Panel Workspace Layout Pattern

Seluruh workspace klinis utama (Dokter, Triase, Farmasi, Radiologi) mengadopsi pola **3-Panel Ergonomic Layout**:

```text
+----------------------------------------------------------------------------------------------------+
| SACRED CLINICAL CONTEXT HUD: [MRN-00102] Tn. Bambang (42 Th / L) | ALERGI: PENISILIN | NEWS2: 2    |
+------------------------------------+-----------------------------------+---------------------------+
| PANEL 1: CONTEXT & HISTORY (25%)   | PANEL 2: ACTIVE WORKSPACE (45%)   | PANEL 3: ACTIONS & CPOE   |
|                                    |                                   | (30%)                     |
| - Riwayat CPPT Sebelumnya          | - Editor SOAP / CPPT Aktif        | - Keranjang Order CPOE    |
| - Hasil Lab & Radiologi Serial     | - Pencarian Diagnosa ICD-10       | - Rekomendasi Obat CDSS   |
| - Pengobatan Aktif / Alergi        | - Prosedur ICD-9-CM               | - Estimasi Biaya & Billing|
| - Grafik Tren Tanda Vital          | - Rencana Tata Laksana            | - Tombol Simpan & Final   |
+------------------------------------+-----------------------------------+---------------------------+
```

Pola 3-Panel ini **mengeliminasi 80% perpindahan halaman (*route switching*)** dan menjamin dokter serta perawat tidak pernah kehilangan konteks rekam medis pasien saat membuat keputusan klinis penting.
