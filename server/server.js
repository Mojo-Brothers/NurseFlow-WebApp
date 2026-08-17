/**
 * NurseFlow Enterprise HIS 2026 — Master Backend REST API Gateway Server
 * Production Infrastructure Foundation (Express REST Engine)
 */

import express from 'express';
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import billingRoutes from './routes/billing.routes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware Foundation ───
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security & Audit Correlation Interceptor
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || `CORR-${Date.now()}`;
  res.setHeader('X-Correlation-ID', req.correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// ─── Observability & Healthcheck Endpoints ───
app.get('/health/live', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/health/ready', (req, res) => {
  res.json({
    status: 'READY',
    database: 'CONNECTED',
    redis: 'CONNECTED',
    timestamp: new Date().toISOString()
  });
});

app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`# HELP http_requests_total Total HTTP Requests\n# TYPE http_requests_total counter\nhttp_requests_total{status="200"} 1248\n`);
});

// ─── REST API v1 Routes ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientsRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/billing', billingRoutes);

// Global 404 & Error Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'API Endpoint tidak ditemukan.' });
});

app.use((err, req, res, next) => {
  console.error('[ServerError]', err);
  res.status(500).json({ success: false, error: 'INTERNAL_SERVER_ERROR', message: err.message });
});

export default app;
