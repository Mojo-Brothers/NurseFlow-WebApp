# Panduan: Manajemen & Registrasi Pasien 👥

Modul ini adalah gerbang utama data pasien di NurseFlow HIS, yang mengutamakan **Sasaran Keselamatan Pasien 1 (IPSG 1)**: Ketepatan Identifikasi Pasien.

## 📋 Alur Registrasi Pasien

### 1. Wizard Registrasi 6-Langkah
Untuk menjamin kelengkapan data sesuai standar JCI, pendaftaran pasien mengikuti alur wizard berikut:
1.  **Identitas Utama (IPSG 1)**: Pengisian NIK, Nama sesuai identitas resmi, dan Tanggal Lahir.
2.  **Kontak & Demografi**: Alamat lengkap, Agama, dan Pekerjaan.
3.  **Wali / Penanggung Jawab**: Informasi kontak darurat dan hubungan kekeluargaan.
4.  **Asuransi & Billing**: Pemilihan jenis asuransi (BPJS/UMUM/Swasta) dan nomor kartu.
5.  **Medis & Safety (IPSG 6)**: Penentuan golongan darah, daftar alergi, dan skrining awal risiko jatuh.
6.  **Hak & Spiritual (PFR)**: Pengaturan tingkat privasi data dan kebutuhan pendampingan spiritual/penerjemah.

Selesai pengisian, klik **Simpan & Terbitkan MRN**. Sistem akan menghasilkan nomor rekam medis unik secara otomatis.

### 2. Registrasi Kedaruratan (Emergency Intake)
Gunakan fitur ini jika pasien datang dalam kondisi kritis dan identitas belum tersedia:
1.  Klik tombol **Pendaftaran Darurat**.
2.  Sistem akan membuat identitas sementara (misal: "Mr. X / 2026-04-25").
3.  Lakukan pembaruan data setelah kondisi pasien stabil.

## 🔍 Pencarian & Verifikasi

*   **Pencarian Cepat**: Gunakan kolom pencarian di dashboard pasien dengan memasukkan Nama atau Nomor Rekam Medis (MRN).
*   **Verifikasi Ganda**: Saat melakukan tindakan, selalu verifikasi data di layar dengan menanyakan langsung kepada pasien (jika sadar) atau memeriksa gelang identitas.

## 🆔 Manajemen Kredensial
Modul ini memungkinkan staf untuk:
*   Mencetak Kartu Pasien (Digital/Fisik).
*   Mengelola asuransi (BPJS/Swasta) yang aktif.
*   Mengunggah dokumen identitas pendukung.

---

## 🛡️ Standar JCI (Patient Safety)
*   **Dilarang Duplikasi**: Sistem memiliki deteksi kemiripan data untuk mencegah satu pasien memiliki dua nomor rekam medis berbeda.
*   **Alergi & Risiko**: Informasi alergi obat wajib dimasukkan pada saat registrasi awal atau segera setelah diketahui.

> [!IMPORTANT]
> Kesalahan identifikasi pasien adalah penyebab utama kesalahan medis. Selalu pastikan NIK dan Nama sesuai dengan dokumen resmi.
