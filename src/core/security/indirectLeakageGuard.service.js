/**
 * NurseFlow Enterprise HIS 2026 — Indirect Cross-Tenant Information Leakage Guard
 * Standards: OWASP Top 10 (A01: Broken Access Control), JCI MOI Patient Privacy,
 * NIST SP 800-207 (Multi-Tenant Zero Information Disclosure).
 */

import { pool } from '../../../server/db/postgresPool.js';

export class IndirectLeakageGuardService {
  /**
   * Tenant-Scoped Global Patient Search (Zero Side-Channel Leakage)
   */
  async searchPatients({ tenantId, searchQuery, limit = 10 }) {
    if (!tenantId) throw new Error('Tenant ID is mandatory for patient search');

    const res = await pool.query(`
      SELECT id, mrn, full_name, birth_date, gender, bpjs_card_number
      FROM master_patients
      WHERE tenant_id = $1
        AND (full_name ILIKE $2 OR mrn ILIKE $2 OR nik ILIKE $2)
      ORDER BY full_name ASC
      LIMIT $3;
    `, [tenantId, `%${searchQuery}%`, limit]);

    // Also get isolated aggregate count strictly for this tenant
    const countRes = await pool.query(`
      SELECT count(*) FROM master_patients
      WHERE tenant_id = $1
        AND (full_name ILIKE $2 OR mrn ILIKE $2 OR nik ILIKE $2);
    `, [tenantId, `%${searchQuery}%`]);

    return {
      results: res.rows,
      totalCount: parseInt(countRes.rows[0].count, 10),
      queriedTenant: tenantId
    };
  }

  /**
   * Tenant-Scoped Hospital Dashboard KPI Aggregation
   */
  async getHospitalDashboardKpi({ tenantId }) {
    if (!tenantId) throw new Error('Tenant ID is mandatory for dashboard KPI');

    const [activeEncounters, totalOrders, totalAdmissions] = await Promise.all([
      pool.query(`
        SELECT count(*) FROM encounters
        WHERE tenant_id = $1 AND status IN ('ARRIVED', 'TRIAGED', 'IN_PROGRESS', 'ADMITTED');
      `, [tenantId]),
      pool.query(`
        SELECT count(*) FROM clinical_orders
        WHERE tenant_id = $1;
      `, [tenantId]),
      pool.query(`
        SELECT count(*) FROM episodes_of_care
        WHERE tenant_id = $1 AND status = 'ACTIVE';
      `, [tenantId])
    ]);

    return {
      tenantId,
      activeEncountersCount: parseInt(activeEncounters.rows[0].count, 10),
      totalOrdersCount: parseInt(totalOrders.rows[0].count, 10),
      activeEpisodesCount: parseInt(totalAdmissions.rows[0].count, 10)
    };
  }
}

export const indirectLeakageGuardService = new IndirectLeakageGuardService();
