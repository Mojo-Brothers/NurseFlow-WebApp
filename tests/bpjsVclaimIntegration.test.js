import { describe, it, expect } from 'vitest';
import { bpjsVclaimClient } from '../server/integrations/bpjsVclaimClient.js';

describe('BPJS Kesehatan VClaim 2.0 Integration Client', () => {
  it('should generate valid authentication headers including HMAC-SHA256 signature and timestamp', () => {
    const headers = bpjsVclaimClient.generateAuthHeaders('12345', 'secret2026', 'user2026');

    expect(headers['X-cons-id']).toBe('12345');
    expect(headers['X-timestamp']).toBeDefined();
    expect(headers['X-signature']).toBeDefined();
    expect(headers['user_key']).toBe('user2026');
  });

  it('should format SEP creation payload matching BPJS Trust Mark standards', () => {
    const payload = bpjsVclaimClient.buildSepPayload({
      noKartu: '0001234567891',
      noMr: 'MRN-2026-001001',
      diagAwal: 'I10',
      dpjpLayan: '32145'
    });

    expect(payload.request.t_sep).toBeDefined();
    expect(payload.request.t_sep.noKartu).toBe('0001234567891');
    expect(payload.request.t_sep.diagAwal).toBe('I10');
  });
});
