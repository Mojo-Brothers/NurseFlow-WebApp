# P0-2B WAVE 1B.0S — GUC DEPENDENCY FORENSICS & CATALOG MATRIX REPORT

**Audit Date:** 2026-10-01  
**Repository:** `Mojo-Brothers/NurseFlow-WebApp`  
**Current Branch:** `feature/security-foundation-wave1a10`  
**Auditor:** Independent Security Auditor (Antigravity AI)  
**Audit Standard:** Read-Only Adversarial Forensic Analysis  

---

## 1. Executive Summary

This forensic report maps all dependencies across the PostgreSQL database and application tiers on tenant context session variables (GUCs):
- `app.tenant_id`
- `app.current_tenant_id`
- `current_app_tenant_id()`

The audit confirms an architectural **catalog-wide GUC split**: of the 100 RLS-enabled tables, **54 tables** depend on `current_app_tenant_id()` (which queries `app.tenant_id`), while **46 tables** depend on `app.current_tenant_id`.

The system does not experience query blackouts inside the canonical Unit of Work only because `server/db/unitOfWork.js` explicitly injects **both** session variables on every transaction.

---

## 2. Deep Forensic Inspection of `public.current_app_tenant_id()`

Queried directly from `pg_proc`:
```sql
CREATE OR REPLACE FUNCTION public.current_app_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::UUID;
END;
$function$
```

### Architectural & Security Attributes:
| Attribute | Catalog Value | Security Evaluation |
| :--- | :--- | :--- |
| **GUC Read Target** | `'app.tenant_id'` | **Legacy GUC.** Does NOT read `app.current_tenant_id`. |
| **Volatility** | `STABLE` (`provolatile = 's'`) | Safe for query planning within a single transaction. |
| **Security Execution** | `SECURITY INVOKER` (`prosecdef = false`) | Executes with caller privileges. |
| **Leakproof** | `false` | Standard user-defined function. |
| **Search Path** | Unset (`proconfig = null`) | Inherits caller search path. |
| **Missing GUC Handling** | `current_setting('...', true)` | Returns NULL if variable is missing (does not throw). |
| **Empty String Handling** | `NULLIF(..., '')` | Coerces empty string to SQL `NULL`. |
| **Malformed String Handling**| `::UUID` cast | Throws `invalid input syntax for type uuid` if non-empty, non-UUID string is present. |
| **Catalog Callers** | **54 RLS Policies** | Active runtime dependency across 54 core clinical and administrative tables. |

---

## 3. GUC Dependency Categorization

### Category A: Direct `app.current_tenant_id` (46 Tables)
Policies explicitly defined with:
`tenant_id = (NULLIF(current_setting('app.current_tenant_id'::text, true), ''::text))::uuid`

### Category B: Indirect `current_app_tenant_id()` -> `app.tenant_id` (54 Tables)
Policies explicitly defined with:
`tenant_id = current_app_tenant_id()`

### Category C: Direct `app.tenant_id` in Policies (0 Tables)
No active catalog policy uses inline `current_setting('app.tenant_id')` directly; all 54 legacy policies call `current_app_tenant_id()`.

### Category D: Application Code GUC Setters
1. **`server/db/unitOfWork.js` (lines 65–66):**
   ```javascript
   await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId.trim()]);
   await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId.trim()]);
   ```
   **Scope:** Transaction-local (`is_local = true`). Injects **BOTH** GUCs simultaneously. Sanitized on release via `DISCARD ALL`.
2. **`server/db/transactionManager.js` (line 157):**
   ```javascript
   await client.query("SELECT set_config('app.current_tenant_id', $1, true);", [String(options.tenantId).trim()]);
   ```
   **Scope:** Transaction-local. Injects **ONLY** `app.current_tenant_id`. (Hazard: Calling Category B tables through `transactionManager` without `unitOfWork` fails closed because `app.tenant_id` is missing).
3. **`server/middlewares/tenantMiddleware.js`:**
   Does **NOT** connect to PostgreSQL and sets **NO** GUC. Operates strictly in Express request memory (`req.tenantId`).

### Category E: Dynamic / Unknown SQL (0 Sites)
No dynamic or unproven GUC setters exist in the repository.

---

## 4. Comprehensive 54 / 46 Catalog Table Matrix

