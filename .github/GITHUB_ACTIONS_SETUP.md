# 🔐 GitHub Actions — Setup Guide (NurseFlow V5)

## 1. Secrets yang Wajib Dikonfigurasi

Masuk ke: `GitHub Repo → Settings → Secrets and variables → Actions`

### Repository Secrets (`SECRETS`)

| Secret Name | Value | Cara Dapat |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | JSON key dari Service Account | Lihat **Langkah A** di bawah |
| `FIREBASE_TOKEN` | Token CI dari Firebase CLI | Jalankan `firebase login:ci` |

### Repository Variables (`VARS`) — Nilai non-rahasia

| Variable Name | Value | Keterangan |
|---|---|---|
| `VITE_FIREBASE_PROJECT_ID` | `nurseflow-309c7` | Project ID Firebase |
| `VITE_SENTINEL_VSN` | `2` | Versi cache sentinel saat ini |

---

## 2. Langkah A — Buat Firebase Service Account

1. Buka [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/nurseflow-309c7/settings/serviceaccounts/adminsdk)
2. Klik **"Generate new private key"**
3. Download file JSON
4. Buka file JSON → copy **seluruh isi** file
5. Paste ke GitHub Secret dengan nama: `FIREBASE_SERVICE_ACCOUNT`

---

## 3. Langkah B — Dapatkan FIREBASE_TOKEN (untuk CLI deploy)

```bash
# Jalankan di terminal lokal kamu
firebase login:ci
```

Ikuti browser authentication, lalu copy token yang muncul di terminal.  
Paste ke GitHub Secret: `FIREBASE_TOKEN`

---

## 4. Struktur Branch & Workflow

```
main ─────────────► deploy-production.yml
                       ├─ Quality Gate (lint + build)
                       ├─ Deploy Firestore Rules & Indexes
                       ├─ Deploy Frontend (Live Channel)
                       └─ JCI Audit Log

develop ──────────► ci.yml + deploy-staging.yml
                       ├─ Quality Gate (lint + build)
                       └─ Deploy to Preview Channel (expires 7d)

pull-request ─────► ci.yml
                       └─ Quality Gate only (no deploy)
```

---

## 5. Alur Deployment yang Direkomendasikan

```
feature/xxx → develop → [Staging Preview URL] → Review → main → [Production Live]
```

### Proteksi Branch (Wajib untuk JCI Compliance)

Di `GitHub → Settings → Branches → Add Rule`:

**Untuk `main`:**
- ✅ Require pull request reviews before merging (1 reviewer minimum)
- ✅ Require status checks to pass: `quality-gate`
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

**Untuk `develop`:**
- ✅ Require status checks to pass: `quality-gate`

---

## 6. Manual Hotfix Deployment

Untuk situasi darurat, gunakan `workflow_dispatch` di tab **Actions** GitHub:

1. Buka tab **Actions** → pilih `Deploy — Production`  
2. Klik **"Run workflow"** → pilih branch `main`  
3. Isi field **Reason** (wajib — masuk ke audit log JCI)  
4. Centang **skip_firestore_deploy** jika hanya ingin update frontend

---

## 7. Status Badge untuk README.md

```markdown
[![CI Quality Gate](https://github.com/YOUR_ORG/nurseflow-webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/nurseflow-webapp/actions/workflows/ci.yml)
[![Deploy Production](https://github.com/YOUR_ORG/nurseflow-webapp/actions/workflows/deploy-production.yml/badge.svg)](https://github.com/YOUR_ORG/nurseflow-webapp/actions/workflows/deploy-production.yml)
```

Ganti `YOUR_ORG` dengan nama GitHub organization/username Anda.
