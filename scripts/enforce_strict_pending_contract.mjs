import fs from 'fs';

const testFiles = [
  './tests/verticalSlice13PatientFinancialRevenueCycleDurability.test.js',
  './tests/verticalSlice12CasemixRegulatoryHardening.test.js',
  './tests/verticalSlice12ClinicalCodingCasemixDurability.test.js',
  './tests/verticalSlice11PerioperativeClinicalHardening.test.js',
  './tests/verticalSlice10CareCoordinationDurability.test.js',
  './tests/verticalSlice11PerioperativeClosedLoopDurability.test.js'
];

for (const file of testFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'(?:\?:PENDING\|PENDING_PUBLISH|PENDING_PUBLISH)'/g, "'PENDING'");
  content = content.replace(/\(\?:PENDING\|PENDING_PUBLISH\)/g, "PENDING");
  fs.writeFileSync(file, content, 'utf8');
  console.log('Enforced strict canonical PENDING in', file);
}
