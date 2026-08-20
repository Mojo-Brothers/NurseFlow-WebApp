# 🏛️ FASE 5C.1: BACKEND AUTHORITY MODEL, CANONICAL API CONTRACT & TRANSACTION OWNERSHIP
## Spesifikasi Standar Arsitektur Unifikasi Backend & Desain Eksekusi Vertical Slice #001
**Tanggal Rilis:** 20 Agustus 2026  
**Auditor & Arsitek:** Enterprise HIS Architecture Board & CTO Technical Review  
**Klasifikasi:** Phase 5C.1 Core Architectural Foundation  
**Status Evaluasi:** 🟢 `5C.0 FORENSIC BASELINE ACCEPTED` ➔ 🔵 `5C.1 SPECIFICATION OPENED`  

---

## 🔒 1. KOREKSI FUNDAMENTAL CLINICAL DURABILITY GATE

Sesuai putusan CTO, rumus durabilitas klinis dibedakan secara tegas antara **READ COMMAND** dan **CLINICAL WRITE COMMAND** guna mencegah *event noise*:

### A. Kontrak Read Command (Pencarian & Timeline)
$$\text{READ HTTP 200} \iff \text{Authorized} \land \text{Query Executed Successfully} \land \text{Consistent Read Returned}$$
*(Tidak dipaksa membuat Outbox Event)*.

### B. Kontrak Clinical Write Command (Mutasi Klinis)
$$\text{WRITE HTTP Success} \iff \left( \text{Authorized} \land \text{Invariants Valid} \land \text{PostgreSQL Mutation} \land \text{Audit Log} \land \text{Outbox Event*} \land \text{Atomic Commit} \right)$$
*`Outbox Event*` hanya disisipkan jika terdapat kebutuhan integrasi downstream (misal: SATUSEHAT, BPJS, Billing trigger).*

### C. Jaminan Anti-Phantom Success (Rollback Guarantee)
$$\text{Any Component Failure} \implies \text{ATOMIC ROLLBACK} \land \text{NO PHANTOM SUCCESS}$$
*Jika audit log atau outbox gagal disimpan, transaksi database dibatalkan secara total.*

---

## 🛡️ 2. 5C.1A — BACKEND AUTHORITY MODEL (MENCEGAH DUAL-BRAIN)

Untuk mencegah konflik *dual-brain* antara logika frontend dan backend, batas otoritas ditetapkan secara mutlak:

| Area Tanggung Jawab | Frontend UI Layer | Backend Server Domain Layer | Keterangan & Batas Medicolegal |
| :--- | :---: | :---: | :--- |
| **Form UX & Required Check** | 🟢 Ya (Optimistic) | 🟢 Ya (Strict Schema) | Frontend memberi feedback cepat; Backend memvalidasi tipe & batas data. |
| **Permission & Button Guard**| 🟢 Ya (Display Guard)| 🔒 **Final Authority** | Frontend menyembunyikan tombol; Backend menolak request 403 Forbidden. |
| **Clinical Invariants (CDSS)**| 🟡 Preview / Warning | 🔒 **Final Authority** | Frontend menampilkan saran interaksi obat; Backend menolak resep fatal. |
| **FSM State Transitions** | 🟡 Optimistic Preview| 🔒 **Final Authority** | Backend memverifikasi urutan transisi status encounter/order yang sah. |
| **ID Generation (MRN / UUID)** | 🟡 Temporary ID | 🔒 **Final Authority** | Backend menerbitkan UUID v4 dan nomor Rekam Medis (MRN) permanen. |
| **Universal Audit Trail** | ❌ Tidak Berhak | 🔒 **Final Authority** | Backend menyusun hash SHA-256 dan mencatat IP/Aktor ke database. |
| **PostgreSQL State Mutation**| ❌ Tidak Berhak | 🔒 **Final Authority** | Seluruh SQL INSERT/UPDATE/DELETE hanya dieksekusi di server. |
| **Transactional Outbox** | ❌ Tidak Berhak | 🔒 **Final Authority** | Backend menulis event ke antrean outbox dalam transaksi yang sama. |

---

## 📜 3. 5C.1B — CANONICAL API CONTRACT & RESPONSE ENVELOPE

Seluruh endpoint REST API v1 wajib mematuhi konvensi seragam:

