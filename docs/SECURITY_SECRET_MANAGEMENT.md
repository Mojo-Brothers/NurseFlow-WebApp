# 🔒 Kebijakan Manajemen Rahasia & Pengerasan Lingkungan (Secret Management Policy)

## 📌 1. Prinsip Utama
> **"CODE IS PORTABLE. SECRETS ARE NOT. DATA IS ENVIRONMENT-SCOPED."**

Repositori Git NurseFlow hanya menyimpan kode sumber, skrip migrasi, pengujian, dokumentasi, dan template konfigurasi (`.env.example`). Tidak ada kata sandi, kunci privat kriptografi, token JWT, kunci API, atau data Protected Health Information (PHI) yang boleh di-commit ke Git.

---

## 🚨 2. Insiden Keamanan & Rotasi Rahasia Wajib (Secret Rotation Protocol)
File `.env` yang sebelumnya pernah berada di dalam repositori Git harus dianggap **COMPROMISED (BOCOR)**.

### Prosedur Rotasi Kredensial Wajib:
1. **PostgreSQL Database Password (`POSTGRES_PASSWORD`):**
   * Ubah kata sandi basis data PostgreSQL pada seluruh server staging/produksi.
2. **JWT Secret Key (`JWT_SECRET`):**
   * Terbitkan ulang kunci rahasia HMAC-SHA256 baru berukuran minimal 256-bit (32 karakter acak) pada environment variable server.
   * Invalidasi seluruh sesi dan token aktif.
3. **Redis Cache Password (`REDIS_PASSWORD`):**
   * Perbarui konfigurasi `requirepass` pada instance Redis.
4. **SATUSEHAT & BPJS Credentials:**
   * Lakukan pergantian *Client Secret* dan *User Key* melalui portal pengembang SATUSEHAT Kemkes dan BPJS Trust Mark.

---

## 🏢 3. Pemisahan Lingkungan (Environment Separation)

| Lingkungan | Lokasi Penyimpanan Secret | Kebijakan Nilai Secret |
| :--- | :--- | :--- |
| **Local Development** | `.env.local` pada masing-masing mesin pengembang | Nilai lokal unik / dummy non-produksi |
| **CI / CD Pipeline** | GitHub Actions Encrypted Secrets (`secrets.JWT_SECRET`, dll) | Kunci pipeline otomatis terenkripsi |
| **Staging Server** | Secret Manager / AWS SSM / GCP Secret Manager | Kredensial terisolasi untuk staging |
| **Production Server** | Vault / Secret Manager dengan akses berbasis IAM ketat | Kredensial produksi definitif (Zero Local Access) |

---

## 🛡️ 4. Aturan Penguncian Git (`.gitignore`)
Aturan penguncian Git secara ketat mengecualikan:
* `.env`, `.env.*` (kecuali `.env.example`)
* `*.pem`, `*.key`, `*.crt`, `*.pfx`, `*.p12`
* `credentials.json`, `service-account*.json`, `firebase-adminsdk*.json`
* Direktori `secrets/`, `private/`, `certs/`

---

## 🔍 5. Pemindaian Otomatis (Automated Secret Scanning)
Jalankan pemindaian sebelum melakukan commit atau pada pipeline CI/CD:
```bash
npm run scan:secrets
```
Skrip akan memeriksa berkas dari pola kunci privat, kunci API, token personal akses GitHub, dan URL database yang terekspos.

---

## 🚑 6. Prosedur Pemulihan Device (Device Recovery Workflow)

### Skenario: Menyiapkan Device Baru
1. Clone repositori: `git clone https://github.com/Mojo-Brothers/NurseFlow-WebApp.git`
2. Jalankan dependensi: `npm install`
3. Jalankan wizard: `npm run setup`
4. Sesuaikan `.env.local` jika diperlukan.

### Skenario: Device Hilang atau Dicuri
1. Cabut token akses dan sesi aktif pengguna yang bersangkutan melalui Identity Management.
2. Putar (rotate) kredensial basis data lokal dan kunci API yang mungkin tersimpan pada `.env.local` device tersebut.
3. Pastikan tidak ada kredensial produksi yang pernah tersimpan pada device lokal pengembang.
