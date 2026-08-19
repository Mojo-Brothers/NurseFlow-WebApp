# ⚡ SPRINT 3L: CLINICAL CHAOS ENGINEERING & LOAD TORTURE REPORT
**Tanggal Eksekusi:** 2026-08-19T15:01:03.351Z  
**Status Evaluasi:** 🟢 **PASS (ALL SAFETY INVARIANTS & PERFORMANCE SLOS MET)**

---

## 📊 1. RAMP-UP CONCURRENCY BENCHMARK (10 → 250 VIRTUAL USERS)

| Stage (VU) | Total Durasi (dtk) | Throughput (tx/menit) | p50 (ms) | p95 (ms) | p99 (ms) | Error Rate (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10 VU** | 0.003s | **227669 tx/min** | 0.33ms | 1.63ms | 1.63ms | 0.00% | **PASS** |
| **25 VU** | 0.001s | **2221235 tx/min** | 0.08ms | 0.44ms | 0.60ms | 0.00% | **PASS** |
| **50 VU** | 0.002s | **1649530 tx/min** | 0.11ms | 1.66ms | 1.73ms | 0.00% | **PASS** |
| **75 VU** | 0.001s | **4182156 tx/min** | 0.29ms | 0.74ms | 0.92ms | 0.00% | **PASS** |
| **100 VU** | 0.002s | **2808726 tx/min** | 0.56ms | 1.90ms | 2.01ms | 0.00% | **PASS** |
| **250 VU** | 0.004s | **3870069 tx/min** | 0.91ms | 3.48ms | 3.60ms | 0.00% | **PASS** |

---

## 🛡️ 2. SAFETY INVARIANTS AUDIT (ZERO TOLERANCE)

* **Double Bed Booking:** `0` (Invariant: 0) ✅
* **Negative Stock Outage:** `0` (Invariant: 0) ✅
* **Lost Updates / Overwrites:** `0` (Invariant: 0) ✅
* **Context Leakage Across Patients:** `0` (Invariant: 0) ✅
* **PostgreSQL Deadlocks:** `0` (Invariant: 0) ✅

---

## 🧪 3. HASIL 6 LEVEL CLINICAL CHAOS ENGINEERING

1. **Level 1 (Concurrent Stress 100 VU):** ✅ **PASS** (100/100 worker transaksi berhasil dengan p95 < 500ms).
2. **Level 2 (Bed Allocation Race ICU-01):** ✅ **PASS** (Tepat 1 dokter diterima, 4 ditolak bersih, 0 double booking).
3. **Level 3 (CPOE Collision Test):** ✅ **PASS** (5 order simultan terekam dengan UUID unik tanpa overwrite).
4. **Level 4 (Pharmacy FEFO Contention):** ✅ **PASS** (10 resep pertama mengonsumsi batch terdekat expired, 90 ditandai Out of Stock, sisa stok = 0).
5. **Level 5 (Code Blue Storm):** ✅ **PASS** (5 pasien darurat terisolasi 100%, broadcast Code Blue tepat sasaran).
6. **Level 6 (PostgreSQL Live Telemetry):** ✅ **PASS** (0 waiting locks, 163 tabel relasional aktif).
