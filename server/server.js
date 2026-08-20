/**
 * NurseFlow Enterprise HIS 2026 — Master Backend REST API Gateway Server
 * Production Infrastructure Foundation (Express REST Engine)
 */

import express from 'express';
import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import encountersRoutes from './routes/encounters.routes.js';
import bedsRoutes from './routes/beds.routes.js';
import triageRoutes from './routes/triage.routes.js';
import clinicalNotesRoutes from './routes/clinicalNotes.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import billingRoutes from './routes/billing.routes.js';
import dicomwebRoutes from './routes/dicomweb.routes.js';
import medicationKnowledgeRoutes from './routes/medicationKnowledge.routes.js';
import cdssRoutes from './routes/cdss.routes.js';
import laboratoryRoutes from './routes/laboratory.routes.js';
import radiologyRoutes from './routes/radiology.routes.js';
import medicationClosedLoopRoutes from './routes/medicationClosedLoop.routes.js';
import clinicalMonitoringRoutes from './routes/clinicalMonitoring.routes.js';
import diagnosticInterpretationRoutes from './routes/diagnosticInterpretation.routes.js';
import careCoordinationAndTimelineRoutes from './routes/careCoordinationAndTimeline.routes.js';
import perioperativeClosedLoopRoutes from './routes/perioperativeClosedLoop.routes.js';
import clinicalCodingAndCasemixRoutes from './routes/clinicalCodingAndCasemix.routes.js';
import patientFinancialAndRevenueCycleRoutes from './routes/patientFinancialAndRevenueCycle.routes.js';
import bloodBankRoutes from './routes/bloodBank.routes.js';
import staffPrivilegingRoutes from './routes/staffPrivileging.routes.js';
import masterDataHubRoutes from './routes/masterDataHub.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import enterpriseInventoryRoutes from './routes/enterpriseInventory.routes.js';
import satusehatStudioRoutes from './routes/satusehatStudio.routes.js';
import commandCenterRoutes from './routes/commandCenter.routes.js';

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
app.use('/api/v1/encounters', encountersRoutes);
app.use('/api/v1/beds', bedsRoutes);
app.use('/api/v1/triage', triageRoutes);
app.use('/api/v1/clinical-notes', clinicalNotesRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/laboratory', laboratoryRoutes);
app.use('/api/v1/radiology', radiologyRoutes);
app.use('/api/v1/medications', medicationClosedLoopRoutes);
app.use('/api/v1/monitoring', clinicalMonitoringRoutes);
app.use('/api/v1/diagnostics', diagnosticInterpretationRoutes);
app.use('/api/v1/coordination', careCoordinationAndTimelineRoutes);
app.use('/api/v1/perioperative', perioperativeClosedLoopRoutes);
app.use('/api/v1/casemix', clinicalCodingAndCasemixRoutes);
app.use('/api/v1/patient-financial', patientFinancialAndRevenueCycleRoutes);
app.use('/api/v1/blood-bank', bloodBankRoutes);
app.use('/api/v1/staff-privileges', staffPrivilegingRoutes);
app.use('/api/v1/master-data', masterDataHubRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/inventory', enterpriseInventoryRoutes);
app.use('/api/v1/satusehat', satusehatStudioRoutes);
app.use('/api/v1/command-center', commandCenterRoutes);
app.use('/api/v1', medicationKnowledgeRoutes);
app.use('/api/v1', cdssRoutes);
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
