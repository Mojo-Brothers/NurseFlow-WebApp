/**
 * NurseFlow Enterprise HIS 2026 — Medication Terminology Service Test Suite (Sprint 1)
 * Standards: SNOMED CT, RxNorm, ATC, KFA Kemenkes
 */

import { describe, it, expect } from 'vitest';
import { terminologyService } from '../server/services/terminologyService.service.js';

describe('Sprint 1: Medication Multi-Terminology Bridge & Search', () => {

  // 1. Search by generic keyword
  it('1. should search terminologies by generic drug name', async () => {
    const results = await terminologyService.searchTerminology({ query: 'Meropenem' });

    expect(results.length).toBeGreaterThanOrEqual(1);
    const snomed = results.find(t => t.terminologySystem === 'SNOMED_CT');
    expect(snomed).toBeDefined();
    expect(snomed.terminologyCode).toBe('372729009');
  });

  // 2. Search by SNOMED CT prefix
  it('2. should resolve terminology using SNOMED prefix query', async () => {
    const results = await terminologyService.searchTerminology({ query: 'SNOMED:372862008' });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].terminologyDisplay).toContain('Warfarin');
  });

  // 3. Search by RxNorm prefix
  it('3. should resolve terminology using RxNorm prefix query', async () => {
    const results = await terminologyService.searchTerminology({ query: 'RXNORM:11124' });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].medicationId).toBe('MED-001');
  });

  // 4. Search by KFA Kemenkes prefix
  it('4. should resolve terminology using KFA Kemenkes code', async () => {
    const results = await terminologyService.searchTerminology({ query: 'KFA:93001003' });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].terminologyDisplay).toContain('Meropenem Serbuk Injeksi');
  });

  // 5. Link new terminology to medication
  it('5. should link new terminology code to existing medication', async () => {
    const linked = await terminologyService.linkTerminologyToMedication({
      medicationId: 'MED-002', // Ceftriaxone
      terminologySystem: 'GTIN_BARCODE',
      terminologyCode: '08999876543210',
      terminologyDisplay: 'GTIN-14 Ceftriaxone 1g Injeksi'
    });

    expect(linked.id).toBeDefined();
    expect(linked.terminologySystem).toBe('GTIN_BARCODE');
    expect(linked.terminologyCode).toBe('08999876543210');
  });

});
