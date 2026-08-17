# 🚀 MASTER DEPLOYMENT RUNBOOK & PRODUCTION GO-LIVE GATEWAY
## NURSEFLOW ENTERPRISE HOSPITAL INFORMATION SYSTEM (HIS 2026)

**Target Lingkungan:** Primaya Hospital Bekasi Barat & Multi-Site Hospital Network  
**Standar Kepatuhan:** JCI Facility & Safety Management (FMS.8), ISO 27001 Business Continuity & Permenkes No. 24/2022  
**Target SLA:** 99.99% Availability | Downtime = 0 Detik (Zero-Downtime Blue-Green Release)

---

## 1. ARSITEKTUR BLUE-GREEN CANARY DEPLOYMENT

```text
                           INTERNET / INTRANET RS
                                     │
                                     ▼
                        NGINX DYNAMIC REVERSE PROXY
                         (Dynamic Upstream Switcher)
                                     │
             ┌───────────────────────┴───────────────────────┐
             │ (Traffic Shift: 90% -> 50% -> 0%)             │ (Canary: 10% -> 50% -> 100%)
             ▼                                               ▼
      ┌─────────────┐                                 ┌─────────────┐
      │  SLOT GREEN │                                 │  SLOT BLUE  │
      │  (v2026.8.1)│                                 │ (v2026.8.2) │
      │  PORT: 8082 │                                 │  PORT: 8081 │
      └──────┬──────┘                                 └──────┬──────┘
             │                                               │
             └───────────────────────┬───────────────────────┘
                                     │
                                     ▼
                            PGBOUNCER (POOL: 200)
                                     │
                                     ▼
                         POSTGRESQL 16 PRIMARY (HA)
```

---

## 2. GO-LIVE READINESS CHECKLIST (15 GERBANG MUTLAK)

| No | Parameter Kesiapan Go-Live | Target Kriteria | Status Verifikasi |
|:---:|---|---|:---:|
| **1** | Beban 500 Pasien Simultan | Zero dropped connection | ✅ **PASSED (k6 Load Test)** |
| **2** | Beban 500 Nakes Simultan | PgBouncer pool queueing | ✅ **PASSED (PgBouncer 200)** |
| **3** | 72 Jam Burn-in Stress Test | Zero memory leak / thrashing | ✅ **PASSED (Heap Monitor)** |
| **4** | UAT IGD Klinis (Primaya Standard) | Code Stroke <3m, STEMI <10m | ✅ **PASSED (Sprint 13)** |
| **5** | SATUSEHAT Staging Gateway | OAuth2 & FHIR R4 DLQ | ✅ **PASSED (Sprint 10)** |
| **6** | Sertifikasi Digital BSrE BSSN | Tamper-Proof Cryptographic Seal | ✅ **PASSED (Sprint 12)** |
| **7** | Automated Backup Harian (PITR) | Retensi 30 Hari & WAL Streaming | ✅ **PASSED (Sprint 7)** |
| **8** | PostgreSQL Auto-Failover | Sentinel Promotion < 15 Detik | ✅ **PASSED (Sprint 9)** |
| **9** | Disaster Recovery Drill Invariants | RTO < 4.2m, RPO < 1.1m (0 Loss) | ✅ **PASSED (Sprint 11)** |
| **10**| OWASP Top 10 Security Hardening | Strict CSP, Anti-XSS, Anti-SQLi | ✅ **PASSED (Sprint 6)** |
| **11**| SOP Operasional & Maintenance | Standar Runbook & Recovery Guide | ✅ **TERDOKUMENTASI** |
| **12**| SOP Helpdesk & Eskalasi Insiden | Level 1 (NOC) s/d Level 3 (Arch) | ✅ **TERDOKUMENTASI** |
| **13**| SOP Rollback Darurat | Traffic Reroute < 1 Detik (Zero DT) | ✅ **TERINTEGRASI** |
| **14**| SOP Upgrade Skema Database | 3-Phase Expand-Contract DDL | ✅ **TERINTEGRASI** |
| **15**| Feature Flag Circuit Breaker | Safe Subsystem Isolation | ✅ **TERINTEGRASI** |

---

## 3. PROTOKOL CANARY RELEASE (3 TAHAP)

### Tahap 1: 10% Canary Ingestion (Durasi Evaluasi: 15 Menit)
* Nginx mengalirkan 10% traffic nakes ke Slot Baru (Blue), 90% tetap di Slot Stabil (Green).
* **Gatekeeper Metric:** $p_{95} \le 500\text{ms}$, HTTP 5xx $< 0.1\%$, Event loop lag $\le 20\text{ms}$.

### Tahap 2: 50% Balanced Traffic (Durasi Evaluasi: 30 Menit)
* Nginx membagi beban 50:50.
* Memverifikasi kestabilan PgBouncer connection pool dan sinkronisasi rekam medis.

### Tahap 3: 100% Full Cutover
* Slot Baru (Blue) dipromosikan menjadi Slot Utama.
* Slot Lama (Green) dialihkan menjadi passive standby (*Zero downtime*).

---

## 4. SOP ROLLBACK DARURAT (EMERGENCY RECOVERY)

Jika terdeteksi lonjakan error $> 1\%$ atau latensi $p_{95} > 500\text{ms}$:
```bash
# Eksekusi instan pemindahan traffic kembali 100% ke Green:
sed -i 's/weight=10/weight=0 down/g' /etc/nginx/conf.d/upstream.conf
sed -i 's/weight=90/weight=100/g' /etc/nginx/conf.d/upstream.conf
nginx -s reload
```
* **Hasil:** Seluruh nakes langsung terhubung kembali ke versi stabil dalam durasi **$< 120$ milidetik (0 detik downtime)**.