### Category A Tables (46 Tables — Direct `app.current_tenant_id`):
1. `blood_bank_billing_reconciliations`
2. `blood_bedside_dual_nurse_verifications`
3. `bpjs_claim_disputes`
4. `bpjs_claim_submissions`
5. `bpjs_vclaim_lifecycle_logs`
6. `casemix_cases`
7. `clinical_orders`
8. `cssd_instrument_sets`
9. `cssd_sterilization_cycles`
10. `encounters`
11. `hemovigilance_incident_investigations`
12. `inacbg_grouping_results`
13. `inpatient_room_transfers`
14. `longitudinal_care_plans`
15. `master_inacbg_tariffs`
16. `master_patients`
17. `medical_device_implant_recalls`
18. `medication_dispense_allocations`
19. `medication_emar_administrations`
20. `operating_theatres`
21. `patient_billing_reconciliation`
22. `patient_split_invoices`
23. `pharmacy_controlled_substance_logs`
24. `pharmacy_depots`
25. `pharmacy_dispensing_orders`
26. `physician_diagnostic_interpretations`
27. `post_anesthesia_aldrete_scores`
28. `radiology_critical_finding_alerts`
29. `radiology_instances`
30. `radiology_orders`
31. `radiology_series`
32. `safety_decision_registry`
33. `surgical_clinical_notes`
34. `surgical_teams`
35. `telemedicine_sessions`
36. `universal_audit_logs`
37. `who_surgical_safety_checklists`
38. `billing_reconciliations`
39. `claims`
40. `clinical_decision_support_rules`
41. `communication_messages`
42. `corporate_guarantors`
43. `discharge_summaries`
44. `insurance_claims`
45. `inventory_batches`
46. `kiosk_registration_sessions`

---

### Category B Tables (54 Tables — Indirect `current_app_tenant_id()` -> `app.tenant_id`):
1. `anesthesia_records`
2. `appointment_audit_logs`
3. `appointments`
4. `bed_occupancies`
5. `bed_transfers`
6. `billing_ledgers`
7. `blood_bedside_verifications`
8. `blood_crossmatch_tests`
9. `blood_donor_units`
10. `blood_issue_records`
11. `care_team_assignments`
12. `care_teams`
13. `clinical_pathways`
14. `clinical_protocols`
15. `cppt_entries`
16. `critical_lab_alerts`
17. `department_queues`
18. `dietary_orders`
19. `emergency_triages`
20. `ews_observations`
21. `formulary_exceptions`
22. `incident_reports`
23. `infection_control_surveillance`
24. `insurance_verifications`
25. `interop_audit_logs`
26. `laboratory_specimens`
27. `lab_test_results`
28. `master_beds`
29. `master_icd9_procedures`
30. `master_organizations`
31. `medication_administrations`
32. `medication_orders`
33. `nurse_assignments`
34. `nursing_care_plans`
35. `nursing_shift_handoffs`
36. `on_call_schedules`
37. `operating_rooms`
38. `pathology_orders`
39. `patient_allergies`
40. `patient_consents`
41. `patient_registrations`
42. `pharmacy_prescriptions`
43. `pharmacy_warehouses`
44. `post_op_handoffs`
45. `prescription_dispense_records`
46. `queue_sequences`
47. `queue_tickets`
48. `resuscitation_events`
49. `shift_assignments`
50. `soap_notes`
51. `staff_credentials`
52. `staff_rosters`
53. `surgery_cases`
54. `triage_records`

---

## 5. Security & Architectural Evaluation

| Mechanism | Evaluation | Classification |
| :--- | :--- | :--- |
| **`app.current_tenant_id` via `withUnitOfWork`** | Transaction-scoped (`set_config(..., true)`), fail-closed, sanitized via `DISCARD ALL` in finally block. | **`SAFE_FOR_TRANSACTION_SCOPED_CONTEXT`** |
| **`current_app_tenant_id()` Helper** | Fails closed on NULL, but introduces a dual-GUC dependency on `app.tenant_id`. | **`SAFE_WITH_LIMITATION`** |
| **Naked Pool Queries (Outside UoW)** | No GUC injected; queries either return 0 rows or touch non-RLS tables without DB isolation. | **`UNSAFE`** |
| **Overall Catalog GUC Uniformity** | Partitioned between two GUC variables across 100 tables. | **`OPEN_ARCHITECTURAL_HAZARD`** |
