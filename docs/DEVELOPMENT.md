# 🛠️ Panduan Pengembangan Multi-Device (NurseFlow HIS Development Guide)

Dokumen ini menjelaskan alur standar untuk menjalankan dan mengembangkan NurseFlow Enterprise HIS dari device mana pun tanpa pernah menyalin file credential sensitif antar pengembang.

---

## 📋 1. Prasyarat Lingkungan (Prerequisites)

* **Node.js:** Versi 20 LTS (Minimal Node.js v18.0.0)
* **Package Manager:** npm (v9.x atau v10.x)
* **Docker & Docker Compose (Opsional):** Untuk menjalankan PostgreSQL 16 & Redis 7 lokal secara terisolasi.
* **Git:** Versi terbaru

---

## 🚀 2. Setup Pertama Kali pada Device Baru (First-Time Setup)

Jalankan perintah berikut di terminal:

```bash
# 1. Clone repositori
git clone https://github.com/Mojo-Brothers/NurseFlow-WebApp.git
cd NurseFlow-WebApp

# 2. Pasang dependensi
npm install

# 3. Jalankan wizard inisialisasi lingkungan lokal
npm run setup
```

Perintah `npm run setup` akan:
1. Memverifikasi versi Node.js.
2. Membuat file `.env.local` dari template `.env.example` (tidak akan menimpa `.env.local` yang sudah ada).
3. Memastikan `.gitignore` aktif melindungi kredensial.
4. Menyiapkan struktur direktori yang dibutuhkan.

---

## 🧪 3. Pengujian & Build

```bash
# Menjalankan seluruh test suites otomatis (32 suites / 79 tests)
npm test

# Menjalankan pemindaian rahasia/kredensial
npm run scan:secrets

# Menjalankan build produksi (Vite)
npm run build

# Menjalankan server pengembangan frontend
npm run dev
```

---

## 🐳 4. Menjalankan Database PostgreSQL & Redis Lokal (Docker Compose)

Jika Anda ingin menjalankan database dan cache lokal:

```bash
docker compose up -d postgres-db redis-cache
```

Database PostgreSQL akan berjalan di port `5432` dan Redis di port `6379` dengan volume persisten terisolasi pada device Anda.

---

## 🔄 5. Berpindah Antar Device (Device Switching Workflow)

1. Pastikan seluruh perubahan kode telah di-commit dan di-push ke GitHub:
   ```bash
   git status
   git push origin main
   ```
2. Pada device lain:
   ```bash
   git pull origin main
   npm install
   npm test
   ```
3. File `.env.local` bersifat lokal pada setiap device dan tidak pernah di-commit ke Git.
