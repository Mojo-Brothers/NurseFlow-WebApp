# 🏥 STANDAR OPERASIONAL PROSEDUR (SOP): DATABASE FAILOVER & DISASTER RECOVERY
## NURSEFLOW ENTERPRISE HOSPITAL INFORMATION SYSTEM (HIS 2026)

**Standar Acuan:** JCI Facilities & Safety Management (FMS), ISO 27001 Business Continuity & Permenkes No. 24/2022  
**Target Pemulihan:** Recovery Time Objective (RTO) < 15 Menit | Recovery Point Objective (RPO) < 5 Menit

---

## 1. ARSITEKTUR REPLIKASI & CONNECTION POOLING

```text
               CLIENT (500 NAKES)
                      │
                      ▼
             NGINX REVERSE PROXY
                      │
                      ▼
              NODE.JS API GATEWAY
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
    PGBOUNCER (POOL: 200)       REDIS CACHE 7
        │
        ▼
 ┌──────────────┐
 │  POSTGRESQL  │
 │   PRIMARY    │
 └──────┬───────┘
        │ Streaming WAL Replication (Slot: standby_slot_1)
        ▼
 ┌──────────────┐
 │  POSTGRESQL  │
 │   STANDBY    │ ◄─── FAILOVER SENTINEL (Auto-Promote in <15s)
 └──────────────┘
```

---

## 2. PANDUAN PENANGANAN 5 SKENARIO KEGAGALAN SISTEM

### Skenario 1: Server Database Primary Mati Total (Hardware Crash / Power Loss)
1. **Otomatis (Sentinel):** Daemon `failover_sentinel.sh` mendeteksi 3 kegagalan berturut-turut (9 detik) $\rightarrow$ mengeksekusi `/scripts/promote_standby.sh` $\rightarrow$ Standby berubah menjadi Primary Read-Write.
2. **Manual (Jika Sentinel Mati):**
   ```bash
   # Masuk ke container/server standby:
   docker exec -it nurseflow_postgres_standby /scripts/promote_standby.sh
   # Update PgBouncer konfigurasi ke server baru:
   sed -i 's/postgres-primary/postgres-standby/g' /etc/pgbouncer/pgbouncer.ini
   kill -HUP $(pgrep pgbouncer)
   ```
3. **Verifikasi:** Jalankan `SELECT pg_is_in_recovery();` (Hasil harus `f` = false).

---

### Skenario 2: Lonjakan Beban Koneksi (>200 Koneksi Nakes)
1. PgBouncer diatur dengan mode `pool_mode = transaction`.
2. Jika 2.000 transaksi nakes masuk bersamaan, PgBouncer mengantrekan request secara transaksional tanpa menolak koneksi (*Zero 'remaining connection slots are reserved' error*).

---

### Skenario 3: Kerusakan Segmen WAL (WAL Corruption Recovery)
1. Hentikan PostgreSQL service.
2. Ekstrak Base Backup terakhir dari `/var/backups/nurseflow/postgres/base_backups/`.
3. Buat file marker `recovery.signal`.
4. Konfigurasikan `restore_command = 'cp /var/backups/nurseflow/postgres/wal_archive/%f %p'`.
5. Nyalakan PostgreSQL $\rightarrow$ Engine melakukan roll-forward data hingga detik terakhir sebelum crash.

---

### Skenario 4: Partisi Jaringan Antar-Data Center (Anti-Split Brain)
1. Sentinel memverifikasi *Quorum State*: Node Standby hanya boleh dipromosikan jika Node Primary terbukti unreachable dan Node Standby memiliki konektivitas aktif.
2. Jika kedua node tidak dapat dijangkau (*isolated network split*), sentinel mengunci sistem ke mode Read-Only untuk mencegah percabangan data (*Split-Brain Inconsistency*).

---

### Skenario 5: Rekonstruksi Node Primary Lama Pasca Perbaikan
1. Ketika node Primary lama kembali menyala setelah perbaikan, node tersebut **TIDAK BOLEH** langsung mengambil alih peran Primary.
2. Jalankan `setup_standby.sh` pada node lama agar node lama berubah fungsi menjadi **Standby Replica** yang menyerap data dari Promoted Primary baru.
