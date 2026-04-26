# Panduan: Rekam Medis Elektronik (EMR) ✍️

Modul EMR adalah jantung dari dokumentasi klinis di NurseFlow HIS, menyimpan seluruh riwayat kesehatan pasien secara digital, aman, dan terintegrasi.

## 📄 Struktur EMR

### 1. CPPT (Catatan Perkembangan Pasien Terintegrasi)
Tempat dokumentasi kolaboratif antara Dokter, Perawat, dan Tenaga Kesehatan lainnya menggunakan format **SOAP**:
*   **S (Subjective)**: Keluhan yang disampaikan pasien.
*   **O (Objective)**: Hasil pemeriksaan fisik dan penunjang.
*   **A (Assessment)**: Diagnosis atau kesimpulan klinis.
*   **P (Plan)**: Rencana terapi, instruksi obat, dan tindak lanjut.

### 2. EMR Rawat Jalan (RJ) & Rawat Inap (RI)
*   **Formulir Spesialis**: Tersedia template khusus untuk mata, gigi, kebidanan, dll.
*   **Riwayat Alergi**: Informasi yang selalu tampil di bagian atas layar untuk keamanan.
*   **Akses Hasil Penunjang**: Link langsung ke hasil Laboratorium dan Radiologi tanpa harus pindah modul.

## 📖 Cara Mendokumentasikan

1.  Masuk ke menu **EMR**.
2.  Cari pasien berdasarkan nama/MRN atau pilih dari daftar kunjungan aktif.
3.  Lengkapi catatan menggunakan format **SOAP**.
4.  **Validasi Otomatis (JCI MOI.2)**: Sistem akan mendeteksi penggunaan singkatan terlarang secara real-time untuk mencegah kesalahan klinis.
5.  **Audit-Ready Sign-Off**: Klik tombol "Sign-Off". Pengesahan hanya dapat dilakukan jika kolom **Subjective** dan **Assessment** telah terisi lengkap.

---

## 🔒 Integritas Data & Audit (JCI)
*   **Immutable Logs**: Setiap perubahan pada EMR akan tercatat siapa yang merubah, kapan, dan data apa yang diubah (Event-based logging).
*   **Clinical Decision Support (CDS)**: Sistem memberikan peringatan otomatis jika ditemukan instruksi obat yang berkonflik dengan daftar alergi pasien di bagian **Plan**.
*   **Koreksi Data**: Jika ada kesalahan input setelah pengesahan, gunakan fitur "Addendum". Data asli tidak akan hilang dan tetap dapat dilacak dalam audit trail.

> [!TIP]
> Gunakan fitur "Voice-to-Text" (jika perangkat mendukung) untuk mendikte catatan klinis saat sedang menangani pasien dalam jumlah banyak.
