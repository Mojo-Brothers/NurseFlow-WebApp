import { Router } from 'express';
import { postgresPoolService } from '../db/postgresPool.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';
import { respond } from '../utils/apiResponse.js';

const router = Router();

// GET /api/v1/billing/ledger/:episodeId
router.get('/ledger/:episodeId', authenticateJwt, async (req, res, next) => {
  try {
    const pool = postgresPoolService.getPool();
    const invRes = await pool.query('SELECT * FROM hospital_invoices WHERE episode_id = $1;', [req.params.episodeId]);
    const depRes = await pool.query('SELECT * FROM patient_deposit_ledgers WHERE episode_id = $1;', [req.params.episodeId]);

    const totalBill = invRes.rows.reduce((acc, curr) => acc + (Number(curr.total_amount_idr) || 0), 0);
    const totalDeposits = depRes.rows.reduce((acc, curr) => acc + (Number(curr.amount_idr) || 0), 0);

    return respond.ok(res, {
      data: {
        episodeId: req.params.episodeId,
        totalBill,
        totalDeposits,
        invoices: invRes.rows,
        deposits: depRes.rows
      },
      correlationId: req.correlationId
    });
  } catch (err) {
    next(err);
  }
});

export default router;
