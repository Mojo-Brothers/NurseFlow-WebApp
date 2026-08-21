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
  content = content.replace(/'PENDING_PUBLISH'/g, "'(?:PENDING|PENDING_PUBLISH)'");
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed test mock regex in', file);
}
