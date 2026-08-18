/**
 * NurseFlow Enterprise HIS 2026 — CDSS Execution & Replay Repository
 * Stores full input and output snapshots for medicolegal audit trails
 */

import { CdssExecution } from '../modules/cdss/entities/ClinicalRuleEntities.js';

class CdssExecutionRepository {
  constructor() {
    this.executions = new Map();
  }

  async recordExecution(executionData) {
    const id = executionData.id || `CDSS-EXEC-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const exec = new CdssExecution({
      ...executionData,
      id,
      executedAt: executionData.executedAt || Date.now()
    });
    this.executions.set(id, exec);
    return exec;
  }

  async findById(id) {
    const exec = this.executions.get(id);
    return exec ? { ...exec } : null;
  }

  async findByEncounterId(encounterId) {
    return Array.from(this.executions.values())
      .filter(e => e.encounterId === encounterId)
      .sort((a, b) => b.executedAt - a.executedAt);
  }

  async findByPatientId(patientId) {
    return Array.from(this.executions.values())
      .filter(e => e.patientId === patientId)
      .sort((a, b) => b.executedAt - a.executedAt);
  }
}

export const cdssExecutionRepository = new CdssExecutionRepository();
