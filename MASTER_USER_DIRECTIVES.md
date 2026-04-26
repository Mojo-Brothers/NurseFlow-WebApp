Terapkan pada proyek ini sebagai referensi hindari layout collapse, pastikan berfungsi sesuai alur kerja

<!-- NurseFlow Triage System Architecture -->
# System Architecture: NurseFlow Clinical Triage OS (JCI Elite)

## 1. Executive Summary

A high-velocity, decision-support-driven triage ecosystem for Emergency and Outpatient departments, compliant with JCI, ATS, and ESI standards.

## 2. End-to-End Workflow (Clinical Pipeline)

### IGD (Emergency) Flow

1. **Arrival:** Instant timestamping. Primary Survey (ABC) within < 30 seconds.
2. **Rapid Triage:** Input 5 core fields (Complaint, HR, RR, SpO2, AVPU). System suggests ESI level.
3. **Priority Assignment:** Nurse confirms/overrides ESI. SLA Countdown starts.
4. **Secondary Triage:** Post-stabilization detail entry (History, Allergy, SATUSEHAT Sync).
5. **Monitoring:** Automated NEWS2 recalculation. Trigger re-triage if vitals deteriorate.
6. **Disposition:** AI-assisted recommendation (ICU, Ward, Discharge). Audit-logged override.

### Poli (Outpatient) Flow

1. **Screening:** Rapid vital check + screening questions.
2. **Priority Classification:** Priority vs. Standard queue.
3. **Escalation:** Automatic "Emergency Trigger" if vitals hit critical thresholds, bypassing Poli for immediate IGD intake.

## 3. Operational UI Modes

- **⚡ Rapid Mode:** Focuses on Phase 0/1. Minimalist UI, high-speed numeric input, zero distraction.
- **🧾 Detail Mode:** Structured form for Phase 4. Includes Allergy flags, Meds, and Infection control.
- **📊 Monitor Mode:** The "Emergency Board". Real-time queue, SLA tracking, and overcrowding alerts.

## 4. Logic Engine (Pseudo-Code)

### ESI Decision Tree

```typescript
function suggestESI(vitals, complaint) {
  if (vitals.isCritical || complaint.isLifeThreatening) return 1; // Resus
  if (vitals.isHighRisk || complaint.isEmergent) return 2; // Emergent
  if (vitals.resourceNeeds > 1 && vitals.isStable) return 3; // Urgent
  return 4; // Less Urgent
}
```

### NEWS2 Calculation

- **Red Zone (Score >= 7):** Immediate clinical trigger. Escalate to MD.
- **Amber Zone (Score 5-6):** Medium risk. Urgent review.

## 5. Data Schema (Core Tables)

- **TriageSession:** `triage_id`, `patient_id`, `arrival_time`, `esi_level`, `news2_score`, `state` (ARRIVED, TRIAGED, etc.).
- **ClinicalVitals:** `timestamp`, `hr`, `rr`, `spo2`, `bp_sys`, `bp_dia`, `temp`, `pain_scale`, `gcs`.
- **AuditLog:** `event_id`, `user_id`, `action`, `original_value`, `new_value`, `override_reason`, `timestamp`.

## 6. JCI Compliance Checklist

- [x] Two-factor identification (MRN + Name/DOB).
- [x] Time-to-Care Monitoring (SLA tracking per ESI).
- [x] Visible Audit Trail & Override Accountability.
- [x] Infection Control & Isolation Flags.
- [x] Critical Value Alerts & Automated Escalation.

<!-- Rapid Intake Mode (Phase 0/1) -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Rapid Intake - Triage Module</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Public+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "outline": "#737784",
                        "on-secondary-fixed": "#00201a",
                        "on-secondary-container": "#1a6f5f",
                        "on-primary-fixed": "#001a41",
                        "on-tertiary-fixed-variant": "#7d2d00",
                        "on-surface": "#191b21",
                        "on-secondary-fixed-variant": "#005144",
                        "surface-container-lowest": "#ffffff",
                        "secondary-container": "#a1efdb",
                        "tertiary-fixed-dim": "#ffb597",
                        "primary-fixed-dim": "#adc6ff",
                        "background": "#f9f9ff",
                        "surface-bright": "#f9f9ff",
                        "error-container": "#ffdad6",
                        "tertiary-fixed": "#ffdbcd",
                        "tertiary-container": "#933702",
                        "surface-container-low": "#f3f3fb",
                        "secondary-fixed": "#a4f1de",
                        "on-primary-fixed-variant": "#004494",
                        "on-error-container": "#93000a",
                        "tertiary": "#6e2600",
                        "surface-container-high": "#e7e7f0",
                        "on-surface-variant": "#424752",
                        "surface": "#f9f9ff",
                        "primary": "#003b82",
                        "inverse-on-surface": "#f0f0f9",
                        "on-primary-container": "#b1c9ff",
                        "on-secondary": "#ffffff",
                        "on-tertiary-container": "#ffb99c",
                        "on-error": "#ffffff",
                        "inverse-surface": "#2e3037",
                        "on-tertiary-fixed": "#360f00",
                        "surface-container-highest": "#e1e2ea",
                        "secondary-fixed-dim": "#88d5c2",
                        "error": "#ba1a1a",
                        "surface-container": "#ededf6",
                        "primary-container": "#0051ae",
                        "surface-tint": "#1a5bb9",
                        "secondary": "#126a5b",
                        "outline-variant": "#c2c6d4",
                        "inverse-primary": "#adc6ff",
                        "surface-dim": "#d9d9e2",
                        "on-tertiary": "#ffffff",
                        "surface-variant": "#e1e2ea",
                        "on-primary": "#ffffff",
                        "primary-fixed": "#d8e2ff",
                        "on-background": "#191b21"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Manrope"],
                        "display": ["Manrope"],
                        "body": ["Public Sans"],
                        "label": ["Public Sans"]
                    }
                }
            }
        }
    </script>
