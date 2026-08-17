# 🔄 Clinical Workflow Sequence Diagrams
## NurseFlow Enterprise HIS 2026

**Standard Compliance:** JCI 7th Edition (Patient Journey), KARS PMKP, Permenkes No. 24/2022

---

## 1. 🏥 Patient Intake & IGD Rapid Triage Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as 👤 Pasien / Keluarga
    actor FO as 🖥️ Admission / Front Office
    actor Nurse as 👩‍⚕️ Triage Nurse (IGD)
    participant EMPI as 🗂️ EMPI Engine
    participant Triage as ⚡ Triage Engine
    participant DB as 🐘 PostgreSQL / Outbox

    Patient->>FO: Datang ke IGD / Loket Pendaftaran
    FO->>EMPI: Cari NIK / Nama + Tgl Lahir
    alt Pasien Ditemukan di EMPI
        EMPI-->>FO: Return Master Patient Data (MRN)
    else Pasien Baru / Unregistered
        FO->>EMPI: Registrasi Pasien Baru
        EMPI->>DB: INSERT into patients (Generate MRN)
    else Pasien Gawat Darurat Tanpa Identitas (Mr. X)
        FO->>EMPI: Registrasi Darurat Mr./Mrs. X
        EMPI->>DB: INSERT anonymous patient record
    end

    FO->>DB: Buat Episode of Care & Encounter (Status: IN_PROGRESS)
    Nurse->>Triage: Lakukan ABCDE Survey & Input Tanda Vital
    Triage->>Triage: Evaluasi ESI 1-5 & Auto-Escalation Threshold
    Triage->>DB: INSERT into triage_records & start SLA Stopwatch
    DB-->>Nurse: Triage Level (ESI 1-5) Assigned & Bed Allocated
```

---

## 2. 👨‍⚕️ Doctor Consultation, CDSS & Universal Ordering Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as 👨‍⚕️ DPJP / Dokter Jaga
    participant Workspace as 💻 Doctor Workspace (UI)
    participant CDSS as 💡 CDSS Engine
    participant Allergy as 🛑 Allergy Guard
    participant Order as 📦 Universal Order Engine
    participant DB as 🐘 PostgreSQL / Outbox
    actor Nurse as 👩‍⚕️ Bangsal / Farmasi / Lab

    Doctor->>Workspace: Buka Pasien dari Antrean Konsultasi
    Workspace->>DB: Ambil Anamnesis, TTV Live & Riwayat Alergi
    Doctor->>Workspace: Input SOAP (S, O, A: ICD-10, P)
    Workspace->>CDSS: Evaluasi Diagnosis (Contoh: Sepsis / STEMI)
    CDSS-->>Doctor: 🚨 Rekomendasi Hour-1 Sepsis Bundle
    
    Doctor->>Workspace: Terbitkan Resep Obat & Order Lab/Rad
    Workspace->>Allergy: Verifikasi Kontraindikasi Alergi Pasien
    alt Ada Konflik Alergi (Contoh: Amoksisilin pada Pasien Alergi Penisilin)
        Allergy-->>Doctor: 🛑 HARD BLOCK: Resep ditolak demi keselamatan pasien!
    else Resep Aman
        Doctor->>Order: Konfirmasi Order Klinis
        Order->>DB: INSERT into universal_orders (Status: ORDERED)
        DB->>DB: Publish Event ORDER_CREATED via Outbox
        DB-->>Nurse: 🔔 Real-Time Notification Masuk ke Worklist
    end
```

---

## 3. 🩸 Blood Transfusion Safety Workflow (BDRS)

```mermaid
sequenceDiagram
    autonumber
    actor Doctor as 👨‍⚕️ Dokter DPJP
    actor BDRS as 🔬 Petugas BDRS
    actor Nurse1 as 👩‍⚕️ Nurse Primer
    actor Nurse2 as 👩‍⚕️ Nurse Verifikator
    participant DB as 🐘 PostgreSQL Trigger

    Doctor->>BDRS: Order Permintaan Darah Transfusi (PRC/FFP)
    BDRS->>BDRS: Uji Silang Serasi (Crossmatch Mayor, Minor, Auto-Kontrol)
    alt Hasil Crossmatch Inkompatibel
        BDRS->>DB: Catat Status INCOMPATIBLE (Unit di-Karantina)
    else Hasil Crossmatch Kompatibel
        BDRS->>DB: Catat Status COMPATIBLE & Kunci Unit untuk Pasien
        BDRS-->>Nurse1: Unit Darah Siap Diambil di Cold-Chain
    end

    Nurse1->>Nurse2: Verifikasi Ganda di Samping Tempat Tidur (Bedside Dual Check)
    Nurse1->>DB: Input Hasil Verifikasi 2 Perawat & No. Kantong
    DB->>DB: Verifikasi Database Trigger (Crossmatch = COMPATIBLE)
    DB-->>Nurse1: Otorisasi Transfusi Diberikan & Catat Log Suhu Transfusi
```
