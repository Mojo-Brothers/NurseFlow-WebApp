# Panduan: Administrasi & Data Master 🛠️

Modul Administrasi adalah pusat kendali teknis untuk mengonfigurasi bagaimana NurseFlow HIS beroperasi sesuai dengan kebutuhan spesifik rumah sakit.

## 🏢 Master Hub (Pusat Data)
Master Hub digunakan untuk mengelola entitas dasar rumah sakit:
*   **Data Staf**: Menambah, mengedit, dan menonaktifkan akun Dokter, Perawat, dan Staf Administrasi.
*   **Unit Layanan**: Mengatur departemen (Poli, IGD, OK, ICU) dan bangsal.
*   **Daftar Tarif**: Mengonfigurasi harga tindakan, biaya kamar, dan harga obat.

## 🔐 Manajemen Akses (RBAC)
Administrator bertanggung jawab menjaga keamanan melalui **Role-Based Access Control**:
1.  Buka menu **Admin** > **User Management**.
2.  Tentukan Role untuk setiap user (misal: "DOCTOR" hanya bisa melihat EMR, "BILLING" hanya bisa melihat modul keuangan).
3.  Aktifkan/Nonaktifkan akun staf yang sudah tidak bekerja.

## 📖 Cara Mengonfigurasi Unit Baru

1.  Masuk ke **Master Hub** > **Units**.
2.  Klik **Tambah Unit Baru**.
3.  Masukkan Nama Unit, Lokasi, dan Kapasitas (jika bangsal).
4.  Hubungkan Unit dengan Dokter Spesialis yang bertugas.

---

## 🛡️ Data Governance & Compliance (MOI)
Administrator memiliki dashboard khusus untuk memantau kepatuhan JCI secara teknis melalui **Data Governance Hub**:
*   **Monitoring KLPCM**: Pemantauan otomatis terhadap kelengkapan rekam medis. Sistem menghitung persentase kelengkapan (*completeness rate*) secara real-time.
*   **Missing Signatures**: Melacak catatan klinis yang belum ditandatangani oleh dokter penanggung jawab pelayanan (DPJP).
*   **Enforcement Terminologi**: Mengelola daftar **Forbidden Abbreviations**. Penambahan singkatan di sini akan langsung mengaktifkan pemblokiran otomatis pada modul EMR.

## ⚙️ Pemeliharaan & Kesehatan Sistem
*   **Audit Trail**: Peninjauan log aktivitas seluruh user untuk investigasi keamanan atau insiden medis (Immutable Logs).
*   **System Health**: Monitoring beban kerja server dan status sinkronisasi database untuk menjamin ketersediaan layanan 24/7.

> [!CAUTION]
> Perubahan pada Data Master (terutama Tarif dan Data Staf) berdampak langsung pada seluruh operasional rumah sakit. Pastikan setiap perubahan telah disetujui oleh manajemen.
