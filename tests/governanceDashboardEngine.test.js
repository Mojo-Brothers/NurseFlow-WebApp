import { describe, it, expect } from 'vitest';
import { resolveConservativeStatus, GOVERNANCE_STATUSES } from '../src/core/governance/governanceModel.js';
import { governanceScannerService } from '../server/services/governanceScanner.service.js';

describe('Governance Dashboard Engine & Reality Verification', () => {
  describe('Status Engine & Conservative Resolution', () => {
    it('should refute claims of implementation if physical execution/route mounting is missing', () => {
      const resolution = resolveConservativeStatus({
        claimStatus: 'IMPLEMENTED',
        actualExecution: false,
        testVerified: false
      });

      expect(resolution.status).toBe(GOVERNANCE_STATUSES.REFUTED);
      expect(resolution.flag).toBe('CONTRADICTION_DETECTED');
      expect(resolution.reason).toContain('physical execution or route mounting is absent');
    });

    it('should mark designed-only when architecture specification exists but physical implementation is absent', () => {
      const resolution = resolveConservativeStatus({
        claimStatus: 'DESIGNED',
        actualExecution: false,
        testVerified: false
      });

      expect(resolution.status).toBe(GOVERNANCE_STATUSES.DESIGNED_ONLY);
      expect(resolution.flag).toBe('DESIGNED_ONLY');
    });

    it('should mark implemented_unverified when code exists but empirical proof is absent', () => {
      const resolution = resolveConservativeStatus({
        claimStatus: 'IMPLEMENTED',
        actualExecution: true,
        testVerified: false
      });

      expect(resolution.status).toBe(GOVERNANCE_STATUSES.IMPLEMENTED_UNVERIFIED);
      expect(resolution.flag).toBe('UNVERIFIED');
    });

    it('should mark verified only when physical code exists and automated tests pass', () => {
      const resolution = resolveConservativeStatus({
        claimStatus: 'IMPLEMENTED',
        actualExecution: true,
        testVerified: true
      });

      expect(resolution.status).toBe(GOVERNANCE_STATUSES.VERIFIED);
      expect(resolution.flag).toBe('VERIFIED');
    });
  });

  describe('Dynamic Evidence Scanner (Zero Hardcoding)', () => {
    it('should dynamically scan and count routes and clinical authorization mounting across server/routes', async () => {
      const scan = await governanceScannerService.scanRepositoryReality();

      expect(scan.inventory.routeFilesCount).toBeGreaterThanOrEqual(27);
      expect(scan.inventory.totalEndpoints).toBeGreaterThanOrEqual(140);
      
      // Proves dynamically that clinical authorization is mounted on 0 routes, not hardcoded
      expect(scan.inventory.routesWithClinicalAuth).toBe(0);
      expect(scan.inventory.tier1RoutesCount).toBe(38);
    });

    it('should dynamically scan migrations in database/migrations', async () => {
      const scan = await governanceScannerService.scanRepositoryReality();

      expect(scan.inventory.migrationsCount).toBeGreaterThanOrEqual(76);
      expect(scan.inventory.liveDbStatus.zeroPolicyTablesCount).toBe(21);
      expect(scan.inventory.liveDbStatus.failOpenPoliciesCount).toBe(5);
    });

    it('should dynamically scan automated test suites in tests/', async () => {
      const scan = await governanceScannerService.scanRepositoryReality();

      expect(scan.inventory.testSuitesCount).toBeGreaterThanOrEqual(195);
      expect(scan.inventory.testCategories.security).toBeGreaterThan(0);
      expect(scan.inventory.testCategories.verticalSlice).toBeGreaterThan(0);
    });

    it('should detect reality-to-claim contradictions automatically', async () => {
      const scan = await governanceScannerService.scanRepositoryReality();

      expect(scan.contradictions.length).toBeGreaterThan(0);
      const authContradiction = scan.contradictions.find(c => c.affectedEntity === 'Authorization Foundation');
      expect(authContradiction).toBeDefined();
      expect(authContradiction.conservativeVerdict).toBe('NOT_ENFORCED');
    });

    it('should maintain security-first gate: Wave 1B must be on HOLD while foundation is NOT_READY', async () => {
      const scan = await governanceScannerService.scanRepositoryReality();

      expect(scan.project.securityStatus.foundation).toBe('NOT_READY');
      expect(scan.project.securityStatus.wave1bStatus).toBe('HOLD');
      expect(scan.project.securityStatus.productionChangesAllowed).toBe(false);
      expect(scan.project.overallHealth).toBe('CRITICAL_BLOCKER');
    });
  });
});
