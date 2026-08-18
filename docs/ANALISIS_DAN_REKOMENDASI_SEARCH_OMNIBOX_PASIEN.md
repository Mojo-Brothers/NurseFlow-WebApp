# 🏥 ANALISIS ARSITEKTUR PENCARIAN GLOBAL (OMNIBOX CTRL+K) & STRATEGI MANAJEMEN 100 RAWAT INAP + 100 RAWAT JALAN

**Dokumen Rujukan:** Arsitektur UI/UX & Clinical Ergonomics NurseFlow HIS  
**Tanggal:** 18 Agustus 2026  
**Status:** DRAFT UNTUK REVIEW & KOMENTAR (Tanpa Perubahan Kode Aktif)  
**Target Pengguna:** Dokter Spesialis (DPJP), Perawat Ruangan, Dokter IGD, Petugas Admisi  

---

## 1. PERTANYAAN DASAR & TEMUAN LAPANGAN

> **Pertanyaan Pengguna:**  
> *"Apakah mode pencarian ini terlalu simple dan tidak menampilkan seluruh list pasien yang sedang berkunjung rawat inap maupun rawat jalan, apakah ada alasan tertentu darimu?"*

### Kesimpulan Singkat Analisis:
**YA, modal pencarian saat ini memang TERLALU MINIMALIS ketika belum ada teks yang diketik (*Empty State Flaw*).** 

Meskipun secara teknis pencarian *type-ahead* bekerja cepat saat nama/MRN diketik, membiarkan modal kosong melompong saat pertama kali dibuka adalah **pelanggaran ergonomi klinis (*Clinical UX Friction*)**, terutama ketika seorang dokter atau perawat perlu berpindah cepat di antara **100 pasien rawat jalan dan 100 pasien rawat inap** tanpa harus mengingat atau mengetik nama mereka satu per satu.

---

## 2. REKAYASA AWAL: MENGAPA DIBUAT MINIMALIS? (*Original Rationale*)

Modal `Ctrl + K` yang ada saat ini mengadopsi konsep **Command Palette / Spotlight Search** (seperti Raycast, macOS Spotlight, atau VSCode `Ctrl + P`):

1. **Paradigma "Ketik Dulu Baru Muncul" (*Type-Ahead Query*)**:
   - Asumsi awal perancang adalah pengguna menekan `Ctrl + K` dengan niat spesifik mencari satu entitas tertentu (misal: mencari *"Tn. Budi"* atau *"Paracetamol"*).
2. **Efisiensi Bandwidth & Rendering Engine**:
   - Menghindari *fetching* 200+ rekam medis sekaligus ke memori peramban (*browser memory*) setiap kali tombol `Ctrl + K` ditekan secara tidak sengaja, menjaga respon modal tetap berada di bawah $50\text{ ms}$.
3. **Pemisahan Modul (*Separation of Concerns*)**:
   - Perancang berasumsi bahwa:
     - Daftar 100 pasien rawat jalan harus dilihat di **Poliklinik / Doctor Worklist (`/doctor-workspace`)**.
     - Daftar 100 pasien rawat inap harus dilihat di **Ward Monitoring & Bed Management (`/ward-monitor`)**.
     - Pencarian master data arsip harus dilihat di **Patient Command Center (`/patients`)**.

---

## 3. KRITIK & KELEMAHAN DALAM PRAKTIK RUMAH SAKIT NYATA

Dalam alur kerja medis harian, asumsi di atas menimbulkan kendala serius:

### 🔴 Masalah 1: Beban Kognitif Dokter Visite Rawat Inap
Seorang Dokter Spesialis (DPJP) yang sedang melakukan visite ke 15 pasien di Bangsal Bedah tidak selalu menghafal nomor RM atau ejaan nama lengkap pasiennya. Memaksa dokter mengetik nama setiap kali ingin membuka rekam medis pasien berikutnya adalah **pemborosan waktu dan sumber frustrasi**.

### 🔴 Masalah 2: Hilangnya Konteks Pasien Terakhir (*Recent Context*)
Jika perawat sedang menangani `Tn. Mr. X`, lalu membuka sejenak rekam medis `Ny. Siti`, kemudian ingin kembali ke `Tn. Mr. X`, mereka harus mengetik ulang. Seharusnya ada daftar **"Terakhir Dibuka Hari Ini"**.

### 🔴 Masalah 3: Visibilitas Antrean Rawat Jalan
Dokter poliklinik yang ingin melihat siapa pasien urutan berikutnya harus berpindah halaman ke modul jadwal, padahal `Ctrl + K` dapat berfungsi sebagai *instant queue switcher*.

---

## 4. PERBANDINGAN: DESAIN SAAT INI VS STANDAR ENTERPRISE 2026

