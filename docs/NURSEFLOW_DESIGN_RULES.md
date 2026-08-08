# ⚖️ NURSEFLOW DESIGN CONSTITUTION (V6.5 - OCEANIC MONOCHROME)
**Status: ARCHITECTURE SEALED (PRODUCTION READY)**
**Control Level: ABSOLUTE (ENFORCED VIA AST SENTINEL)**

This document defines the permanent architectural boundaries between visual presentation and clinical operation. NurseFlow operates on a **Zero-Trust UI model**.

---

## 🏛️ General Philosophy
NurseFlow uses a **High-Contrast Neo-Minimalist Architecture**. The system UI relies heavily on pure monochrome (black and white) with a single, highly distinct Oceanic Blue (#015c80) serving as the primary anchor for actions and active states. 

> [!IMPORTANT]
> **Architecture Sealed:** Any modification to the core Zoning primitives (`ClinicalCard`, `PresentationCard`) or the AST Audit Sentinel requires a Board-level Architectural Review.

---

## 🟢 Zone 1: Presentation (Dashboard / Overview)
**Goal:** Extreme Clarity, Immediate Cognitive Anchoring.

### Standards:
- **No Glassmorphism:** Transparency is forbidden. All backgrounds must be solid.
- **Harsh Monochrome:** Use stark white surfaces with sharp black borders (`2px solid black`).
- **Neo-Minimalist Layouts:** Bento-style layouts using thick grid lines and high contrast.
- **Flat Shadows:** If shadows are used, they must be solid neo-brutalist shadows (e.g. `4px 4px 0px #000`), never soft ambient blur.

---

## 🔴 Zone 3: Operational (Triage / EMR / Billing / Pharmacy)
**Goal:** Zero-Error, High-Speed, Clinical Decision Support.

### MANDATORY (Hukum Mati):
- **Component Lock:** MUST use `<ClinicalCard />`.
- **Flat Surfaces:** Solid backgrounds only (Pure White `#FFF` or extreme light gray `#FAFAFA`).
- **High Contrast:** All text must meet WCAG AAA standards. Primary text is pure black (`#000`).
- **IPSG Compliance:** Mandatory identity verification layers for all critical operational actions.
- **Oceanic Focus:** The only non-alert colors permitted are `#015c80` for primary actions.

### FORBIDDEN:
- **No Glass/Blur:** Transparency on clinical data is a critical safety failure.
- **No Soft Shadows:** Floating effects cause visual ambiguity.
- **No Animations over 150ms:** Zero layout shifts. UI must feel instantly responsive (snappy).

---

## 🛡️ Enforcement Guardrails (Absolute Immunity)
1. **Syntactical Sentinel (AST):** Every build audits code structure via `@babel/parser`. Obfuscation is automatically blocked.
2. **Hard Runtime Errors:** Design violations in development trigger immediate system halts.
3. **Observability:** `useClinicalMetrics` must be used in all Zone 3 modules to track cognitive load.

---

**© 2026 NurseFlow Architectural Board. All Principles Final.**