### A. Struktur Endpoint Standar
```text
POST   /api/v1/patients                  # Mendaftarkan pasien baru ke MPI
GET    /api/v1/patients/:id              # Mengambil detail profil pasien
GET    /api/v1/patients?q=&page=&limit=  # Pencarian pasien (MRN, NIK, Nama)

POST   /api/v1/encounters                # Membuka encounter baru
PATCH  /api/v1/encounters/:id/status     # Transisi status encounter FSM

POST   /api/v1/beds/assign               # Menempatkan pasien pada bed rawat inap
POST   /api/v1/beds/transfer             # Memindahkan pasien antar-ruangan/bed

POST   /api/v1/emergency/triage          # Menyimpan triase IGD ESI/ATS
POST   /api/v1/emr/soap                  # Menyimpan catatan SOAP dokter
POST   /api/v1/orders                    # Menerbitkan CPOE order (Lab/Rad/Farmasi)
POST   /api/v1/pharmacy/dispense         # Mengeluarkan stok obat (FEFO)
POST   /api/v1/nursing/emar              # Verifikasi 5-Benar & pemberian obat
```

### B. Standard Success Response Envelope
```json
{
  "success": true,
  "data": {
    "id": "e4b0a1c2-3d4e-4f5a-6b7c-8d9e0f1a2b3c",
    "mrn": "MRN-2026-00892",
    "fullName": "Budi Santoso",
    "nik": "3171012304850001"
  },
  "meta": {
    "requestId": "REQ-1724147800-A9F1",
    "correlationId": "CORR-20260820-001",
    "timestamp": "2026-08-20T08:15:30.120Z",
    "serverVersion": "v1.0.0-enterprise"
  }
}
```

### C. Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "CLINICAL_DUPLICATE_PATIENT_DETECTED",
    "message": "Pasien dengan NIK 3171012304850001 telah terdaftar di Master Patient Index.",
    "details": [
      { "field": "nik", "issue": "ALREADY_EXISTS", "existingMrn": "MRN-2026-00104" }
    ]
  },
  "meta": {
    "requestId": "REQ-1724147800-A9F1",
    "correlationId": "CORR-20260820-001",
    "timestamp": "2026-08-20T08:15:30.120Z"
  }
}
```

---

## 🔒 4. 5C.1C — TRANSACTION OWNERSHIP (ATOMIC UNIT-OF-WORK)

Setiap mutasi klinis dikelola oleh **Application Service** di dalam satu transaksi terisolasi:

```javascript
// Pattern: Atomic Application Service Unit of Work
export const executeClinicalTransaction = async (pool, workFn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL READ COMMITTED;');
    const result = await workFn(client);
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    await client.query('ROLLBACK;');
    throw error;
  } finally {
    client.release();
  }
};
```

---

## 🎯 5. ROADMAP EKSEKUSI VERTICAL SLICE #001 (VS-01)

Sebelum mengerjakan seluruh endpoint, fokus dialihkan 100% pada pembuktian pipa tunggal pertama:

# `VS-01 — REGISTER PATIENT → POSTGRESQL DURABILITY`

```text
RegistrationDeskWorkspace (React UI)
               │
               ▼
   [ Centralized httpClient.js ]
               │
               ▼ (POST /api/v1/patients)
    [ Express API Gateway ]
               │
               ▼ (Auth & RBAC Middleware)
   [ Patient Application Service ]
               │
               ▼ (Validate MPI Duplicate NIK/MRN)
 ┌───────────────────────────────────────────────┐
 │ BEGIN TRANSACTION                             │
 │ ├── 1. INSERT INTO master_patients            │
 │ ├── 2. INSERT INTO universal_audit_logs       │
 │ └── 3. INSERT INTO fhir_delivery_outbox*      │
 │ COMMIT                                        │
 └───────────────────────────────────────────────┘
               │
               ▼
 [ Standardized Response Envelope ]
               │
               ▼
 RegistrationDeskWorkspace Updates UI
```

### 10 Langkah Pembuktian Klinis Durabilitas (Verification Proof #001):
1. Registrasi pasien baru melalui antarmuka `RegistrationDeskWorkspace`.
2. Verifikasi pengiriman HTTP POST Request ke `/api/v1/patients`.
3. Verifikasi log request Express Gateway dengan Correlation ID.
4. Verifikasi eksekusi blok `BEGIN ... COMMIT` pada pool PostgreSQL.
5. Verifikasi kueri langsung `SELECT * FROM master_patients WHERE mrn = ...`.
6. Lakukan restart pada service backend Node.js.
7. Lakukan reload browser (F5 / Hard Reload).
8. Buka sesi browser baru / perangkat terpisah.
9. Lakukan pencarian pasien berdasarkan NIK / MRN.
10. Konfirmasi data pasien tetap utuh 100% dari PostgreSQL tanpa ketergantungan pada `localStorage`.
