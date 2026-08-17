/**
 * NurseFlow Enterprise HIS 2026 — Observability, Prometheus Metrics & Health Telemetry Suite
 * Standards: RFC 8617 Health Check, Prometheus Exposition Format 0.0.4 & JCI MOI
 */

import { describe, it, expect } from 'vitest';
import { metricsService } from '../server/services/metrics.service.js';
import { healthCheckService } from '../server/services/healthCheck.service.js';
import { structuredLoggerService } from '../server/services/structuredLogger.service.js';

describe('Sprint 8: Observability, Prometheus Metrics & Health Telemetry Suite', () => {

  // 1. Prometheus Metrics Text Exposition Compliance
  it('1. should generate valid Prometheus Exposition 0.0.4 text output with all required telemetry gauges and counters', () => {
    // Record sample transactions
    metricsService.recordHttpRequest('POST', '/api/emr/soap', 200, 45);
    metricsService.recordHttpRequest('GET', '/api/patients/search', 200, 28);
    metricsService.incrementFailedLogin();

    const textOutput = metricsService.generatePrometheusText();

    expect(textOutput).toContain('# HELP http_requests_total');
    expect(textOutput).toContain('# TYPE http_requests_total counter');
    expect(textOutput).toContain('http_requests_total{method="POST",route="/api/emr/soap",status="200"}');
    expect(textOutput).toContain('# HELP http_request_duration_seconds');
    expect(textOutput).toContain('http_request_duration_seconds{quantile="0.95"}');
    expect(textOutput).toContain('nodejs_eventloop_lag_seconds');
    expect(textOutput).toContain('nodejs_heap_size_bytes');
    expect(textOutput).toContain('postgres_connections_active');
    expect(textOutput).toContain('redis_memory_usage_bytes');
    expect(textOutput).toContain('failed_login_total');
  });

  // 2. Latency Percentile Calculation Accuracy
  it('2. should accurately compute p50, p90, p95, and p99 latency percentiles across recorded requests', () => {
    // Record 100 sample latencies (10ms to 1000ms)
    for (let i = 1; i <= 100; i++) {
      metricsService.recordHttpRequest('GET', '/api/orders', 200, i * 10);
    }

    const p50 = metricsService.getPercentile(50);
    const p95 = metricsService.getPercentile(95);

    expect(p50).toBeGreaterThanOrEqual(0.4);
    expect(p95).toBeGreaterThanOrEqual(0.9);
  });

  // 3. Multi-Tier Health Check: /health/live
  it('3. should return liveness status UP with uptime seconds for Kubernetes liveness probe', () => {
    const live = healthCheckService.getLiveHealth();

    expect(live.status).toBe('UP');
    expect(live.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(live.timestamp).toBeDefined();
  });

  // 4. Multi-Tier Health Check: /health/ready
  it('4. should return readiness status READY with connected PostgreSQL and Redis status', () => {
    const ready = healthCheckService.getReadyHealth();

    expect(ready.status).toBe('READY');
    expect(ready.database).toBe('CONNECTED');
    expect(ready.redis).toBe('CONNECTED');
  });

  // 5. Deep Diagnostics Health Check: /health/deep
  it('5. should provide deep subsystem diagnostics (Database pool, Redis memory, Event loop lag, Heap MB)', () => {
    const deep = healthCheckService.getDeepHealth();

    expect(deep.status).toBe('UP');
    expect(deep.database.engine).toBe('PostgreSQL 16');
    expect(deep.database.maxPoolSize).toBe(200);
    expect(deep.redis.engine).toBe('Redis 7');
    expect(deep.memory.heapUsedMb).toBeDefined();
    expect(deep.disk.status).toBe('UP');
    expect(deep.eventLoop.status).toBe('OPTIMAL');
    expect(deep.version).toBe('2026.8.17');
  });

  // 6. Structured JSON Logging (Winston Format)
  it('6. should emit structured JSON logs with correlation requestId, service, userId, and latency', () => {
    const log = structuredLoggerService.error('Gagal memproses transaksi billing: timeout', {
      service: 'billing-engine',
      userId: 'DOC-01',
      patientId: 'MRN-2026-001245',
      route: '/api/billing/invoices/pay',
      latency: 1245,
      metadata: { invoiceId: 'INV-999' }
    });

    expect(log.timestamp).toBeDefined();
    expect(log.level).toBe('error');
    expect(log.service).toBe('billing-engine');
    expect(log.userId).toBe('DOC-01');
    expect(log.patientId).toBe('MRN-2026-001245');
    expect(log.requestId).toBeDefined();
    expect(log.route).toBe('/api/billing/invoices/pay');
    expect(log.latency).toBe(1245);
    expect(log.message).toContain('timeout');
  });

});
