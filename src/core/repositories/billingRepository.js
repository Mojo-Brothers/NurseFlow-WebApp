/**
 * NurseFlow Enterprise HIS 2026 — Master Billing & Revenue Repository
 */

import { BaseRepository } from './baseRepository.js';

class BillingRepository extends BaseRepository {
  constructor() {
    super('nurseflow_billing_projections_ledger', []);
  }

  async findByEpisodeId(episodeId) {
    const list = this.loadAll();
    return list.filter(b => b.episode_id === episodeId);
  }

  async calculateTotalBill(episodeId) {
    const items = await this.findByEpisodeId(episodeId);
    return items.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  }
}

export const billingRepository = new BillingRepository();
