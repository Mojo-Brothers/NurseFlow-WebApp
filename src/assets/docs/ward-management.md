# Panduan: Manajemen Spasial Bangsal (Bed Management) 🏥

Modul ini adalah dashboard operasional real-time untuk memantau kapasitas rumah sakit dan tingkat keparahan pasien (acuity level) secara spasial di seluruh unit perawatan.

## 🛏️ Operasional Bed Management

### 1. Visualisasi Status & Kondisi Klinis
Grid bed menampilkan informasi pasien secara high-density dengan kode warna berbasis keamanan pasien:
*   🔵 **Tersedia (Tersedia)**: Bed kosong dan siap menerima pasien (Warna Biru Dasar).
*   🟢 **Pasien Stabil (Success)**: Bed terisi pasien dengan parameter fisiologis dalam batas normal (Warna Hijau).
*   🔴 **Risiko Tinggi / Kritis (Error)**: Pasien memiliki skor **NEWS2 ≥ 7**. Kartu bed akan berubah menjadi merah sebagai indikator peringatan dini (Early Warning System) bagi perawat jaga.
*   ⚪ **Dipesan / Pembersihan**: Bed sedang dalam masa transisi administratif atau sterilisasi.

### 2. Alokasi & Transfer Pasien
Langkah memindahkan pasien ke bed:
1.  Klik pada Bed yang berstatus **Tersedia**.
2.  Pilih pasien dari daftar antrean admisi.
3.  Konfirmasi detail perawatan (Kelas/Kamar).
4.  Klik **Tempatkan Pasien**.

Untuk transfer antar bangsal (misal: dari ICU ke Bangsal Umum):
1.  Klik ikon **Transfer** pada kartu pasien.
2.  Pilih unit tujuan dan bed yang tersedia.
3.  Lakukan handoff klinis melalui fitur **Handover**.

---

## 📊 Monitoring Okupansi
Manajemen dapat melihat statistik BOR (Bed Occupancy Rate) secara real-time untuk:
*   Merencanakan penambahan staf.
*   Mengatur prioritas rujukan masuk.

> [!IMPORTANT]
> Selalu perbarui status bed segera setelah pasien pulang (Discharge) agar sistem dapat memberikan data akurat kepada tim IGD yang membutuhkan bed segera.
