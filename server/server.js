/**
 * NurseFlow Enterprise HIS 2026 — Master Backend REST API Gateway Server
 * Production Infrastructure Foundation (Express REST Engine)
 */

import express from 'express';
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import billingRoutes from './routes/billing.routes.js';
import dicomwebRoutes from './routes/dicomweb.routes.js';

import { observabilityMiddleware } from './middlewares/observabilityMiddleware.js';
import { healthCheckService } from './services/healthCheck.service.js';
import { metricsService } from './services/metrics.service.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware Foundation ───
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(observabilityMiddleware);

// Security & Audit Correlation Interceptor
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ─── Observability & Multi-Tier Healthcheck Endpoints (RFC 8617) ───
app.get('/health/live', (req, res) => {
  res.json(healthCheckService.getLiveHealth());
});

app.get('/health/ready', (req, res) => {
  res.json(healthCheckService.getReadyHealth());
});

app.get('/health/deep', (req, res) => {
  res.json(healthCheckService.getDeepHealth());
});

app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(metricsService.generatePrometheusText());
});

app.get('/docs', (req, res) => {
  res.sendFile('docs/openapi.json', { root: './server' });
});

// ─── REST API v1 Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/dicomweb', dicomwebRoutes);

// Global 404 & Error Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'API Endpoint tidak ditemukan.' });
});

app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

export default app;
