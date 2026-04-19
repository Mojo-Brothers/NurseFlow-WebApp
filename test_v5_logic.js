/**
 * NurseFlow V5 Integration Test
 * Simulates a JCI Admission to verify Audit V5 schema
 */
import { createEncounter } from './src/modules/encounter/services/encounter.service.js';

async function testV5Encounter() {
  console.log("🚀 Testing HIS V5 Masterpiece Logic...");
  try {
    const id = await createEncounter({
      patientId: 'TEST_PATIENT_V5',
      encounterType: 'EMERGENCY',
      chiefComplaint: 'Architectural Verification - Test Run',
      admittingDoctor: 'Dr. Automated Architect',
      nurseInCharge: 'Nrs. System',
      ward: 'VIRTUAL_WARP',
      createdBy: 'antigravity@masterpiece.system'
    });
    
    console.log(`✅ Success! Encounter created with ID: ${id}`);
    console.log("👉 Now run 'node get_audit_logs.js' to see the V5 Audit fields!");
  } catch (err) {
    console.error("❌ V5 Test Failed:", err);
  }
}

testV5Encounter();
