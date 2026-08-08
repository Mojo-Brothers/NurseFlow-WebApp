# Enterprise HIS Transformation Directive

This project is a Major System Re-Architecture for an Enterprise Hospital Information System (HIS).

## Core Philosophy
- **Not a standard web project**: Think like an engineering team building a world-class Enterprise HIS.
- **Clinical First**: Patient safety, medical staff speed, documentation ease, clinical data accuracy, auditability, and reporting drive all decisions.
- **Workflow is the Feature**: Optimize workflows aggressively. If an 8-step workflow can become a 3-step workflow securely, do it.

## Mandatory Transformations
- Real-world hospital workflows supporting the full patient journey.
- Deep inter-module connectivity with zero redundant data entry.
- Maximize automation, minimize clicks, minimize page reloads, and eliminate human error.
- Support real-time collaboration.
- Built for long-term scalability and maintainability.

## 11-Step Engineering Process
Every development task MUST follow:
1. Audit legacy module.
2. Identify weaknesses.
3. Analyze real-world hospital workflow.
4. Redesign workflow.
5. Redesign UI.
6. Redesign database (if necessary).
7. Redesign API.
8. Implementation.
9. Refactor.
10. Regression Testing.
11. Document changes.

## Refactoring and Modernization Authority
- DO NOT maintain legacy designs/workflows just because they exist. Use them ONLY as a reference.
- AI has FULL AUTHORITY to: delete ineffective components, change layouts, restructure menus, alter navigation, split/merge modules, and perform massive refactoring/redesigns if it aligns with international HIS standards.
- If a root cause of a problem is architectural, database-related, or workflow-related, REDESIGN it. Do not just patch bugs.

## Mandatory Update Logging Protocol (Wajib Catat Log Perubahan)
- ALL updates (from small bugfixes, UI tweaks, to major architectural features) MUST be documented in **Bahasa Indonesia** inside [`docs/CHANGELOG_PERUBAHAN_HIS.md`](file:///c:/Users/Mojo/NurseFlow-WebApp/docs/CHANGELOG_PERUBAHAN_HIS.md).
- Whenever changes are made or pulled, append a new log entry at the top of the chronological update section detailing:
  - Date & Commit/Phase Info
  - Update Category (`[MAJOR]`, `[FEATURE]`, `[ENHANCEMENT]`, `[FIX]`, `[DOCS]`, `[CHORE]`)
  - Detailed summary of affected components/files and business logic impact.

