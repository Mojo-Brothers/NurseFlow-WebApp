import fs from 'fs';

const files = [
  './server/services/perioperativeClosedLoop.service.js',
  './server/services/patientFinancialAndRevenueCycle.service.js',
  './server/services/clinicalCodingAndCasemix.service.js',
  './server/services/careCoordinationAndTimeline.service.js'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/'PENDING_PUBLISH'/g, "'PENDING'");
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated outbox status in', file);
}
