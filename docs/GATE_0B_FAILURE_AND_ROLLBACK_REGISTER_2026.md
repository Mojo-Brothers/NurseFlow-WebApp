# 🛡️ REGISTER KEGAGALAN DAN ROLLBACK TRANSAKSI GATE 0B (2026)
**NurseFlow Enterprise Hospital Information System (HIS)**  
**Standar Keamanan:** ACID Transaction Isolation / Two-Phase Fail-Closed Protection  
**Auditor:** NurseFlow Core Architecture Board  
**Tanggal:** 21 Agustus 2026

---

## 1. Tujuan Register

Register ini mendokumentasikan skenario kegagalan operasional yang diuji dan dibuktikan pada **Gate 0B**. Register ini membuktikan bahwa arsitektur HIS NurseFlow **Fail-Closed** dan tidak pernah meninggalkan status korup (corrupted state), data yatim (orphan rows), atau mutasi parsial ketika terjadi kendala sistem atau pelanggaran validasi klinis.

---

## 2. Matriks Skenario Kegagalan & Rollback

| ID Skenario | Domain | Pemicu Kegagalan (Failure Trigger) | Mekanisme Deteksi | Respon Sistem & Status HTTP | Bukti Integritas PostgreSQL Pasca Rollback |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FL-0B-01** | **Inventory** | Permintaan transfer stok melebihi saldo batch tersedia (`quantity > available_quantity`). | Validasi stok terkunci (`SELECT FOR UPDATE`) pada `inventory_batches`. | `HTTP 400 (INSUFFICIENT_STOCK)` | Saldo batch gudang asal tetap utuh, tidak ada batch tujuan yang terbentuk, mutasi stok (`inventory_stock_movements`) tidak bertambah. |
| **FL-0B-02** | **Blood Bank** | Upaya verifikasi transfusi bedside dengan ID perawat yang sama (`primary_nurse_id === secondary_nurse_id`). | Validasi controller & check constraint `chk_distinct_nurses`. | `HTTP 400 (DOUBLE_CHECK_REQUIRED)` | Status kantong darah di `blood_donor_units` tetap `CROSSMATCHED` (bukan `TRANSFUSED`), tidak ada baris di `blood_transfusion_records`. |
| **FL-0B-03** | **Blood Bank** | Upaya modifikasi data inti pada hasil crossmatch yang telah final (`is_finalized = true`). | Trigger database `trg_protect_finalized_crossmatch`. | `Database Exception (IMMUTABILITY_VIOLATION)` | Modifikasi ditolak total oleh PostgreSQL, nilai uji silang serasi tidak berubah. |
| **FL-0B-04** | **Staff Privileging** | Pemberian kewenangan klinis (SPK/RKK) kepada dokter yang tidak memiliki STR/SIP aktif terverifikasi. | Trigger database `trg_validate_privilege_prerequisites`. | `HTTP 400 (AUTHORIZATION_DENIED)` | Rekor kewenangan di `clinical_privileges` tidak tersimpan. |
| **FL-0B-05** | **Appointments** | Percobaan pemesanan jadwal dokter pada slot waktu yang sudah terisi aktif oleh pasien lain. | Mutex query `SELECT FOR UPDATE` pada slot jadwal dokter. | `HTTP 409 (SLOT_CONFLICT)` | Slot awal tetap terjaga untuk pasien pertama, booking duplikat dibatalkan. |
| **FL-0B-06** | **Idempotency** | Pengiriman ulang permintaan booking / transmisi FHIR dengan `Idempotency-Key` yang identik. | Pemeriksaan kunci idempotensi pada tabel terkait. | `HTTP 200 (isDuplicateReplay: true)` | Mengembalikan data transaksi yang sudah ada, jumlah baris di tabel tidak bertambah. |
| **FL-0B-07** | **System Crash** | Simulasi kegagalan sistem / unhandled exception di tengah blok transaksi. | Blok `try { ... COMMIT; } catch { ROLLBACK; }`. | `Transaction Rolled Back` | 0 baris parsial tersimpan di database. |

---

## 3. Kesimpulan Verifikasi

Seluruh 7 skenario kegagalan telah teruji dan terbukti di dalam test suite `tests/gate0bTransactionIntegrity.test.js` dan `tests/gate0bReferentialIntegrity.test.js`. PostgreSQL 16 secara konsisten menjalankan **Atomic Rollback** dengan kebersihan data 100%.
