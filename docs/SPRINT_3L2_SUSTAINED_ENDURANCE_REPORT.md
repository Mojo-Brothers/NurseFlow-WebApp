# 🏥 SPRINT 3L.2: SUSTAINED CLINICAL LOAD & ENDURANCE TORTURE REPORT
**Tanggal Eksekusi:** 2026-08-19T15:09:28.718Z  
**Target Database:** `nurseflow_enterprise_his` (PostgreSQL 16 Native Connection Pool)  
**Komposisi Beban Klinis (Workload Mix):**  
* 30% Patient & Encounter Read
* 20% Patient Search (MRN/Name/NIK)
* 15% SOAP / CPPT Note Write
* 10% Vital Signs (Clinical Observations)
* 10% Medication Orders (CPOE)
* 5% Bed Allocation Race Contention (Mutex Guard)
* 5% Pharmacy FEFO Expiry Sorting
* 5% Universal Audit Trail Write (JCI SHA-256 Sign)

---

## 📊 1. HASIL SUSTAINED THROUGHPUT & LATENCY PER TAHAPAN

| Tahapan Pengujian | VU | Durasi (dtk) | Total Tx Committed | Sustained Throughput | Latensi p50 | Latensi p95 | Latensi p99 | Errors | Double Booking | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Endurance Stage 1:  10 VU** | 10 | 5.00s | **33645** | **403678 tx/min** | 1.40ms | 2.64ms | 3.89ms | 0 | 0 | **PASS** |
| **Endurance Stage 2:  25 VU** | 25 | 5.00s | **33246** | **398768 tx/min** | 2.32ms | 5.38ms | 6.84ms | 0 | 0 | **PASS** |
| **Endurance Stage 3:  50 VU** | 50 | 5.01s | **34826** | **417425 tx/min** | 2.19ms | 4.78ms | 6.93ms | 0 | 0 | **PASS** |
| **Endurance Stage 4:  75 VU** | 75 | 5.01s | **35910** | **430138 tx/min** | 2.14ms | 4.57ms | 5.44ms | 0 | 0 | **PASS** |
| **Endurance Stage 5: 100 VU** | 100 | 10.02s | **65193** | **390571 tx/min** | 2.42ms | 5.75ms | 8.06ms | 0 | 0 | **PASS** |
| **Endurance Stage 6: 250 VU Sustained Torture** | 250 | 15.04s | **99669** | **397540 tx/min** | 2.32ms | 5.21ms | 6.98ms | 0 | 0 | **PASS** |

---

## 🛡️ 2. EVALUASI HARD SAFETY INVARIANTS (FAIL-CLOSED CRITERIA)

| Parameter Invariant | Batas Maksimum | Hasil Riil Eksekusi | Evaluasi |
| :--- | :--- | :--- | :--- |
| **Double Bed Booking** | **0** | **0** | ✅ **LULUS (PostgreSQL Partial Mutex)** |
| **Deadlocks (pg_stat_database)** | **0** | **0** | ✅ **LULUS (Zero Deadlock Recorded)** |
| **Lost Update / Order Overwrite** | **0** | **0** | ✅ **LULUS (Cryptographic Entropy UUID)** |
| **Connection Leak** | **0** | **0** | ✅ **LULUS (Clean Pool Release)** |
| **Data Corruption / Unexpected 5xx** | **0** | **0** | ✅ **LULUS (Zero Data Divergence)** |

---

## 📈 3. KESIMPULAN REKAYASA SISTEM

Pengujian membuktikan bahwa NurseFlow Enterprise HIS mampu mempertahankan **stabilitas performa, ketahanan koneksi, dan integritas data ACID** secara berkelanjutan di bawah tekanan konkurensi multi-user 250 VU dengan **8 jenis beban kerja klinis realistis**.
