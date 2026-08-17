import { Router } from 'express';
import { billingEngineService } from '../../src/modules/billing/services/billingEngine.service.js';
import { billingRepository } from '../../src/core/repositories/billingRepository.js';
import { authenticateJwt } from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/rbacMiddleware.js';

const router = Router();

// GET /api/v1/billing/ledger/:episodeId
router.get('/ledger/:episodeId', authenticateJwt, async (req, res) => {
  const items = await billingRepository.findByEpisodeId(req.params.episodeId);
  const total = await billingRepository.calculateTotalBill(req.params.episodeId);
  return res.json({
    success: true,
    episodeId: req.params.episodeId,
    totalBill: total,
    items
  });
});

// POST /api/v1/billing/invoices
router.post('/invoices', authenticateJwt, requirePermission('INVOICE_CREATE'), async (req, res) => {
  try {
    const invoice = await billingEngineService.generateInvoice(req.body);
    return res.status(201).json({
      success: true,
      message: 'Faktur Tagihan Pasien Berhasil Diterbitkan',
      data: invoice
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/billing/settle
router.post('/settle', authenticateJwt, requirePermission('PAYMENT_PROCESS'), async (req, res) => {
  try {
    const settled = await billingEngineService.settlePayment(req.body);
    return res.json({
      success: true,
      message: 'Pembayaran Tagihan Berhasil Diselesaikan (Settled)',
      data: settled
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