| Parameter Evaluasi | Kondisi Saat Ini (Minimalis) | Standar EMR Enterprise (Epic / Cerner 2026) |
| :--- | :--- | :--- |
| **Status Saat Dibuka (Belum Mengetik)** | Kosong, hanya ada 1 tombol aksi Mr. X | Menampilkan Tab Pasien Terkini, Rawat Inap, & Rawat Jalan |
| **Dukungan 100 Pasien Rawat Inap** | Harus diketik nama/RM-nya | Tampil per Bangsal/Nomor Bed dengan indikator DPJP |
| **Dukungan 100 Pasien Rawat Jalan** | Harus diketik nama/RM-nya | Tampil per Poliklinik & Urutan Nomor Antrean |
| **Peralihan Konteks Pasien** | Lambat (harus search ulang) | Instan 1-Klik dari riwayat terakhir (*Recent Patients*) |
| **Pencarian Global (Obat/Lab/Dokter)** | Berfungsi saat diketik | Berfungsi saat diketik + Riwayat pencarian tersimpan |

---

## 5. REKOMENDASI DESAIN BARU (SMART CLINICAL CONTEXT OMNIBOX)

Ketika pengguna menekan `Ctrl + K` dan kolom input **masih kosong**, modal direkomendasikan menampilkan tata letak 3 tingkat:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔍 [ Cari Pasien (Nama/MRN/NIK), Dokter, Obat, Hasil Lab, Jadwal Operasi... ]       ESC   │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB SEGMEN:  [ 🕒 Terakhir Dibuka (5) ]  [ 🛏️ Rawat Inap (100) ]  [ 🩺 Rawat Jalan (100) ]│
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│ 🕒 PASIEN TERAKHIR DIBUKA HARI INI:                                                      │
│ • Tn. Mr. X (8619)        • ESI 2 • Bed Ranap A-302 • Nyeri Dada Akut (STEMI)             │
│ • Ny. Siti Rahma (1002)   • DPJP: dr. Budi, Sp.B    • Bed Melati 04 (Post-Op)             │
│ • Tn. Ahmad Fauzi (1044)  • Poliklinik Jantung      • Antrean No. 12                      │
│                                                                                           │
│ 🛏️ PASIEN RAWAT INAP AKTIF (LIVE CENSUS BANGSAL):                                         │
│ • [Bed 301] Ny. Aminah    • RM-00912 • DPJP: dr. Siti Wijaya, Sp.PD • Status: Stabil      │
│ • [Bed 302] Tn. Hendra    • RM-00918 • DPJP: dr. Budi Santoso, Sp.B • Status: Puasa Pre-Op│
│ • [Bed 303] -- KOSONG / SIAP DITEMPATI --                                                 │
│                                                                                           │
│ 🩺 ANTREAN POLIKLINIK HARI INI (RAWAT JALAN):                                             │
│ • [Antrean 01] Ny. Kartini • RM-00811 • Poli Penyakit Dalam • Status: Sedang Konsul       │
│ • [Antrean 02] Tn. Bambang • RM-00815 • Poli Penyakit Dalam • Status: Menunggu             │
│                                                                                           │
│ 🚨 AKSI CEPAT MEDIS:                                                                      │
│ [ + Registrasi Pasien Baru ]    [ + Pasien Darurat Anonim (Mr. X) ]                       │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. STRATEGI PERFORMA MENANGANI 100 RANAP + 100 RAJAL (ANTI-LAG)

Agar modal tetap ringan dan tidak memberatkan peramban web:

1. **Virtual Scrolling (Windowing)**: Hanya me-render 10–15 baris yang terlihat di layar, sehingga menangani 1.000 pasien pun tidak akan menimbulkan lag pada CPU/RAM.
2. **Client-Side Cache & Realtime Subscription**: Data 100 rawat inap dan 100 rawat jalan disimpan di *local cache state* yang diperbarui otomatis via WebSocket saat ada mutasi/admisi baru.
3. **Penyaring Cepat Berbasis Chip (*Segment Filter Chips*)**: Memberikan tombol instan untuk menyaring per Bangsal (*ICU, Melati, Mawar*) atau per Poliklinik (*Jantung, Penyakit Dalam, Bedah*).

---

## 7. RUANG CATATAN & KOMENTAR ANDA

Silakan gunakan area di bawah ini atau berikan instruksi perbaikan berikutnya:

- [ ] **Opsi A**: Pertahankan kesederhanaan saat ini (fokus pada pengetikan teks).
- [ ] **Opsi B (Direkomendasikan)**: Terapkan **Smart Clinical Context Hub** dengan Tab Pasien Terkini, 100 Rawat Inap, dan 100 Rawat Jalan seperti spesifikasi di atas.
- [ ] **Opsi C**: Tambahkan filter kustom lain (misal: filter per Dokter DPJP / filter jadwal operasi).
