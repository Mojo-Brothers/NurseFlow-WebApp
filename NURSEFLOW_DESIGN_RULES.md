# ⚖️ NURSEFLOW DESIGN CONSTITUTION (V6.0 - FINAL)
**Status: ARCHITECTURE SEALED (PRODUCTION READY)**
**Control Level: ABSOLUTE (ENFORCED VIA AST SENTINEL)**

This document defines the permanent architectural boundaries between visual presentation and clinical operation. NurseFlow operates on a **Zero-Trust UI model**.

---

## 🏛️ General Philosophy
NurseFlow uses a **Context-Aware Interface Architecture**. The system UI adapts its visual weight based on the user's current cognitive load and task criticality. 

> [!IMPORTANT]
> **Architecture Sealed:** Any modification to the core Zoning primitives (`ClinicalCard`, `PresentationCard`) or the AST Audit Sentinel requires a Board-level Architectural Review.

---

## 🟢 Zone 1: Presentation (Dashboard / Overview)
**Goal:** WOW Factor, First Impression, Macro-Management.

### Standards:
- **Glassmorphism:** Use `<PresentationCard />` for ambient tiles.
- **Vibrant Backgrounds:** Subtle mesh gradients (Max 7% opacity).
- **Asymmetric Grid:** Bento-style layouts for hierarchy.
- **Premium Shadows:** Deep, soft shadows for floating effects.

---

## 🔴 Zone 3: Operational (Triage / EMR / Billing / Pharmacy)
**Goal:** Zero-Error, High-Speed, Clinical Decision Support.

### MANDATORY (Hukum Mati):
- **Component Lock:** MUST use `<ClinicalCard />`.
- **Flat Surfaces:** Solid backgrounds only.
- **High Contrast:** All text must meet WCAG AAA standards.
- **IPSG Compliance:** Mandatory identity verification layers for all critical operational actions.

### FORBIDDEN:
- **No Glass/Blur:** Transparency on clinical data is a critical safety failure.
- **No Animations:** Zero layout shifts or distracting pulses.
- **No Aesthetic Leakage:** Strict border-based separation instead of ambient depth.

---

## 🛡️ Enforcement Guardrails (Absolute Immunity)
1. **Syntactical Sentinel (AST):** Every build audits code structure via `@babel/parser`. Obfuscation is automatically blocked.
2. **Hard Runtime Errors:** Design violations in development trigger immediate system halts.
3. **Observability:** `useClinicalMetrics` must be used in all Zone 3 modules to track cognitive load.

---

**© 2026 NurseFlow Architectural Board. All Principles Final.**
