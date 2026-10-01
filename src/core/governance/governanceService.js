/**
 * NurseFlow Enterprise HIS 2026 — Master Client Governance Service
 * Handles data fetching, live/fallback synchronization, searching, and filtering.
 */

import { GOVERNANCE_BASELINE_DATA } from './governanceBaselineData.js';

class GovernanceService {
  constructor() {
    this.cachedData = null;
    this.lastFetched = 0;
    this.CACHE_TTL = 15000; // 15 seconds
  }

  /**
   * Fetch full governance audit data (Live API with Baseline Fallback)
   */
  async getFullAudit(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cachedData && now - this.lastFetched < this.CACHE_TTL) {
      return this.cachedData;
    }

    try {
      const response = await fetch('/api/v1/governance/full-audit');
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          this.cachedData = json;
          this.lastFetched = now;
          return json;
        }
      }
    } catch (_) {
      // In offline / standalone test mode, fall back seamlessly
    }

    this.cachedData = GOVERNANCE_BASELINE_DATA;
    this.lastFetched = now;
    return this.cachedData;
  }

  async getSummary() {
    const data = await this.getFullAudit();
    return {
      scannedAt: data.scannedAt,
      project: data.project,
      contradictionsCount: data.contradictions?.length || 0,
      openFindingsCount: data.findings?.length || 0,
      nextActionsCount: data.nextRequiredActions?.length || 0
    };
  }

  async getPhases() {
    const data = await this.getFullAudit();
    return data.phases || [];
  }

  async getWorkstreams() {
    const data = await this.getFullAudit();
    return data.workstreams || [];
  }

  async getDomains() {
    const data = await this.getFullAudit();
    return data.domains || [];
  }

  async getSecurityControls() {
    const data = await this.getFullAudit();
    return data.securityControls || [];
  }

  async getFindings(filters = {}) {
    const data = await this.getFullAudit();
    let list = data.findings || [];

    if (filters.severity && filters.severity !== 'ALL') {
      list = list.filter(f => f.severity.toUpperCase() === filters.severity.toUpperCase());
    }
    if (filters.domain && filters.domain !== 'ALL') {
      list = list.filter(f => f.domain.toLowerCase().includes(filters.domain.toLowerCase()));
    }
    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(f => f.status.toUpperCase() === filters.status.toUpperCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(f => 
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.currentState.toLowerCase().includes(q) ||
        f.affectedComponents.some(c => c.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getContradictions() {
    const data = await this.getFullAudit();
    return data.contradictions || [];
  }

  async getNextActions() {
    const data = await this.getFullAudit();
    return data.nextRequiredActions || [];
  }

  async getInventory() {
    const data = await this.getFullAudit();
    return data.inventory || {};
  }
}

export const governanceService = new GovernanceService();
