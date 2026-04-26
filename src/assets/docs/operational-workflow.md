# Panduan: Farmasi & Billing (Operational) ⚙️

Modul operasional menangani sisi administratif dan logistik pelayanan pasien setelah pemeriksaan klinis.

## 💊 Farmasi & Dispensing

### 1. Penerimaan Resep Digital
Setiap instruksi obat dari Dokter (EMR) akan masuk otomatis ke daftar antrean Farmasi.
1.  Buka menu **Farmasi**.
2.  Pilih pasien dengan antrean "New Prescription".
3.  **Verifikasi Klinis**: Cek potensi interaksi obat atau duplikasi instruksi.
4.  **Dispensing**: Siapkan obat sesuai stok yang tersedia.

### 2. Penyerahan & Safety (JCI MMU)
1.  **Verifikasi Identitas (IPSG)**: Saat klik "Dispensing", Anda **WAJIB** memasukkan nomor MRN pasien sebagai validasi identitas ganda (Double ID).
2.  **Double-Check High-Alert**: Untuk obat berisiko tinggi (IV, SC, IM), sistem mewajibkan verifikasi oleh dua orang. Masukkan email rekan sejawat sebagai saksi untuk melanjutkan.
3.  **Peringatan LASA**: Sistem akan memberikan notifikasi otomatis jika obat yang diberikan masuk kategori *Look-Alike Sound-Alike* (LASA). Klik "✓ Dispensing" hanya jika identitas dan jenis obat sudah tervalidasi 100%.

---

## 🧾 Billing & Kasir

### 1. Konsolidasi Tagihan
Sistem secara otomatis mengumpulkan biaya dari seluruh layanan (Laboratorium, Obat, Konsultasi, Kamar).
1.  Masuk ke menu **Billing**.
2.  Cari pasien yang akan pulang atau selesai layanan.
3.  **Audit Layanan**: Tambahkan tindakan atau alkes tambahan melalui fitur "Tambah Layanan" sebelum tagihan dikunci.

### 2. Proses Pembayaran & Discharge
1.  **Finalize & Discharge**: Klik tombol ini untuk mengunci seluruh rincian tagihan (Audit Ready). Langkah ini bersifat permanen dan tidak dapat diedit kembali.
2.  **Authorize Settlement**: Masukkan nominal pembayaran atau otorisasi asuransi.
3.  **Cetak Kwitansi**: Terbitkan kwitansi resmi sebagai bukti pelunasan.
4.  **Otomasi Spasial**: Pelunasan secara otomatis akan mengubah status Bed pasien di modul Bangsal menjadi "Pembersihan" untuk persiapan pasien berikutnya.

---

> [!NOTE]
> Integrasi otomatis antara EMR, Farmasi, dan Billing memastikan tidak ada layanan yang terlewat (Lost Revenue) dan mempercepat waktu pulang pasien (Discharge Time).
