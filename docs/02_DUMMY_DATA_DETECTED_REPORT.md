# 🚨 LAPORAN TEMUAN DATA DUMMY & ARTEFAK SINTETIS (FAIL-FAST AUDIT)
## NurseFlow Enterprise Hospital Information System (HIS 2026)
### *Dokumen Rincian Temuan Artefak Non-Produksi, Nomor Baris, dan Penilaian Risiko Klinis*

---

> **STATUS LAPORAN:** `RESOLVED & RECTIFIED`  
> **TOTAL TEMUAN AWAL:** 28 Berkas Terdeteksi  
> **TINGKAT KEPARAHAN SISTEMIK:** `HIGH - BLOCKING`  

---

## 1. DAFTAR TEMUAN LENGKAP & ANALISIS DAMPAK

Berikut adalah daftar temuan data dummy, mock data, fallback statis, dan dead imports sebelum dilakukan remediasi:

| No | Lokasi Berkas | Baris | Jenis Artefak | Tingkat Risiko | Dampak Klinis / Sistemik |
|:---:|---|:---:|---|:---:|---|
| 1 | `src/modules/ward/services/bed.service.js` | 32–40 | Mock occupied beds (`Ny. Siti Nurhaliza`, `Tn. Budi Nugraha`, `Tn. Agung Pratama`) | **HIGH** | Bangsal rawat inap terdeteksi penuh padahal hari pertama belum ada pasien. |
| 2 | `src/modules/surgery/services/operatingTheatreEngine.service.js` | 86–140 | Hardcoded surgical cases (`case1`, `case2`) | **HIGH** | Kamar operasi terisi jadwal operasi fiktif; memicu bentrok jadwal bedah. |
| 3 | `src/modules/radiology/services/pacsDicomEngine.service.js` | 74–160 | Hardcoded PACS studies (`study1`, `study2`) | **MEDIUM** | Muncul studi rontgen dada fiktif pada daftar kerja radiografer. |
| 4 | `src/modules/radiology/components/RadiologyReportingStudio.jsx` | 8–14 | Fallback hardcoded active study | **MEDIUM** | Menampilkan hasil bacaan ekspertise fiktif jika radiografer belum memilih foto. |
| 5 | `src/modules/radiology/components/DicomWebViewer.jsx` | 6–24 | Fallback hardcoded study object | **LOW** | Viewer merender foto sample jika props `study` null. |
| 6 | `src/modules/radiology/components/PatientClinicalTimeline.jsx` | 3 | Default prop `patientName = 'Ny. Siti Nurhaliza'` | **LOW** | Polusi nama pasien pada komponen timeline. |
| 7 | `src/modules/orders/services/universalOrderEngine.service.js` | 33–82 | Mock universal orders array | **HIGH** | Muncul riwayat order lab dan resep otomatis pada pasien baru. |
| 8 | `src/modules/orders/components/OrderEntryWorkspace.jsx` | 10–13 | Default state `patientName = 'Ny. Siti Nurhaliza'` | **MEDIUM** | Order obat/lab otomatis tertagih atas nama pasien dummy jika form tidak direset. |
| 9 | `src/modules/nursing/components/NursingCommandCenter.jsx` | 11–76 | In-memory occupied beds array (4 pasien dummy) | **HIGH** | Nurse command center menampilkan data klinis dan eMAR fiktif. |
| 10 | `src/modules/nursing/components/EmarAdministrationStudio.jsx` | 6–76 | Hardcoded active patient & 4 dummy drugs | **HIGH** | Perawat melihat jadwal pemberian obat fiktif (Ceftriaxone, Insulin). |
| 11 | `src/modules/nursing/components/FluidBalanceSheet.jsx` | 6–30 | Hardcoded intake/output fluid entries | **MEDIUM** | Menampilkan balans cairan fiktif pada pasien baru. |
| 12 | `src/modules/nursing/components/NursingAssessmentAndPlan.jsx` | 6–13 | Fallback dummy patient identity | **LOW** | Pengkajian keperawatan terisi identitas statis. |
| 13 | `src/modules/master_data/services/queueManagement.service.js` | 17–20 | Fallback dummy queue tickets | **LOW** | Nomor antrean poliklinik mulai dari A-003 bukan A-001. |
| 14 | `src/modules/lab/components/SpecimenAccessioningStudio.jsx` | 7–32 | Hardcoded specimens & patient info | **HIGH** | Analis lab melihat sampel darah fiktif di daftar accessioning. |
| 15 | `src/modules/front_office/services/bpjsVClaimBridge.service.js` | 18–40 | Hardcoded SEP record & peserta string | **MEDIUM** | Pembuatan SEP bridging menghasilkan data faskes statis. |
| 16 | `src/modules/front_office/services/queueManagementEngine.service.js` | 47–66 | Fallback dummy queue ticket `TKT-2026-001` | **LOW** | Antrean loket pendaftaran terisi tiket fiktif. |
| 17 | `src/modules/front_office/services/registrationEngine.service.js` | 22–50 | Fallback dummy registration `REG-2026-001` | **HIGH** | Rekam registrasi pasien rawat jalan terisi otomatis. |
| 18 | `src/modules/emergency/services/triageSlaEngine.service.js` | 11–26 | Synthetic SLA timer in-memory | **MEDIUM** | Indikator mutu PMKP IGD terhitung dari waktu respons fiktif. |
| 19 | `src/modules/emr/services/cpptEngine.service.js` | 18–55 | Fallback CPPT notes (`CPPT-1001`, `CPPT-1002`) | **HIGH** | Catatan rekam medis dokter/perawat terisi riwayat medis palsu. |
| 20 | `src/modules/emr/services/soapEngine.service.js` | 11–34 | In-memory SOAP entry `SOAP-2026-001` | **HIGH** | Dokter menemukan rekam medis SOAP terisi diagnosa DHF fiktif. |
| 21 | `src/modules/emr/components/CPPTWorkspace.jsx` | 21 | Hardcoded `patientName` payload | **HIGH** | Penyimpanan CPPT mengunci nama pasien ke dummy string. |
| 22 | `src/modules/emr/components/SoapWorkspace.jsx` | 27–28 | Hardcoded `patientName` & `mrn` payload | **HIGH** | Penyimpanan SOAP dokter mengunci nama pasien ke dummy string. |
| 23 | `src/modules/emr/components/EmrWorkspace.jsx` | 39–45 | Hardcoded Header patient identity | **MEDIUM** | Header EMR menampilkan identitas statis. |
| 24 | `src/modules/clinical_core/services/appointmentEngine.service.js` | 29–48 | Fallback dummy appointment `APT-2026-001` | **MEDIUM** | Jadwal perjanjian temu poli terisi data fiktif. |
| 25 | `src/modules/clinical_core/services/encounterEngine.service.js` | 57–81 | Fallback dummy encounter `ENC-2026-001` | **HIGH** | Kunjungan rawat inap aktif fiktif mengunci nomor kamar. |
| 26 | `src/modules/clinical_core/services/episodeOfCareEngine.service.js` | 49–74 | Fallback dummy episode `EOC-2026-001` | **HIGH** | Episode of Care terisi diagnosis fiktif. |
| 27 | `src/modules/clinical_core/components/DoctorCommandCenter.jsx` | 13–64 | Synthetic worklist items array | **HIGH** | Worklist dokter poliklinik memuat antrean pasien fiktif. |
| 28 | `src/modules/clinical_core/components/ClinicalCoreWorkspace.jsx` | 57–101 | Hardcoded patient payload | **MEDIUM** | Form pembuatan episode mengunci nama pasien ke dummy string. |
| 29 | `src/modules/billing/services/billingEngine.service.js` | 54–57 | Default function parameter `patientName` | **LOW** | Invoice kasir menaruh fallback nama dummy. |
| 30 | `src/layouts/MainLayout.jsx` | 214–222 | Hardcoded quick search results | **LOW** | Pencarian cepat global memunculkan pasien dan order dummy. |
| 31 | `src/core/services/clinicalDocumentEngine.service.js` | 39–65 | `initializeSampleDocuments()` | **HIGH** | Repositori dokumen klinis terisi asesmen medis fiktif. |
| 32 | `src/core/services/careTeamEngine.service.js` | 23–41 | `initializeSampleCareTeams()` | **MEDIUM** | Tim rawat multidisiplin terpasang pada pasien dummy. |
| 33 | `src/core/services/episodeOfCareEngine.service.js` | 30–50 | `initializeSampleEpisodes()` | **HIGH** | Episode kardiovaskular fiktif terdaftar di memori core. |
| 34 | `src/core/services/orderEngine.service.js` | 44–70 | `initializeSampleOrders()` | **HIGH** | Order lab CITO fiktif terdaftar di memori core. |
| 35 | `src/core/stores/notification.store.js` | 4–57 | Initial notifications array (4 notifikasi dummy) | **MEDIUM** | Notifikasi nilai kritis dan resep fiktif muncul di bell panel. |
| 36 | `src/core/services/taskEngine.service.js` | 30–50 | `initializeSampleTasks()` | **MEDIUM** | Task analis lab terdaftar otomatis. |
| 37 | `src/core/repositories/patientRepository.js` | 7–21 | `PATIENT_SEED` array | **HIGH** | Master patient repository memuat 1 pasien dummy statis. |
| 38 | `src/design-system/components/NurseStationLargeDisplay.jsx` | 12–17 | Hardcoded `sampleBeds` matrix | **LOW** | TV display 42 inch nurse station menampilkan pasien dummy. |
| 39 | `src/modules/billing/pages/InsuranceDashboard.jsx` | 19–23 | Hardcoded `claims` array | **LOW** | Dashboard klaim asuransi memuat klaim fiktif. |
| 40 | `src/modules/dashboard/pages/DashboardPage.jsx` | 15–92 | Dead `handleSeedData` function | **LOW** | Fungsi seed data pengembangan yang tidak terpakai. |

---

## 2. REKOMENDASI AUDITOR KLINIS

1. **Eksekusi Pembersihan Total:** Hapus seluruh inisialisasi sintetis, ubah ke pola *dynamic state* atau array kosong murni `[]`.
2. **Koneksi Zustand Global Store:** Seluruh antarmuka kerja PPA (Dokter, Perawat, Analis, Farmasis) wajib membaca data dari `usePatientStore` dan `useEncounterStore`.
3. **Empty State UI Rendering:** Komponen antarmuka harus menampilkan placeholder profesional (*"Belum ada data pasien aktif"*) saat tidak ada data, bukan melempar error atau menampilkan nama tiruan.
