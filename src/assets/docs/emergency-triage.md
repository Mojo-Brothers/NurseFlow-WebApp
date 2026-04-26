# Panduan: Triase & Kedaruratan (IGD) 🚨

Modul Triase dirancang untuk kecepatan dan akurasi dalam menentukan prioritas penanganan medis di Instalasi Gawat Darurat (IGD).

## 🏥 Alur Triase Klinis

#### 2. Alur Triase JCI (NurseFlow Triage.OS)

Triase NurseFlow dirancang berdasarkan algoritma ESI dengan struktur input *high-velocity*:

### Fase 0: Keluhan Utama (Chief Complaint) & Survey Primer
*   **Input Langsung:** Perawat Triage sekarang dapat menginput/memperbarui Keluhan Utama langsung di layar Triase.
*   **Wajib JCI (AOP):** Setiap pasien wajib memiliki alasan kedatangan yang terdokumentasi untuk menentukan akuitas.
*   **Sinkronisasi EMR:** Data yang diinput di sini akan **otomatis mengisi bagian Subjective (S)** pada catatan SOAP dokter di modul EMR, menghilangkan redundansi pendokumentasian.

### Fase 1: Primary Survey (ABC)
*   Pemeriksaan cepat untuk mengidentifikasi ancaman jiwa:
    *   **Airway:** Paten / Obstruksi
    *   **Breathing:** Spontan / Bantuan
    *   **Circulation:** Nadi teraba / Tidak teraba
    *   **Disability/Kesadaran:** Alert / Voice / Pain / Unresponsive (AVPU)
*   Jika salah satu kriteria di atas *Tidak Stabil*, pasien langsung dikategorikan **ESI 1 (Resusitasi)**.

### Fase 2: Pengukuran Tanda Vital (Status Fisiologis)
Penginputan tanda-tanda vital (8 Parameter) secara presisi menggunakan interface numerik cepat:
*   **Denyut Nadi** (BPM)
*   **TDS (Sistolik)** (mmHg)
*   **Frekuensi Napas** (x/menit)
*   **Saturasi SpO2** (%)
*   *Serta parameter klinis pendukung lainnya (Suhu, Skala Nyeri, dll).*

### 2. Klasifikasi Prioritas (ESI Level)
NurseFlow menggunakan standar **Emergency Severity Index (ESI)**:
*   🔴 **Level 1 (Resusitasi)**: Ancaman nyawa langsung. Penanganan instan.
*   🟠 **Level 2 (Emergent)**: Kondisi berisiko tinggi atau gangguan kesadaran.
*   🟡 **Level 3 (Urgent)**: Membutuhkan banyak sumber daya (lab, rontgen).
*   🟢 **Level 4 (Less Urgent)**: Membutuhkan satu sumber daya.
*   🔵 **Level 5 (Non-Urgent)**: Tidak membutuhkan sumber daya tambahan.

## 📖 Cara Input Data

1.  Buka menu **Triase** dari sidebar.
2.  Pilih pasien dari daftar antrean atau cari pasien yang sudah terdaftar.
3.  Masukkan data tanda-tanda vital pada form yang tersedia.
4.  Pilih Level ESI berdasarkan algoritma klinis yang tampil di layar.
5.  Klik **PROSES ADMISI & TRIAGE** untuk memfinalisasi data dan mengirim pasien ke unit perawatan yang sesuai (P0/P1/P2/P3).
6.  *Gunakan tombol **SAVE DRAFT** jika ingin menyimpan data tanda vital sementara tanpa melakukan submisi final.*

---

## ⚡ Fitur Khusus
*   **Auto-Priority Suggestion**: Sistem akan memberikan saran level ESI berdasarkan data vital sign yang diinput (misal: jika TDS < 90, sistem menyarankan Level 1 atau 2).
*   **Triage Timer**: Memantau berapa lama pasien berada di area triase sebelum dipindahkan ke ruang perawatan.

> [!CAUTION]
> Penilaian klinis tenaga medis tetap menjadi prioritas utama di atas saran sistem. Gunakan tombol "Override" jika penilaian Anda berbeda dengan saran sistem.