<style>
        body { font-family: 'Public Sans', sans-serif; background-color: theme('colors.background'); color: theme('colors.on-surface'); }
        h1, h2, h3, h4, h5, h6, .font-headline { font-family: 'Manrope', sans-serif; }
        .glass-panel { background: rgba(249, 249, 255, 0.8); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.2); }
        .hero-gradient { background: linear-gradient(135deg, theme('colors.primary') 0%, theme('colors.primary-container') 100%); }
        .soft-pulse { transition: all 0.3s ease; }
        .soft-pulse:hover { background-color: theme('colors.surface-container-highest'); }

        /* Minimalist Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: theme('colors.surface-variant'); border-radius: theme('borderRadius.full'); }
        ::-webkit-scrollbar-thumb:hover { background: theme('colors.outline'); }
    </style>
</head>
<body class="flex flex-col md:flex-row min-h-screen antialiased selection:bg-primary selection:text-on-primary overflow-x-hidden">
<!-- Mobile Top App Bar (Hidden on md and up) -->
<header class="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl docked full-width top-0 sticky z-50 shadow-[0px_20px_40px_rgba(25,27,33,0.06)] flex justify-between items-center w-full px-6 h-16 bg-surface-container-low dark:bg-slate-800">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary text-2xl">local_hospital</span>
<span class="font-['Manrope'] tracking-tight font-bold text-xl font-black text-[#0051ae] dark:text-[#5c98ff] tracking-tight">Clinical Atelier HIS</span>
</div>
<div class="flex gap-4">
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">emergency</span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<img alt="Chief Medical Officer profile" class="w-8 h-8 rounded-full border-2 border-surface" data-alt="Close up professional headshot of a female doctor in a white coat smiling confidently" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADBLBDbS6jddT1Y_gtC9JV2Fj7mp99ZiyNVm2xZk4isCnazAWjUzgs2zL3H1Yw4386Pg_J1vn9U4VUOPW1r0PKSXsA90R93x3_5El2a50oU0Z8CQ78NGtslm42VcwF0hI6-W_gQVR0iGEGstTtaJpRx1oUdhwaMtjTa0_no4tp8bQ57dWzmqQhdx5NaepOXCbTngh7bLnfuQ5hpaiea6H-IiJx21NCg-XFkxTh8qM6v0ZSA_WJ9qr24tqMGCVri0oh4836DSx2-Jvo"/>
</div>
</header>
<!-- Desktop Side Navigation -->
<nav class="hidden md:flex bg-[#f3f3fb] dark:bg-slate-950 text-[#0051ae] dark:text-[#5c98ff] font-['Public_Sans'] text-sm font-medium h-screen w-64 fixed left-0 top-0 flex flex-col no-border tonal-shift-surface-container-low flat no shadows flex flex-col py-8 pr-4 gap-2 z-40">
<!-- Brand/Header -->
<div class="px-6 mb-8">
<div class="flex items-center gap-3 mb-2">
<div class="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">local_hospital</span>
</div>
<div>
<h2 class="font-['Manrope'] text-lg font-bold text-[#191b21] dark:text-white leading-tight">Triage Module</h2>
<span class="text-xs text-on-surface-variant">JCI Compliant Environment</span>
</div>
</div>
<button class="w-full mt-6 bg-error text-on-error py-3 px-4 rounded-md font-bold flex items-center justify-center gap-2 shadow-[0px_8px_16px_rgba(186,26,26,0.2)] hover:bg-error/90 transition-colors">
<span class="material-symbols-outlined">warning</span>
                Emergency Alert
            </button>
</div>
<!-- Navigation Links -->
<div class="flex-1 flex flex-col gap-1 pr-4">
<a class="flex items-center gap-4 px-6 py-3 bg-white dark:bg-slate-900 text-[#0051ae] dark:text-blue-400 font-bold shadow-sm rounded-r-full Soft Pulse on state change transition-all duration-300" href="#">
<span class="material-symbols-outlined">bolt</span>
<span>Rapid Intake</span>
</a>
<a class="flex items-center gap-4 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 Soft Pulse on state change transition-all duration-300 rounded-r-full" href="#">
<span class="material-symbols-outlined">fact_check</span>
<span>Detailed Assessment</span>
</a>
<a class="flex items-center gap-4 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 Soft Pulse on state change transition-all duration-300 rounded-r-full" href="#">
<span class="material-symbols-outlined">dashboard_customize</span>
<span>Monitor Command</span>
</a>
<a class="flex items-center gap-4 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 Soft Pulse on state change transition-all duration-300 rounded-r-full" href="#">
<span class="material-symbols-outlined">group</span>
<span>Patient Records</span>
</a>
<a class="flex items-center gap-4 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 Soft Pulse on state change transition-all duration-300 rounded-r-full" href="#">
<span class="material-symbols-outlined">settings</span>
<span>Settings</span>
</a>
</div>
<!-- Footer -->
<div class="mt-auto pr-4">
<a class="flex items-center gap-4 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 Soft Pulse on state change transition-all duration-300 rounded-r-full" href="#">
<span class="material-symbols-outlined">logout</span>
<span>Log Out</span>
</a>
</div>
</nav>
<!-- Main Content Canvas -->
<main class="flex-1 md:ml-64 w-full bg-surface relative min-h-screen flex flex-col">
<!-- Top Utility Bar (Desktop) -->
<div class="hidden md:flex bg-surface/90 backdrop-blur-md h-16 w-full sticky top-0 z-30 px-8 items-center justify-end gap-4">
<button class="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container">
<span class="material-symbols-outlined">notifications</span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container">
<span class="material-symbols-outlined">help_outline</span>
</button>
<img alt="Chief Medical Officer profile" class="w-9 h-9 rounded-full border-2 border-surface shadow-sm cursor-pointer" data-alt="Close up professional headshot of a female doctor in a white coat smiling confidently" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMn52koRNNFUI7n6c1oGA0mw06H7JYid5gnnCLyP6uKRrAaI6eKqLBm9WABMP5hOHlNCfJfWLKqzYMX8vs8Pyi50TJL-KUpgyh-87YVK4_7oEeYsVAtKS6mM7ReU1tt-JIlcJB814e1guGFa6neLUvLvPmdhecmx2VsIhuXRkcb7H5LStY2WdS-EYbk1iilEh1ZnlDArCFGyV8q0RwoZgDdpJk5924uJYGqMVKM3fPxRvAwxAL2--fAU51C6CWFP1Yh1x1TCveHD0o"/>
</div>
<div class="p-6 md:p-10 lg:px-16 lg:py-12 max-w-[1600px] mx-auto w-full flex-1 flex flex-col gap-8">
<!-- Context Header & Bypass -->
<div class="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-2">
<div class="max-w-2xl">
<div class="flex items-center gap-3 mb-3">
<span class="px-3 py-1 bg-surface-container-high text-on-surface-variant text-xs font-bold rounded-full tracking-wider uppercase font-body">Phase 0/1 Intake</span>
<div class="flex items-center gap-1 text-secondary text-sm font-semibold">
<span class="material-symbols-outlined text-[18px]">schedule</span>
<span>Target SLA: <span class="text-error">02:45</span></span>
</div>
</div>
<h1 class="text-4xl md:text-5xl font-headline font-extrabold text-on-surface tracking-tight mb-2">Rapid Patient Survey</h1>
<p class="text-on-surface-variant font-body text-lg">Primary assessment and vital acquisition.</p>
</div>
<button class="w-full lg:w-auto bg-error text-on-error px-8 py-5 rounded-md shadow-[0px_20px_40px_rgba(186,26,26,0.15)] flex flex-col items-center justify-center gap-1 hover:bg-error/90 transition-transform active:scale-95 group">
<span class="font-headline font-bold text-xl tracking-wide uppercase">Critical / Resus</span>
<span class="font-body text-xs text-on-error/80 uppercase tracking-widest group-hover:text-white transition-colors">Bypass Standard Intake</span>
</button>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
<!-- Left Column: Primary Survey (ABC) -->
<div class="lg:col-span-4 flex flex-col gap-6">
<div class="bg-surface-container-low rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
<!-- Decorative gradient corner -->
<div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
<h2 class="font-headline text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
<span class="material-symbols-outlined text-primary">pulmonology</span>
                            Primary Survey (ABC)
                        </h2>
<div class="flex flex-col gap-4 flex-1">
<!-- Airway -->
<div class="bg-surface rounded-lg p-4 Soft Pulse">
<label class="flex justify-between items-center cursor-pointer group">
<div>
<span class="font-bold text-on-surface block group-hover:text-primary transition-colors">A - Airway</span>
<span class="text-sm text-on-surface-variant">Patent and maintainable?</span>
</div>
<div class="flex items-center gap-3">
<div class="w-12 h-6 bg-surface-container-high rounded-full relative shadow-inner">
<div class="absolute left-1 top-1 w-4 h-4 bg-secondary rounded-full transform translate-x-6 transition-transform"></div>
</div>
</div>
</label>
</div>
<!-- Breathing -->
<div class="bg-surface rounded-lg p-4 Soft Pulse">
<label class="flex justify-between items-center cursor-pointer group">
<div>
<span class="font-bold text-on-surface block group-hover:text-primary transition-colors">B - Breathing</span>
<span class="text-sm text-on-surface-variant">Adequate effort?</span>
</div>
<div class="flex items-center gap-3">
<div class="w-12 h-6 bg-surface-container-high rounded-full relative shadow-inner">
<div class="absolute left-1 top-1 w-4 h-4 bg-outline-variant rounded-full transition-transform"></div>
</div>
</div>
</label>
</div>
<!-- Circulation -->
<div class="bg-surface rounded-lg p-4 Soft Pulse">
<label class="flex justify-between items-center cursor-pointer group">
<div>
<span class="font-bold text-on-surface block group-hover:text-primary transition-colors">C - Circulation</span>
<span class="text-sm text-on-surface-variant">Pulses present?</span>
</div>
<div class="flex items-center gap-3">
<div class="w-12 h-6 bg-surface-container-high rounded-full relative shadow-inner">
<div class="absolute left-1 top-1 w-4 h-4 bg-secondary rounded-full transform translate-x-6 transition-transform"></div>
</div>
</div>
</label>
</div>
</div>
</div>
</div>
<!-- Middle Column: Vitals -->
<div class="lg:col-span-8 flex flex-col gap-6">
<div class="bg-surface-container-low rounded-xl p-6">
<div class="flex justify-between items-center mb-6">
<h2 class="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
<span class="material-symbols-outlined text-primary">monitor_heart</span>
                                Rapid Vitals
                            </h2>
<span class="text-sm text-on-surface-variant font-body">Recorded: Just now</span>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<!-- HR -->
<div class="bg-surface rounded-lg p-4 flex flex-col items-center justify-center border-b-2 border-transparent hover:border-primary transition-all">
<span class="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Heart Rate</span>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none text-3xl font-headline font-bold text-on-surface w-16 text-center focus:ring-0 p-0" type="text" value="88"/>
<span class="text-sm text-on-surface-variant">bpm</span>
</div>
</div>
<!-- RR -->
<div class="bg-surface rounded-lg p-4 flex flex-col items-center justify-center border-b-2 border-transparent hover:border-primary transition-all">
<span class="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">Resp Rate</span>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none text-3xl font-headline font-bold text-on-surface w-16 text-center focus:ring-0 p-0" type="text" value="16"/>
<span class="text-sm text-on-surface-variant">rpm</span>
</div>
</div>
<!-- SpO2 -->
<div class="bg-surface rounded-lg p-4 flex flex-col items-center justify-center border-b-2 border-transparent hover:border-primary transition-all">
<span class="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">SpO2</span>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none text-3xl font-headline font-bold text-on-surface w-16 text-center focus:ring-0 p-0" type="text" value="98"/>
<span class="text-sm text-on-surface-variant">%</span>
</div>
</div>
<!-- GCS -->
<div class="bg-surface rounded-lg p-4 flex flex-col items-center justify-center border-b-2 border-transparent hover:border-primary transition-all">
<span class="text-sm text-on-surface-variant uppercase tracking-wider font-semibold mb-1">GCS</span>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none text-3xl font-headline font-bold text-on-surface w-16 text-center focus:ring-0 p-0" type="text" value="15"/>
<span class="text-sm text-on-surface-variant">/15</span>
</div>
</div>
</div>
</div>
<!-- ESI Selection -->
<div class="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_20px_40px_rgba(25,27,33,0.06)] relative overflow-hidden">
<div class="absolute inset-0 opacity-5" style="background-image: radial-gradient(circle at 100% 0%, theme('colors.primary') 0%, transparent 50%);"></div>
<h2 class="font-headline text-xl font-bold text-on-surface mb-6 relative z-10">Emergency Severity Index (ESI)</h2>
<div class="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
<!-- Level 1 -->
<button class="bg-error-container text-on-error-container p-4 rounded-md flex flex-col items-center justify-center border border-transparent hover:border-error transition-all opacity-50 hover:opacity-100">
<span class="font-headline font-extrabold text-2xl mb-1">1</span>
<span class="text-xs font-bold uppercase tracking-wider">Resuscitation</span>
</button>
<!-- Level 2 -->
<button class="bg-tertiary-container text-on-tertiary-container p-4 rounded-md flex flex-col items-center justify-center border border-transparent hover:border-tertiary transition-all opacity-50 hover:opacity-100">
<span class="font-headline font-extrabold text-2xl mb-1">2</span>
<span class="text-xs font-bold uppercase tracking-wider">Emergent</span>
</button>
<!-- Level 3 -->
<button class="bg-primary-container text-on-primary-container p-4 rounded-md flex flex-col items-center justify-center shadow-md scale-105 border-2 border-primary-fixed">
<span class="font-headline font-extrabold text-2xl mb-1">3</span>
<span class="text-xs font-bold uppercase tracking-wider">Urgent</span>
</button>
<!-- Level 4 -->
<button class="bg-surface-container text-on-surface p-4 rounded-md flex flex-col items-center justify-center border border-transparent hover:border-outline transition-all opacity-50 hover:opacity-100">
<span class="font-headline font-extrabold text-2xl mb-1">4</span>
<span class="text-xs font-bold uppercase tracking-wider">Less Urgent</span>
</button>
<!-- Level 5 -->
<button class="bg-surface-container text-on-surface p-4 rounded-md flex flex-col items-center justify-center border border-transparent hover:border-outline transition-all opacity-50 hover:opacity-100">
<span class="font-headline font-extrabold text-2xl mb-1">5</span>
<span class="text-xs font-bold uppercase tracking-wider">Non-Urgent</span>
</button>
</div>
</div>
</div>
</div>
<!-- Bottom Actions -->
<div class="flex justify-end gap-4 mt-4 pt-6 border-t-0 bg-surface-container-low p-4 rounded-xl">
<button class="px-6 py-3 bg-surface-container-high text-primary font-bold rounded-md hover:bg-surface-container transition-colors">
                    Clear Form
                </button>
<button class="px-8 py-3 hero-gradient text-on-primary font-bold rounded-md shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
<span class="material-symbols-outlined">send</span>
                    Submit Intake
                </button>
</div>
</div>
</main>
</body></html>

<!-- Detailed Assessment Mode (Phase 3/4) -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Secondary Assessment - Clinical Atelier HIS</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&amp;family=Public+Sans:wght@400;500;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "outline": "#737784",
                      "on-secondary-fixed": "#00201a",
                      "on-secondary-container": "#1a6f5f",
                      "on-primary-fixed": "#001a41",
                      "on-tertiary-fixed-variant": "#7d2d00",
                      "on-surface": "#191b21",
                      "on-secondary-fixed-variant": "#005144",
                      "surface-container-lowest": "#ffffff",
                      "secondary-container": "#a1efdb",
                      "tertiary-fixed-dim": "#ffb597",
                      "primary-fixed-dim": "#adc6ff",
                      "background": "#f9f9ff",
                      "surface-bright": "#f9f9ff",
                      "error-container": "#ffdad6",
                      "tertiary-fixed": "#ffdbcd",
                      "tertiary-container": "#933702",
                      "surface-container-low": "#f3f3fb",
                      "secondary-fixed": "#a4f1de",
                      "on-primary-fixed-variant": "#004494",
                      "on-error-container": "#93000a",
                      "tertiary": "#6e2600",
                      "surface-container-high": "#e7e7f0",
                      "on-surface-variant": "#424752",
                      "surface": "#f9f9ff",
                      "primary": "#003b82",
                      "inverse-on-surface": "#f0f0f9",
                      "on-primary-container": "#b1c9ff",
                      "on-secondary": "#ffffff",
                      "on-tertiary-container": "#ffb99c",
                      "on-error": "#ffffff",
                      "inverse-surface": "#2e3037",
                      "on-tertiary-fixed": "#360f00",
                      "surface-container-highest": "#e1e2ea",
                      "secondary-fixed-dim": "#88d5c2",
                      "error": "#ba1a1a",
                      "surface-container": "#ededf6",
                      "primary-container": "#0051ae",
                      "surface-tint": "#1a5bb9",
                      "secondary": "#126a5b",
                      "outline-variant": "#c2c6d4",
                      "inverse-primary": "#adc6ff",
                      "surface-dim": "#d9d9e2",
                      "on-tertiary": "#ffffff",
                      "surface-variant": "#e1e2ea",
                      "on-primary": "#ffffff",
                      "primary-fixed": "#d8e2ff",
                      "on-background": "#191b21"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {},
              "fontFamily": {
                      "headline": [
                              "Manrope"
                      ],
                      "display": [
                              "Manrope"
                      ],
                      "body": [
                              "Public Sans"
                      ],
                      "label": [
                              "Public Sans"
                      ]
              },
              "fontSize": {}
      },
          },
        }
      </script>
</head>
<body class="bg-background text-on-surface font-body antialiased min-h-screen flex flex-col md:flex-row">
<!-- SideNavBar (Web Only) -->
<nav class="hidden md:flex h-screen w-64 fixed left-0 top-0 flex-col py-8 pr-4 gap-2 bg-[#f3f3fb] dark:bg-slate-950 font-['Public_Sans'] text-sm font-medium z-40 transition-all duration-300">
<div class="px-6 mb-8 flex flex-col gap-1">
<span class="font-['Manrope'] text-lg font-bold text-[#191b21] dark:text-white tracking-tight">Triage Module</span>
<span class="text-xs text-on-surface-variant">JCI Compliant Environment</span>
</div>
<div class="flex-1 flex flex-col gap-1">
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="bolt">bolt</span>
<span>Rapid Intake</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 text-[#0051ae] dark:text-blue-400 font-bold shadow-sm rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="fact_check" data-weight="fill" style="font-variation-settings: 'FILL' 1;">fact_check</span>
<span>Detailed Assessment</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="dashboard_customize">dashboard_customize</span>
<span>Monitor Command</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="group">group</span>
<span>Patient Records</span>
</a>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</div>
<div class="px-4 mt-auto mb-4">
<button class="w-full py-2.5 px-4 bg-gradient-to-br from-error to-error-container text-on-error rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-[18px]">emergency</span>
                Emergency Alert
            </button>
</div>
<div class="flex flex-col gap-1 mt-auto">
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full transition-colors group" href="#">
<span class="material-symbols-outlined" data-icon="logout">logout</span>
<span>Log Out</span>
</a>
</div>
</nav>
<!-- Main Content Area -->
<main class="flex-1 md:ml-64 flex flex-col min-h-screen relative w-full">
<!-- TopNavBar -->
<header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl docked full-width top-0 sticky z-50 bg-surface-container-low dark:bg-slate-800 shadow-[0px_20px_40px_rgba(25,27,33,0.06)] flex justify-between items-center w-full px-6 h-16 transition-all duration-200">
<div class="flex items-center gap-4">
<span class="text-xl font-black text-[#0051ae] dark:text-[#5c98ff] tracking-tight font-['Manrope']">Clinical Atelier HIS</span>
</div>
<div class="flex items-center gap-4">
<button class="p-2 text-[#424752] dark:text-slate-400 hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="p-2 text-[#424752] dark:text-slate-400 hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="emergency">emergency</span>
</button>
<button class="p-2 text-[#424752] dark:text-slate-400 hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center">
<span class="material-symbols-outlined" data-icon="help_outline">help_outline</span>
</button>
<div class="h-8 w-8 rounded-full bg-surface-variant overflow-hidden ml-2 ring-2 ring-surface-container-highest">
<img alt="Chief Medical Officer profile" class="w-full h-full object-cover" data-alt="Professional headshot of a middle-aged female medical chief officer in a white coat, well-lit, soft clinical background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuACKnmdDF5hAQ-4GARYvRCeNoKYJ_lC4aBXhNC3MCUw8wPl5QERFQj9ERBupfXsNcLyFDpQdvfXsWtmi6QwoC9f_Vt4tki_qhgKJBhsxkblcBCZsFZ3vEZU9Y7xV3z6a8Qr1odNN9jvbzEL--xL5atzwm0Nram0Qecp86kY1SyJbp9g9zcVpIOAeWoykMMahczCAz2Le6FqiVidSKG6KyCt6t82IvSVRf6TqsjF9tPuh7WmEXhVSD34rQvflOCZ2MmquPT7-3v5isRZ"/>
</div>
</div>
</header>
<div class="p-6 md:p-8 lg:p-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
<!-- Left Canvas (Main Assessment Area) -->
<div class="lg:col-span-8 flex flex-col gap-8">
<!-- Patient Context Header -->
<section class="flex flex-col gap-4">
<div class="flex items-center gap-3">
<span class="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
<span class="material-symbols-outlined text-[14px]">sync_saved_locally</span>
                            SATUSEHAT Synced
                        </span>
<span class="text-sm text-on-surface-variant font-medium">Phase 3/4 Assessment</span>
</div>
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 class="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">Secondary Assessment</h1>
<p class="text-lg text-on-surface-variant mt-1">Doe, Jonathan A. (MRN: 8823-11)</p>
</div>
<div class="flex items-center gap-3">
<button class="px-5 py-2.5 bg-surface-container-high text-primary rounded-md font-bold text-sm hover:bg-surface-container-highest transition-colors">
                                Save Draft
                            </button>
<button class="px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-md font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                                Complete Phase
                                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
</button>
</div>
</div>
</section>
<!-- Medical History & Flags Bento -->
<section class="grid grid-cols-1 md:grid-cols-2 gap-4">
<!-- Alerts / Infection Control -->
<div class="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden flex flex-col gap-4">
<!-- Red subtle accent for alerts -->
<div class="absolute top-0 left-0 w-1 h-full bg-error"></div>
<div class="flex items-center justify-between">
<h2 class="font-headline text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
<span class="material-symbols-outlined text-error">warning</span>
                                Critical Flags
                            </h2>
</div>
<div class="flex flex-col gap-3 mt-2">
<div class="bg-error-container/30 px-4 py-3 rounded-lg flex items-start gap-3">
<span class="material-symbols-outlined text-error mt-0.5">vaccines</span>
<div>
<p class="text-sm font-bold text-on-error-container uppercase tracking-wide">Allergy: Penicillin</p>
<p class="text-xs text-on-surface-variant mt-0.5">Anaphylactic reaction documented (2019)</p>
</div>
</div>
<div class="bg-surface-container-low px-4 py-3 rounded-lg border border-outline-variant/15 flex items-start gap-3">
<span class="material-symbols-outlined text-tertiary mt-0.5">coronavirus</span>
<div>
<p class="text-sm font-bold text-on-surface uppercase tracking-wide">Infection Control: Droplet</p>
<p class="text-xs text-on-surface-variant mt-0.5">Isolation protocols required until further notice.</p>
</div>
</div>
</div>
</div>
<!-- Meds List -->
<div class="bg-surface-container-lowest rounded-xl p-6 flex flex-col gap-4">
<div class="flex items-center justify-between">
<h2 class="font-headline text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
<span class="material-symbols-outlined text-primary">prescriptions</span>
                               Current Medications
                           </h2>
<button class="text-primary hover:bg-surface-container-low p-1.5 rounded-md transition-colors">
<span class="material-symbols-outlined text-[20px]">add</span>
</button>
</div>
<div class="flex flex-col gap-2 mt-2">
<div class="flex items-center justify-between py-2 border-b border-outline-variant/15 last:border-0">
<div>
<p class="text-sm font-bold text-on-surface">Lisinopril</p>
<p class="text-xs text-on-surface-variant">10mg Oral, Daily</p>
</div>
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold uppercase">Verified</span>
</div>
<div class="flex items-center justify-between py-2 border-b border-outline-variant/15 last:border-0">
<div>
<p class="text-sm font-bold text-on-surface">Metformin</p>
<p class="text-xs text-on-surface-variant">500mg Oral, BID</p>
</div>
<span class="bg-surface-container-high text-on-surface-variant px-2 py-1 rounded text-[10px] font-bold uppercase">Verified</span>
</div>
</div>
</div>
</section>
<!-- Detailed Assessment Form (Soft Wells) -->
<section class="bg-surface-container-lowest rounded-xl p-6 md:p-8 flex flex-col gap-8">
<h2 class="font-headline text-2xl font-bold tracking-tight text-on-surface mb-2">Systems Review</h2>
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<!-- Input Group 1 -->
<div class="flex flex-col gap-2">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Neurological Status</label>
<div class="relative">
<select class="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg py-3 px-4 text-sm text-on-surface appearance-none transition-colors">
<option>Alert &amp; Oriented x3</option>
<option>Confused</option>
<option>Lethargic</option>
<option>Unresponsive</option>
</select>
<span class="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
</div>
</div>
<!-- Input Group 2 -->
<div class="flex flex-col gap-2">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Respiratory Effort</label>
<div class="relative">
<select class="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg py-3 px-4 text-sm text-on-surface appearance-none transition-colors">
<option>Unlabored</option>
<option>Shallow</option>
<option>Labored / Retractions</option>
</select>
<span class="material-symbols-outlined absolute right-3 top-3 text-on-surface-variant pointer-events-none">expand_more</span>
</div>
</div>
<!-- Full width text area -->
<div class="flex flex-col gap-2 md:col-span-2">
<label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Clinical Narrative / Chief Complaint details</label>
<textarea class="w-full bg-surface-container-low border-none focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest rounded-lg py-3 px-4 text-sm text-on-surface resize-none transition-colors" placeholder="Enter detailed narrative observations here..." rows="4"></textarea>
</div>
</div>
</section>
<!-- NEWS2 Score Panel -->
<section class="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/15 flex flex-col gap-6">
<div class="flex items-center justify-between">
<div>
<h2 class="font-headline text-xl font-bold tracking-tight text-on-surface">NEWS2 Calculation</h2>
<p class="text-xs text-on-surface-variant mt-1">National Early Warning Score</p>
</div>
<div class="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-headline text-xl font-black shadow-inner">
                            4
                        </div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div class="flex flex-col">
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Resp Rate</span>
<span class="font-headline text-lg font-bold text-on-surface">22 <span class="text-xs font-normal text-on-surface-variant">bpm</span></span>
<span class="text-[10px] text-tertiary font-bold">+1</span>
</div>
<div class="flex flex-col">
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">SpO2 Scale 1</span>
<span class="font-headline text-lg font-bold text-on-surface">94 <span class="text-xs font-normal text-on-surface-variant">%</span></span>
<span class="text-[10px] text-tertiary font-bold">+1</span>
</div>
<div class="flex flex-col">
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Systolic BP</span>
<span class="font-headline text-lg font-bold text-on-surface">110 <span class="text-xs font-normal text-on-surface-variant">mmHg</span></span>
<span class="text-[10px] text-on-surface-variant font-bold">0</span>
</div>
<div class="flex flex-col">
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pulse</span>
<span class="font-headline text-lg font-bold text-on-surface">105 <span class="text-xs font-normal text-on-surface-variant">bpm</span></span>
<span class="text-[10px] text-tertiary font-bold">+1</span>
</div>
</div>
</section>
</div>
<!-- Right Utility Panel (Audit Trail) -->
<aside class="lg:col-span-4 flex flex-col gap-6">
<div class="bg-surface-container-low rounded-xl p-6 flex flex-col h-[calc(100vh-10rem)] sticky top-24">
<h3 class="font-headline text-lg font-bold tracking-tight text-on-surface flex items-center gap-2 mb-6">
<span class="material-symbols-outlined text-[20px] text-primary">history</span>
                        Audit Trail
                    </h3>
<div class="flex-1 overflow-y-auto pr-2 flex flex-col gap-5 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-outline-variant/30">
<!-- Timeline Item 1 -->
<div class="relative pl-8">
<div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-secondary-container text-secondary flex items-center justify-center ring-4 ring-surface-container-low z-10">
<span class="material-symbols-outlined text-[14px]">check</span>
</div>
<p class="text-xs font-bold text-on-surface">SATUSEHAT Sync Complete</p>
<p class="text-[11px] text-on-surface-variant mt-0.5">System • 10:42 AM</p>
</div>
<!-- Timeline Item 2 -->
<div class="relative pl-8">
<div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-4 ring-surface-container-low z-10">
<span class="material-symbols-outlined text-[14px]">edit_document</span>
</div>
<p class="text-xs font-bold text-on-surface">Vitals Input Updated</p>
<p class="text-[11px] text-on-surface-variant mt-0.5">Nurse Sarah J. • 10:38 AM</p>
</div>
<!-- Timeline Item 3 -->
<div class="relative pl-8">
<div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-error-container text-on-error-container flex items-center justify-center ring-4 ring-surface-container-low z-10">
<span class="material-symbols-outlined text-[14px]">warning</span>
</div>
<p class="text-xs font-bold text-on-surface">Allergy Flag Acknowledged</p>
<p class="text-[11px] text-on-surface-variant mt-0.5">Dr. Alan M. • 10:35 AM</p>
</div>
<!-- Timeline Item 4 -->
<div class="relative pl-8 opacity-60">
<div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center ring-4 ring-surface-container-low z-10">
<span class="material-symbols-outlined text-[14px]">login</span>
</div>
<p class="text-xs font-bold text-on-surface">Session Initiated</p>
<p class="text-[11px] text-on-surface-variant mt-0.5">Dr. Alan M. • 10:30 AM</p>
</div>
</div>
</div>
</aside>
</div>
</main>
</body></html>

<!-- Monitor Mode (Command Board) -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Emergency Command Board</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&amp;family=Public+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "outline": "#737784",
                        "on-secondary-fixed": "#00201a",
                        "on-secondary-container": "#1a6f5f",
                        "on-primary-fixed": "#001a41",
                        "on-tertiary-fixed-variant": "#7d2d00",
                        "on-surface": "#191b21",
                        "on-secondary-fixed-variant": "#005144",
                        "surface-container-lowest": "#ffffff",
                        "secondary-container": "#a1efdb",
                        "tertiary-fixed-dim": "#ffb597",
                        "primary-fixed-dim": "#adc6ff",
                        "background": "#f9f9ff",
                        "surface-bright": "#f9f9ff",
                        "error-container": "#ffdad6",
                        "tertiary-fixed": "#ffdbcd",
                        "tertiary-container": "#933702",
                        "surface-container-low": "#f3f3fb",
                        "secondary-fixed": "#a4f1de",
                        "on-primary-fixed-variant": "#004494",
                        "on-error-container": "#93000a",
                        "tertiary": "#6e2600",
                        "surface-container-high": "#e7e7f0",
                        "on-surface-variant": "#424752",
                        "surface": "#f9f9ff",
                        "primary": "#003b82",
                        "inverse-on-surface": "#f0f0f9",
                        "on-primary-container": "#b1c9ff",
                        "on-secondary": "#ffffff",
                        "on-tertiary-container": "#ffb99c",
                        "on-error": "#ffffff",
                        "inverse-surface": "#2e3037",
                        "on-tertiary-fixed": "#360f00",
                        "surface-container-highest": "#e1e2ea",
                        "secondary-fixed-dim": "#88d5c2",
                        "error": "#ba1a1a",
                        "surface-container": "#ededf6",
                        "primary-container": "#0051ae",
                        "surface-tint": "#1a5bb9",
                        "secondary": "#126a5b",
                        "outline-variant": "#c2c6d4",
                        "inverse-primary": "#adc6ff",
                        "surface-dim": "#d9d9e2",
                        "on-tertiary": "#ffffff",
                        "surface-variant": "#e1e2ea",
                        "on-primary": "#ffffff",
                        "primary-fixed": "#d8e2ff",
                        "on-background": "#191b21"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Manrope", "sans-serif"],
                        "display": ["Manrope", "sans-serif"],
                        "body": ["Public Sans", "sans-serif"],
                        "label": ["Public Sans", "sans-serif"]
                    }
                }
            }
        }
    </script>
<style>
        body { font-family: 'Public Sans', sans-serif; background-color: theme('colors.background'); color: theme('colors.on-surface'); }
        h1, h2, h3, h4, h5, h6, .font-headline, .font-display { font-family: 'Manrope', sans-serif; }
        .glass-panel { background: rgba(249, 249, 255, 0.8); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); }
        .gradient-text { background: linear-gradient(135deg, theme('colors.primary'), theme('colors.primary-container')); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ambient-shadow { box-shadow: 0px 20px 40px rgba(25, 27, 33, 0.06); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .soft-pulse:active { animation: softPulse 0.6s ease-out; }
        @keyframes softPulse {
            0% { background-color: theme('colors.primary-fixed'); }
            100% { background-color: inherit; }
        }
    </style>
</head>
<body class="flex h-screen overflow-hidden bg-background">
<!-- SideNavBar -->
<nav aria-label="Main Navigation" class="h-screen w-64 fixed left-0 top-0 flex flex-col bg-[#f3f3fb] text-[#0051ae] font-['Public_Sans'] text-sm font-medium z-40 hidden md:flex pb-8">
<div class="py-8 px-6 mb-4">
<div class="flex items-center gap-3">
<img alt="Medical Facility Logo" class="w-10 h-10 rounded-full object-cover shadow-sm data-alt='Clean minimal medical cross logo in blue on white background'" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAmZjl4bfeZG3IUWpjvxTiGXvR36IOMpCYtMKtM4H1k5EMTSZFlCn7ezBCxSrXX6s3uROkIb9QD5U4pHwCtztwZRv8uOICk-emlQY1hpip5oAMT3jfebMM89CFDliAFUELbpCaxL5652V86nNi6ClcuLv-fh4DpSgarnrnE3WApqTNJExmPgzeiSmRWbqNabyPZ_Z_Q269N7XppO61_Rv-ZMvh5mpkN2BkC5lLM0IVuSeicCGKr4JL8MAiOB_TeeSJHxq7zCOA3aCsj"/>
<div>
<h1 class="font-['Manrope'] text-lg font-bold text-[#191b21] tracking-tight">Triage Module</h1>
<p class="text-xs text-on-surface-variant">JCI Compliant Environment</p>
</div>
</div>
<button class="mt-6 w-full bg-error-container text-on-error-container font-bold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-error/20 transition-colors">
<span class="material-symbols-outlined text-[18px]" style="font-variation-settings: 'FILL' 1;">emergency</span>
                Emergency Alert
            </button>
</div>
<ul class="flex flex-col pr-4 gap-2 flex-grow overflow-y-auto no-scrollbar">
<li>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] hover:bg-white/50 transition-colors rounded-r-full group" href="#">
<span class="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">bolt</span>
                    Rapid Intake
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] hover:bg-white/50 transition-colors rounded-r-full group" href="#">
<span class="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">fact_check</span>
                    Detailed Assessment
                </a>
</li>
<li>
<a aria-current="page" class="flex items-center gap-3 px-6 py-3 bg-white text-[#0051ae] font-bold shadow-sm rounded-r-full pointer-events-none" href="#">
<span class="material-symbols-outlined text-[20px]" style="font-variation-settings: 'FILL' 1;">dashboard_customize</span>
                    Monitor Command
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] hover:bg-white/50 transition-colors rounded-r-full group" href="#">
<span class="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">group</span>
                    Patient Records
                </a>
</li>
<li>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] hover:bg-white/50 transition-colors rounded-r-full group" href="#">
<span class="material-symbols-outlined text-[20px] text-outline group-hover:text-primary transition-colors">settings</span>
                    Settings
                </a>
</li>
</ul>
<ul class="flex flex-col pr-4 gap-2 mt-auto">
<li>
<a class="flex items-center gap-3 px-6 py-3 text-[#424752] hover:bg-white/50 transition-colors rounded-r-full group" href="#">
<span class="material-symbols-outlined text-[20px] text-outline group-hover:text-error transition-colors">logout</span>
                    Log Out
                </a>
</li>
</ul>
</nav>
<!-- Main Content Canvas -->
<main class="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden bg-surface relative">
<!-- TopNavBar -->
<header class="bg-white/80 backdrop-blur-xl font-['Manrope'] tracking-tight font-bold docked full-width top-0 sticky z-50 shadow-[0px_20px_40px_rgba(25,27,33,0.06)] flex justify-between items-center w-full px-6 h-16">
<div class="flex items-center gap-4">
<div class="md:hidden flex items-center">
<button class="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
<div class="text-xl font-black text-[#0051ae] tracking-tight">Clinical Atelier HIS</div>
</div>
<div class="flex-1 max-w-md mx-8 hidden lg:block">
<div class="relative flex items-center w-full bg-surface-container-low rounded-full px-4 py-2 hover:bg-surface-container transition-colors focus-within:bg-surface-container-lowest focus-within:ring-1 focus-within:ring-primary">
<span class="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
<input class="bg-transparent border-none outline-none text-sm font-body text-on-surface w-full placeholder:text-outline p-0 focus:ring-0" placeholder="Search patients, conditions, IDs..." type="text"/>
</div>
</div>
<div class="flex items-center gap-2">
<button class="p-2 text-on-surface-variant hover:bg-[#f3f3fb] transition-colors rounded-full relative">
<span class="material-symbols-outlined text-[22px]">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="p-2 text-on-surface-variant hover:bg-[#f3f3fb] transition-colors rounded-full">
<span class="material-symbols-outlined text-[22px]">emergency</span>
</button>
<button class="p-2 text-on-surface-variant hover:bg-[#f3f3fb] transition-colors rounded-full mr-2 hidden sm:block">
<span class="material-symbols-outlined text-[22px]">help_outline</span>
</button>
<div class="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30">
<img alt="Chief Medical Officer profile" class="w-full h-full object-cover data-alt='Professional headshot of a female doctor in a white coat against a light grey background'" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmUnHEaLdr_WylwcisU7ZUUJ-Z5TG5hXsZ4WW9Omc7AX-7TrH_CvrKiXRYVbuG1OC0rgI9EysUcfJ_cb8mb1xE8WKCDosySHJJJW6sZkWjB86vFWhOUp3M8wpdVMUEFjQkKYifyd8EI9f5IPSZTlmHFJku4A9jHUJO4eC5_Eeh2w-koqU1uZ-JbgiWzyKzIfqgke-Fetlp6wYxIE4TVoieQqvUY2ayEoWsfGjkWBc0T_SOZ311rrCJAaQmTQ5kM11E3CyCi-4ftqcy"/>
</div>
</div>
</header>
<!-- Command Board Content -->
<div class="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-6">
<!-- Dashboard Header -->
<div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
<div>
<h2 class="font-headline text-3xl font-extrabold text-on-surface tracking-tight">Emergency Command Board</h2>
<p class="font-body text-on-surface-variant text-sm mt-1">Real-time facility status and patient prioritization.</p>
</div>
<div class="flex gap-3">
<div class="bg-surface-container-low px-4 py-2 rounded-lg flex flex-col items-end">
<span class="font-label text-xs text-on-surface-variant uppercase tracking-widest">System Time</span>
<span class="font-headline font-bold text-primary">14:32:05</span>
</div>
</div>
</div>
<!-- Bento Grid: Top Metrics -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Metric 1: Total Waiting -->
<div class="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden group">
<div class="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
<div class="flex justify-between items-start mb-4">
<span class="font-label text-sm uppercase tracking-wider text-on-surface-variant font-semibold">Total Waiting</span>
<span class="material-symbols-outlined text-outline" style="font-variation-settings: 'FILL' 1;">groups</span>
</div>
<div class="flex items-baseline gap-2">
<span class="font-display text-5xl font-black text-on-surface">42</span>
<span class="font-body text-sm text-on-surface-variant">+5 from last hour</span>
</div>
</div>
<!-- Metric 2: High Urgency -->
<div class="bg-surface-container-lowest rounded-xl p-6 ambient-shadow relative overflow-hidden">
<div class="absolute left-0 top-0 w-1 h-full bg-error"></div>
<div class="flex justify-between items-start mb-4">
<span class="font-label text-sm uppercase tracking-wider text-on-surface-variant font-semibold">High Urgency (ESI 1-2)</span>
<span class="material-symbols-outlined text-error" style="font-variation-settings: 'FILL' 1;">warning</span>
</div>
<div class="flex items-baseline gap-2">
<span class="font-display text-5xl font-black text-error">7</span>
<span class="font-body text-sm text-on-surface-variant">Patients critical</span>
</div>
</div>
<!-- Metric 3: Bed Capacity -->
<div class="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
<div class="flex justify-between items-start mb-4">
<span class="font-label text-sm uppercase tracking-wider text-on-surface-variant font-semibold">Bed Capacity</span>
<span class="material-symbols-outlined text-secondary" style="font-variation-settings: 'FILL' 1;">bed</span>
</div>
<div class="flex items-baseline gap-2 mb-3">
<span class="font-display text-5xl font-black text-on-surface">88<span class="text-2xl text-on-surface-variant">%</span></span>
</div>
<div class="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
<div class="bg-secondary h-full rounded-full" style="width: 88%"></div>
</div>
</div>
</div>
<!-- Main Content Area: Queue & Map -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
<!-- Left/Center: Active Queue (Takes up 2 columns on lg) -->
<div class="lg:col-span-2 bg-surface-container-lowest rounded-xl flex flex-col ambient-shadow overflow-hidden">
<div class="p-6 border-b border-surface-container-high bg-surface-container-lowest sticky top-0 z-10 flex justify-between items-center">
<h3 class="font-headline text-lg font-bold text-on-surface">Active Patient Queue</h3>
<div class="flex gap-2">
<button class="px-3 py-1.5 bg-surface-container-low text-primary text-sm font-medium rounded-md hover:bg-surface-container transition-colors">Filter ESI</button>
<button class="px-3 py-1.5 bg-surface-container-low text-primary text-sm font-medium rounded-md hover:bg-surface-container transition-colors">Sort: Urgency</button>
</div>
</div>
<div class="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-low">
<!-- ESI 1 Patient -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
<div class="absolute left-0 top-0 w-1.5 h-full bg-[#ba1a1a]"></div> <!-- Red for ESI 1 -->
<div class="flex-shrink-0 w-12 h-12 bg-error-container text-on-error-container rounded-full flex items-center justify-center font-bold font-headline text-lg">
                                1
                            </div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h4 class="font-headline font-bold text-on-surface text-lg">Doe, John (Trauma)</h4>
<span class="font-label text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] px-2 py-0.5 rounded-full">SLA: -4m BREACH</span>
</div>
<div class="flex gap-4 text-sm font-body text-on-surface-variant">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span> Waiting: 14m</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> Resus Bay 2</span>
</div>
</div>
<div class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
<button class="p-2 bg-surface-container text-primary rounded-md hover:bg-surface-dim">
<span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</div>
<!-- ESI 2 Patient -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
<div class="absolute left-0 top-0 w-1.5 h-full bg-[#933702]"></div> <!-- Orange for ESI 2 -->
<div class="flex-shrink-0 w-12 h-12 bg-tertiary-container text-on-tertiary-container rounded-full flex items-center justify-center font-bold font-headline text-lg">
                                2
                            </div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h4 class="font-headline font-bold text-on-surface text-lg">Smith, Sarah (Chest Pain)</h4>
<span class="font-label text-xs font-bold text-[#933702] bg-[#ffdbcd] px-2 py-0.5 rounded-full">SLA: 2m left</span>
</div>
<div class="flex gap-4 text-sm font-body text-on-surface-variant">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span> Waiting: 8m</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> Acute Bed 4</span>
</div>
</div>
</div>
<!-- ESI 3 Patient -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
<div class="absolute left-0 top-0 w-1.5 h-full bg-primary-container"></div> <!-- Blue for ESI 3 -->
<div class="flex-shrink-0 w-12 h-12 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold font-headline text-lg">
                                3
                            </div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h4 class="font-headline font-bold text-on-surface text-lg">Johnson, M. (Abd Pain)</h4>
<span class="font-label text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full">SLA: 45m left</span>
</div>
<div class="flex gap-4 text-sm font-body text-on-surface-variant">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span> Waiting: 15m</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> Triage Area</span>
</div>
</div>
</div>
<!-- ESI 4 Patient -->
<div class="bg-surface-container-lowest p-4 rounded-xl flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group opacity-80">
<div class="absolute left-0 top-0 w-1.5 h-full bg-secondary"></div> <!-- Green for ESI 4 -->
<div class="flex-shrink-0 w-12 h-12 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center font-bold font-headline text-lg">
                                4
                            </div>
<div class="flex-1">
<div class="flex justify-between items-baseline mb-1">
<h4 class="font-headline font-bold text-on-surface text-lg">Williams, K. (Laceration)</h4>
<span class="font-label text-xs font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded-full">SLA: 1h 20m left</span>
</div>
<div class="flex gap-4 text-sm font-body text-on-surface-variant">
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">schedule</span> Waiting: 40m</span>
<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">location_on</span> Fast Track 1</span>
</div>
</div>
</div>
</div>
</div>
<!-- Right Column: Zone Load Map -->
<div class="bg-surface-container-lowest rounded-xl flex flex-col ambient-shadow overflow-hidden">
<div class="p-6 pb-2">
<h3 class="font-headline text-lg font-bold text-on-surface mb-4">Zone Load</h3>
</div>
<div class="p-4 flex-1 flex flex-col gap-4">
<!-- Zone: Resus -->
<div class="bg-surface-container-low rounded-lg p-4 relative">
<div class="flex justify-between items-center mb-2">
<h4 class="font-headline font-bold text-on-surface text-sm">Resuscitation</h4>
<span class="text-xs font-bold bg-error-container text-on-error-container px-2 py-1 rounded-md">90% Full</span>
</div>
<div class="flex gap-2">
<div class="h-8 flex-1 bg-error rounded-sm"></div>
<div class="h-8 flex-1 bg-error rounded-sm"></div>
<div class="h-8 flex-1 bg-error rounded-sm"></div>
<div class="h-8 flex-1 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
</div>
</div>
<!-- Zone: Acute -->
<div class="bg-surface-container-low rounded-lg p-4 relative">
<div class="flex justify-between items-center mb-2">
<h4 class="font-headline font-bold text-on-surface text-sm">Acute Care</h4>
<span class="text-xs font-bold bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded-md">75% Full</span>
</div>
<div class="grid grid-cols-4 gap-2">
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-tertiary rounded-sm"></div>
<div class="h-6 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-6 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
</div>
</div>
<!-- Zone: Fast Track -->
<div class="bg-surface-container-low rounded-lg p-4 relative">
<div class="flex justify-between items-center mb-2">
<h4 class="font-headline font-bold text-on-surface text-sm">Fast Track</h4>
<span class="text-xs font-bold bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md">30% Full</span>
</div>
<div class="grid grid-cols-5 gap-2">
<div class="h-4 bg-secondary rounded-sm"></div>
<div class="h-4 bg-secondary rounded-sm"></div>
<div class="h-4 bg-secondary rounded-sm"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
<div class="h-4 bg-surface-container-highest rounded-sm border border-outline-variant/30"></div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
</body></html>

<!-- Outpatient (Poli) Triage Module -->
<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>POLI Triage - Clinical Atelier HIS</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&amp;family=Public+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "outline": "#737784",
                      "on-secondary-fixed": "#00201a",
                      "on-secondary-container": "#1a6f5f",
                      "on-primary-fixed": "#001a41",
                      "on-tertiary-fixed-variant": "#7d2d00",
                      "on-surface": "#191b21",
                      "on-secondary-fixed-variant": "#005144",
                      "surface-container-lowest": "#ffffff",
                      "secondary-container": "#a1efdb",
                      "tertiary-fixed-dim": "#ffb597",
                      "primary-fixed-dim": "#adc6ff",
                      "background": "#f9f9ff",
                      "surface-bright": "#f9f9ff",
                      "error-container": "#ffdad6",
                      "tertiary-fixed": "#ffdbcd",
                      "tertiary-container": "#933702",
                      "surface-container-low": "#f3f3fb",
                      "secondary-fixed": "#a4f1de",
                      "on-primary-fixed-variant": "#004494",
                      "on-error-container": "#93000a",
                      "tertiary": "#6e2600",
                      "surface-container-high": "#e7e7f0",
                      "on-surface-variant": "#424752",
                      "surface": "#f9f9ff",
                      "primary": "#003b82",
                      "inverse-on-surface": "#f0f0f9",
                      "on-primary-container": "#b1c9ff",
                      "on-secondary": "#ffffff",
                      "on-tertiary-container": "#ffb99c",
                      "on-error": "#ffffff",
                      "inverse-surface": "#2e3037",
                      "on-tertiary-fixed": "#360f00",
                      "surface-container-highest": "#e1e2ea",
                      "secondary-fixed-dim": "#88d5c2",
                      "error": "#ba1a1a",
                      "surface-container": "#ededf6",
                      "primary-container": "#0051ae",
                      "surface-tint": "#1a5bb9",
                      "secondary": "#126a5b",
                      "outline-variant": "#c2c6d4",
                      "inverse-primary": "#adc6ff",
                      "surface-dim": "#d9d9e2",
                      "on-tertiary": "#ffffff",
                      "surface-variant": "#e1e2ea",
                      "on-primary": "#ffffff",
                      "primary-fixed": "#d8e2ff",
                      "on-background": "#191b21"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {},
              "fontFamily": {
                      "headline": [
                              "Manrope"
                      ],
                      "display": [
                              "Manrope"
                      ],
                      "body": [
                              "Public Sans"
                      ],
                      "label": [
                              "Public Sans"
                      ]
              },
              "fontSize": {}
      },
          },
        }
      </script>
<style>
        body {
            font-family: 'Public Sans', sans-serif;
            background-color: #f9f9ff;
            color: #191b21;
        }
        h1, h2, h3, h4, h5, h6, .font-headline {
            font-family: 'Manrope', sans-serif;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined[data-weight="fill"] {
            font-variation-settings: 'FILL' 1;
        }

        /* Glassmorphism utility */
        .glass-panel {
            background: rgba(249, 249, 255, 0.8);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
        }
        
        .glass-overlay {
            background: rgba(249, 249, 255, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }

        /* Ambient Shadow */
        .ambient-shadow {
            box-shadow: 0px 20px 40px rgba(25, 27, 33, 0.06);
        }

        /* Primary Gradient */
        .primary-gradient {
            background: linear-gradient(135deg, #003b82 0%, #0051ae 100%);
        }

        /* Custom Scrollbar for a cleaner look */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent; 
        }
        ::-webkit-scrollbar-thumb {
            background: #d9d9e2; 
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #c2c6d4; 
        }
    </style>
</head>
<body class="bg-background min-h-screen flex antialiased selection:bg-primary-container selection:text-white">
<!-- SideNavBar -->
<nav class="bg-[#f3f3fb] dark:bg-slate-950 font-['Public_Sans'] text-sm font-medium h-screen w-64 fixed left-0 top-0 flex flex-col no-border tonal-shift-surface-container-low flat no shadows flex flex-col py-8 pr-4 gap-2 z-40 hidden md:flex">
<div class="px-6 mb-8 flex items-center gap-4">
<img alt="Medical Facility Logo" class="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbuIEjlXUvXaJ49WNwei-XSZWLhMcN2FmxdJX_exsl0-YFJE9umGI9AP2lNeyExHmy5Dlk7rMtNSl8CogiGgZTJDUwbgUolcfHegEWDMnD8EPqoB8roAQhyNp7zMv_XsEHKFiJdeLYPbqM1OxxRCgI9RQsLaxJQFTGtAJYBQO1Q440mqdDTTCfjWVFUdgDQXYJIQJ6TffcklT_SkTyzPWVPmkJwpu1XD50cGz4jJTPxV4M18WC34mngnNsI7Om0391cYggnye87RRf"/>
<div>
<h1 class="font-['Manrope'] text-lg font-bold text-[#191b21] dark:text-white leading-tight">Triage Module</h1>
<p class="text-xs text-on-surface-variant">JCI Compliant Environment</p>
</div>
</div>
<div class="flex-1 overflow-y-auto overflow-x-hidden pr-2 flex flex-col gap-1 mt-2">
<a class="bg-white dark:bg-slate-900 text-[#0051ae] dark:text-blue-400 font-bold shadow-sm rounded-r-full flex items-center gap-3 px-6 py-3 ml-0 mr-4 transition-all duration-300 relative group" href="#">
<span class="absolute left-0 top-0 bottom-0 w-1 bg-primary-container rounded-r-full"></span>
<span class="material-symbols-outlined text-[20px]" data-icon="bolt">bolt</span>
<span>Rapid Intake</span>
</a>
<a class="text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full flex items-center gap-3 px-6 py-3 ml-0 mr-4 transition-all duration-300" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="fact_check">fact_check</span>
<span>Detailed Assessment</span>
</a>
<a class="text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full flex items-center gap-3 px-6 py-3 ml-0 mr-4 transition-all duration-300" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="dashboard_customize">dashboard_customize</span>
<span>Monitor Command</span>
</a>
<a class="text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full flex items-center gap-3 px-6 py-3 ml-0 mr-4 transition-all duration-300" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="group">group</span>
<span>Patient Records</span>
</a>
<a class="text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full flex items-center gap-3 px-6 py-3 ml-0 mr-4 transition-all duration-300" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</div>
<div class="px-6 mt-auto flex flex-col gap-4">
<button class="bg-error text-on-error hover:bg-error/90 w-full py-3 rounded-md font-bold flex items-center justify-center gap-2 transition-colors duration-200">
<span class="material-symbols-outlined text-[18px]">warning</span>
                Emergency Alert
            </button>
<a class="text-[#424752] dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-r-full flex items-center gap-3 px-6 py-3 -ml-6 transition-all duration-300" href="#">
<span class="material-symbols-outlined text-[20px]" data-icon="logout">logout</span>
<span>Log Out</span>
</a>
</div>
</nav>
<!-- Main Content Wrapper -->
<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
<!-- TopNavBar -->
<header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-[#0051ae] dark:text-[#5c98ff] font-['Manrope'] tracking-tight font-bold docked full-width top-0 sticky z-50 bg-surface-container-low dark:bg-slate-800 shadow-[0px_20px_40px_rgba(25,27,33,0.06)] flex justify-between items-center w-full px-6 h-16">
<div class="flex items-center gap-6">
<!-- Mobile Menu Toggle -->
<button class="md:hidden text-on-surface hover:bg-[#f3f3fb] p-2 rounded-md">
<span class="material-symbols-outlined">menu</span>
</button>
<div class="text-xl font-black text-[#0051ae] dark:text-[#5c98ff] tracking-tight">Clinical Atelier HIS</div>
<!-- Desktop Nav Links (Hidden as per requirements, relying on SideNav) -->
<nav class="hidden lg:flex items-center gap-4 ml-8">
<a class="text-[#0051ae] dark:text-blue-400 border-b-2 border-[#0051ae] py-5 px-2 hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors Active: scale-95 duration-200" href="#">Rapid Intake</a>
<a class="text-[#424752] dark:text-slate-400 py-5 px-2 hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors" href="#">Directory</a>
</nav>
</div>
<div class="flex items-center gap-4">
<!-- Search Bar (on_left configuration) -->
<div class="hidden md:flex relative group">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors text-[20px]">search</span>
<input class="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 w-64 text-sm text-on-surface placeholder:text-on-surface-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-lowest transition-all" placeholder="Search Patient Directory..." type="text"/>
</div>
<!-- Trailing Icons -->
<div class="flex items-center gap-1">
<button class="p-2 rounded-full hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors text-[#424752] relative">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="p-2 rounded-full hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors text-[#424752]">
<span class="material-symbols-outlined text-error" data-icon="emergency">emergency</span>
</button>
<button class="p-2 rounded-full hover:bg-[#f3f3fb] dark:hover:bg-slate-800 transition-colors text-[#424752]">
<span class="material-symbols-outlined" data-icon="help_outline">help_outline</span>
</button>
</div>
<!-- Profile -->
<div class="ml-2 pl-4 border-l border-surface-variant">
<img alt="Chief Medical Officer profile" class="w-9 h-9 rounded-full object-cover ring-2 ring-transparent hover:ring-primary-container transition-all cursor-pointer" data-alt="professional portrait of an older male doctor in white coat with stethoscope, soft warm clinic lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdft4vwBmdTsHBOaH1fbDF7sJuBQOmt7I4AA98G5Ebx309QHjbXfPkZls428ncUnq5qX_sCDO2G792rEQdWi9J5YKVpTN8G5dnGKgWsUI_A0rYQbKUxE7GlVFDBoASk11yjHIShXwO5COIYi_8ged9eZ1nY4JhORA0XJmLGNS8c-tcTzOFuhLjltV0O1oCxRdR4z1S5HGhFRqKNkhcePJ1CPf_hPuPmA30Q7C8_mxs1-uzo4Ww5b4rAX5RVt6-_iKQjq8KVpyyx1oh"/>
</div>
</div>
</header>
<!-- Main Canvas -->
<main class="flex-1 p-6 md:p-8 lg:p-10 lg:pr-12 max-w-[1600px] mx-auto w-full">
<!-- Hero Header -->
<div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
<div>
<div class="flex items-center gap-3 mb-2">
<span class="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-sm">Poli Outpatient</span>
<span class="text-on-surface-variant text-sm font-medium">Standard Triage Flow</span>
</div>
<h2 class="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">Patient Screening</h2>
</div>
<div class="flex gap-3">
<button class="bg-surface-container-high text-primary hover:bg-surface-variant px-6 py-3 rounded-md font-bold text-sm transition-colors flex items-center gap-2">
<span class="material-symbols-outlined text-[18px]">search</span>
                        Patient Directory
                    </button>
<button class="primary-gradient text-white hover:opacity-90 px-6 py-3 rounded-md font-bold text-sm transition-opacity flex items-center gap-2 shadow-sm">
<span class="material-symbols-outlined text-[18px]">add</span>
                        New Intake
                    </button>
</div>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
<!-- Left Column: Primary Action Area (Wider) -->
<div class="lg:col-span-8 flex flex-col gap-6">
<!-- Rapid Vitals Card -->
<div class="bg-surface-container-lowest rounded-xl p-8 ambient-shadow relative overflow-hidden">
<!-- Decorative subtle gradient accent -->
<div class="absolute top-0 right-0 w-64 h-64 bg-primary-fixed opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
<div class="flex justify-between items-center mb-8 relative z-10">
<h3 class="font-headline text-2xl font-bold text-on-surface">Rapid Vital Check</h3>
<div class="flex items-center gap-2 bg-secondary-container px-3 py-1.5 rounded-full">
<div class="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
<span class="text-on-secondary-container text-xs font-bold tracking-wide uppercase">System Ready</span>
</div>
</div>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
<!-- Heart Rate -->
<div class="bg-surface-container-low rounded-lg p-4 group hover:bg-surface-container transition-colors cursor-text">
<div class="flex justify-between items-start mb-2">
<span class="material-symbols-outlined text-outline group-focus-within:text-primary">favorite</span>
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">BPM</span>
</div>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none p-0 text-3xl font-headline font-bold text-on-surface w-full focus:ring-0 placeholder:text-outline-variant" placeholder="--" type="number"/>
</div>
</div>
<!-- Blood Pressure -->
<div class="bg-surface-container-low rounded-lg p-4 group hover:bg-surface-container transition-colors cursor-text">
<div class="flex justify-between items-start mb-2">
<span class="material-symbols-outlined text-outline group-focus-within:text-primary">blood_pressure</span>
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">mmHg</span>
</div>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none p-0 text-3xl font-headline font-bold text-on-surface w-full focus:ring-0 placeholder:text-outline-variant" placeholder="--/--" type="text"/>
</div>
</div>
<!-- SpO2 -->
<div class="bg-surface-container-low rounded-lg p-4 group hover:bg-surface-container transition-colors cursor-text">
<div class="flex justify-between items-start mb-2">
<span class="material-symbols-outlined text-outline group-focus-within:text-primary">air</span>
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">%</span>
</div>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none p-0 text-3xl font-headline font-bold text-on-surface w-full focus:ring-0 placeholder:text-outline-variant" placeholder="--" type="number"/>
</div>
</div>
<!-- Temperature -->
<div class="bg-surface-container-low rounded-lg p-4 group hover:bg-surface-container transition-colors cursor-text">
<div class="flex justify-between items-start mb-2">
<span class="material-symbols-outlined text-outline group-focus-within:text-primary">device_thermostat</span>
<span class="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">°C</span>
</div>
<div class="flex items-baseline gap-1">
<input class="bg-transparent border-none p-0 text-3xl font-headline font-bold text-on-surface w-full focus:ring-0 placeholder:text-outline-variant" placeholder="--" step="0.1" type="number"/>
</div>
</div>
</div>
</div>
<!-- Clinical Screening Questions -->
<div class="bg-surface-container-lowest rounded-xl p-8 ambient-shadow">
<div class="mb-6">
<h3 class="font-headline text-xl font-bold text-on-surface">Initial Screening</h3>
<p class="text-sm text-on-surface-variant mt-1">Select all applicable conditions for priority routing.</p>
</div>
<div class="flex flex-col gap-3">
<!-- Option 1 -->
<label class="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors border border-transparent hover:border-outline-variant/30">
<div class="relative flex items-center">
<input class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline checked:border-primary checked:bg-primary transition-all" type="checkbox"/>
<span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
<svg class="h-3.5 w-3.5" fill="currentColor" stroke="currentColor" stroke-width="1" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill-rule="evenodd"></path>
</svg>
</span>
</div>
<div class="flex-1">
<p class="text-on-surface font-medium text-sm">Fever &gt; 38°C or Chills in last 48 hours</p>
</div>
</label>
<!-- Option 2 -->
<label class="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors border border-transparent hover:border-outline-variant/30">
<div class="relative flex items-center">
<input class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline checked:border-primary checked:bg-primary transition-all" type="checkbox"/>
<span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
<svg class="h-3.5 w-3.5" fill="currentColor" stroke="currentColor" stroke-width="1" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill-rule="evenodd"></path>
</svg>
</span>
</div>
<div class="flex-1">
<p class="text-on-surface font-medium text-sm">Shortness of breath at rest</p>
</div>
<span class="material-symbols-outlined text-tertiary-container" data-weight="fill" title="Escalation Risk">warning</span>
</label>
<!-- Option 3 -->
<label class="flex items-center gap-4 p-4 rounded-lg bg-surface-container-low hover:bg-surface-container cursor-pointer transition-colors border border-transparent hover:border-outline-variant/30">
<div class="relative flex items-center">
<input class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-outline checked:border-primary checked:bg-primary transition-all" type="checkbox"/>
<span class="absolute text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
<svg class="h-3.5 w-3.5" fill="currentColor" stroke="currentColor" stroke-width="1" viewbox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
<path clip-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill-rule="evenodd"></path>
</svg>
</span>
</div>
<div class="flex-1">
<p class="text-on-surface font-medium text-sm">Routine Follow-up / Prescription Refill</p>
</div>
</label>
</div>
</div>
</div>
<!-- Right Column: Context & Escalation (Narrower) -->
<div class="lg:col-span-4 flex flex-col gap-6">
<!-- Classification System -->
<div class="bg-surface-container-low rounded-xl p-6 h-full flex flex-col relative overflow-hidden">
<div class="mb-6 z-10">
<h4 class="font-headline text-sm font-bold text-on-surface uppercase tracking-widest mb-1">Current Classification</h4>
<p class="text-2xl font-headline font-extrabold text-primary">Standard Triage</p>
</div>
<div class="flex-1 z-10">
<div class="space-y-4">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary font-bold text-sm shadow-sm">1</div>
<p class="text-sm text-on-surface-variant">Complete Vital Checks</p>
</div>
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline font-bold text-sm">2</div>
<p class="text-sm text-outline">Answer Screening Form</p>
</div>
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline font-bold text-sm">3</div>
<p class="text-sm text-outline">Route to Clinic</p>
</div>
</div>
</div>
<!-- Critical Escalation Trigger -->
<div class="mt-8 pt-6 border-t border-surface-variant/50 z-10">
<p class="text-xs text-on-surface-variant mb-3 font-medium">Bypass Poli for unstable vitals:</p>
<button class="w-full bg-error-container text-on-error-container hover:bg-error hover:text-white py-4 rounded-md font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group">
<span class="material-symbols-outlined text-[20px] group-hover:animate-pulse" data-weight="fill">notifications_active</span>
                                Escalate to IGD
                            </button>
</div>
<!-- Abstract background shape for visual interest -->
<div class="absolute -bottom-16 -right-16 w-48 h-48 bg-primary opacity-5 rounded-full blur-2xl pointer-events-none"></div>
</div>
</div>
</div>
</main>
</div>
</body></html>
