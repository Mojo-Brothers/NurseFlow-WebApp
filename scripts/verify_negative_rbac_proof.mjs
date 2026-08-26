import http from 'http';
import app from '../server/server.js';
import { jwtSecurityService } from '../src/core/security/jwtSecurity.service.js';
import { postgresPoolService } from '../server/db/postgresPool.js';

async function runNegativeRbacProof() {
  console.log('================================================================================');
  console.log('🛡️ GATE 0C-C: ZERO-TRUST 2-LAYER NEGATIVE RBAC & POSTGRESQL MUTATION PROOF');
  console.log('================================================================================\n');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const pool = postgresPoolService.getPool();

  const attackScenarios = [
    {
      name: 'Cashier attempts to intake Blood Bank donor unit',
      role: 'CASHIER',
      method: 'POST',
      url: `${baseUrl}/api/v1/blood-bank/units`,
      body: { unitNumber: 'MALICIOUS-UNIT-CASHIER-01', aboType: 'O', rhesusType: 'POSITIVE', volumeMl: 350 },
      dbCheck: async () => {
        const res = await pool.query('SELECT count(*)::int AS count FROM blood_donor_units WHERE unit_number = $1', ['MALICIOUS-UNIT-CASHIER-01']);
        return res.rows[0].count;
      }
    },
    {
      name: 'Nurse attempts to modify Hospital Spatial Master Data',
      role: 'NURSE',
      method: 'POST',
      url: `${baseUrl}/api/v1/master-data/wards`,
      body: { name: 'MALICIOUS_WARD_BY_NURSE', code: 'WARD-MAL-01', building: 'Building A' },
      dbCheck: async () => {
        const res = await pool.query('SELECT count(*)::int AS count FROM master_wards WHERE code = $1', ['WARD-MAL-01']);
        return res.rows[0].count;
      }
    },
    {
      name: 'Doctor attempts to settle Cashier Financial Deposit',
      role: 'DOCTOR',
      method: 'POST',
      url: `${baseUrl}/api/v1/patient-financial/deposits`,
      body: { encounterId: '00000000-0000-0000-0000-000000000001', amountIdr: 9999999, paymentMethod: 'CASH' },
      dbCheck: async () => {
        const res = await pool.query('SELECT count(*)::int AS count FROM patient_deposit_ledgers WHERE amount_idr = $1', [9999999]);
        return res.rows[0].count;
      }
    },
    {
      name: 'Pharmacist attempts to author Doctor SOAP Clinical Note',
      role: 'PHARMACIST',
      method: 'POST',
      url: `${baseUrl}/api/v1/clinical-notes/soap`,
      body: { encounterId: '00000000-0000-0000-0000-000000000001', noteType: 'SOAP_DOCTOR', subjective: 'Attacking SOAP' },
      dbCheck: async () => {
        const res = await pool.query('SELECT count(*)::int AS count FROM soap_notes WHERE subjective LIKE $1', ['%Attacking SOAP%']);
        return res.rows[0].count;
      }
    }
  ];


  let passed = 0;

  for (const sc of attackScenarios) {
    console.log(`📌 SCENARIO: ${sc.name}`);
    const pair = jwtSecurityService.issueTokenPair({
      userId: `ATTACKER-${sc.role}`,
      username: `malicious_${sc.role.toLowerCase()}`,
      role: sc.role
    });

    const response = await fetch(sc.url, {
      method: sc.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pair.accessToken}`
      },
      body: JSON.stringify(sc.body)
    });

    const body = await response.json().catch(() => ({}));
    const count = await sc.dbCheck();

    console.log(`   HTTP Status Code : ${response.status} (Expected: 403 Forbidden)`);
    console.log(`   Error Code       : ${body.error || 'N/A'}`);
    console.log(`   Database Mutation: ${count} rows written (Expected: 0)`);

    if (response.status === 403 && count === 0) {
      console.log(`   Result           : 🟢 PASS — Zero Trust Enforced & Database Untouched\n`);
      passed++;
    } else {
      console.log(`   Result           : ❌ FAIL\n`);
    }
  }

  console.log('================================================================================');
  console.log(`🏁 NEGATIVE RBAC PROOF COMPLETED: ${passed}/${attackScenarios.length} SCENARIOS 100% BLOCKED & VERIFIED`);
  console.log('================================================================================\n');

  server.close();
  await pool.end();
  process.exit(passed === attackScenarios.length ? 0 : 1);
}


runNegativeRbacProof().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
