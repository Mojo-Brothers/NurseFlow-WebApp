/**
 * NurseFlow Enterprise HIS 2026 — Shared Queue Management Facade
 * Eliminates duplicate queue service instances across front_office & master_data.
 */

import { queueManagementEngineService } from '../modules/front_office/services/queueManagementEngine.service.js';

export const sharedQueueFacadeService = {
  generateTicket: (payload) => queueManagementEngineService.generateTicket(payload),
  callTicket: (payload) => queueManagementEngineService.callTicket(payload),
  updateTicketStatus: (id, status) => queueManagementEngineService.updateTicketStatus(id, status),
  getTickets: (pool) => queueManagementEngineService.getTickets(pool),
  getPools: () => queueManagementEngineService.getPools()
};
