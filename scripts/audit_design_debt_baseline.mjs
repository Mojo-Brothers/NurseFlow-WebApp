/**
 * NurseFlow Enterprise HIS 2026 — Phase D1.2: Legacy Design Debt Discovery Auditor
 * 
 * Mandated by Principal Architect (Bos Robby):
 * - Empirical Machine-Discovered Baseline of Hardcoded Design Values across src/
 * - Measures: Colors, Spacing, Typography, Radius, Elevation
 * - Establishes Point 0 for measurable refactoring reduction in Phase D2–D6.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');
const REPORT_JSON_PATH = path.resolve(__dirname, '../docs/design_debt_baseline_2026.json');

// Files and folders excluded from debt scan (Canonical Design System itself, generated files, archives)
const EXCLUDED_PATTERNS = [
  /src[\\/]design-system/,
  /src[\\/]archive/,
  /node_modules/,
  /\.test\.(js|jsx)$/,
  /setupTests\.(js|jsx)$/
];

function getAllFiles(dir, exts = ['.jsx', '.js', '.css']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const isExcluded = EXCLUDED_PATTERNS.some(p => p.test(fullPath));
    if (isExcluded) continue;

    if (entry.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

export function scanDesignDebt() {
  const files = getAllFiles(SRC_DIR);

  let totalHardcodedColors = 0;
  let totalHardcodedSpacing = 0;
  let totalHardcodedTypography = 0;
  let totalHardcodedRadius = 0;
  let totalHardcodedElevation = 0;

  const fileDebtMap = [];

  // Patterns
  const colorHexPattern = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
  const colorRgbPattern = /(?:rgb|rgba|hsl|hsla)\(\s*\d+[^)]*\)/g;
  const spacingPattern = /(?:padding|margin|gap|top|bottom|left|right)\s*:\s*['"]?\d+(?:\.\d+)?px|(?:\bp|\bm|\bgap|top|bottom|left|right)-\[\d+(?:\.\d+)?px\]/g;
  const typographyPattern = /(?:font-size|fontSize)\s*:\s*['"]?\d+(?:\.\d+)?px|text-\[\d+(?:\.\d+)?px\]|(?:line-height|lineHeight)\s*:\s*['"]?\d+(?:\.\d+)?px|leading-\[\d+(?:\.\d+)?px\]/g;
  const radiusPattern = /(?:border-radius|borderRadius)\s*:\s*['"]?\d+(?:\.\d+)?px|rounded-\[\d+(?:\.\d+)?px\]/g;
  const elevationPattern = /(?:z-index|zIndex)\s*:\s*['"]?\d+|z-\[\d+\]|(?:box-shadow|boxShadow)\s*:\s*['"]?(?!none|inherit|initial|var\(--)[0-9a-zA-Z\s(),.#-]+['"]?/g;

  // Known Canonical Metrics for Canonical Literal Classification
  const CANONICAL_PX_TYPOGRAPHY = new Set(['11px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px']);
  const CANONICAL_PX_SPACING = new Set(['0px', '1px', '2px', '4px', '6px', '8px', '10px', '12px', '16px', '20px', '24px', '32px', '40px', '48px', '64px']);
  const CANONICAL_PX_RADIUS = new Set(['0px', '2px', '4px', '6px', '8px', '12px', '9999px']);

  let nonCanonicalDebt = 0;
  let canonicalLiteralDebt = 0;

  for (const filePath of files) {
    const relPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Filter out comments from content to avoid false positive counting in comments
    const strippedContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

    const colorsMatches = (strippedContent.match(colorHexPattern) || []).concat(strippedContent.match(colorRgbPattern) || []);
    const spacingMatches = strippedContent.match(spacingPattern) || [];
    const typographyMatches = strippedContent.match(typographyPattern) || [];
    const radiusMatches = strippedContent.match(radiusPattern) || [];
    const elevationMatches = strippedContent.match(elevationPattern) || [];

    const colors = colorsMatches.length;
    const spacing = spacingMatches.length;
    const typography = typographyMatches.length;
    const radius = radiusMatches.length;
    const elevation = elevationMatches.length;

    const fileDebt = colors + spacing + typography + radius + elevation;

    totalHardcodedColors += colors;
    totalHardcodedSpacing += spacing;
    totalHardcodedTypography += typography;
    totalHardcodedRadius += radius;
    totalHardcodedElevation += elevation;

    // Classify canonical literal vs non-canonical
    for (const m of typographyMatches) {
      const pxMatch = m.match(/\d+px/);
      if (pxMatch && CANONICAL_PX_TYPOGRAPHY.has(pxMatch[0])) {
        canonicalLiteralDebt++;
      } else {
        nonCanonicalDebt++;
      }
    }
    for (const m of spacingMatches) {
      const pxMatch = m.match(/\d+px/);
      if (pxMatch && CANONICAL_PX_SPACING.has(pxMatch[0])) {
        canonicalLiteralDebt++;
      } else {
        nonCanonicalDebt++;
      }
    }
    for (const m of radiusMatches) {
      const pxMatch = m.match(/\d+px/);
      if (pxMatch && CANONICAL_PX_RADIUS.has(pxMatch[0])) {
        canonicalLiteralDebt++;
      } else {
        nonCanonicalDebt++;
      }
    }
    nonCanonicalDebt += colors + elevation;

    if (fileDebt > 0) {
      fileDebtMap.push({
        file: relPath,
        colors,
        spacing,
        typography,
        radius,
        elevation,
        total: fileDebt
      });
    }
  }

  // Sort files by total debt descending
  fileDebtMap.sort((a, b) => b.total - a.total);

  const totalDebtPoints = totalHardcodedColors + totalHardcodedSpacing + totalHardcodedTypography + totalHardcodedRadius + totalHardcodedElevation;

  console.log('\n================================================================');
  console.log('📊 PHASE D1.2.1: LEGACY DESIGN DEBT DISCOVERY AUDIT BASELINE');
  console.log('================================================================\n');
  console.log(`Source Files Scanned        : ${files.length}`);
  console.log(`Files with Design Debt      : ${fileDebtMap.length}`);
  console.log('----------------------------------------------------------------');
  console.log(`🔴 Hardcoded Non-Canonical   : ${nonCanonicalDebt} pts (Active Burndown Target)`);
  console.log(`🟡 Canonical Literal Match   : ${canonicalLiteralDebt} pts (Identical to Token Scale)`);
  console.log('----------------------------------------------------------------');
  console.log(`Hardcoded Colors            : ${totalHardcodedColors}`);
  console.log(`Hardcoded Spacing           : ${totalHardcodedSpacing}`);
  console.log(`Hardcoded Typography        : ${totalHardcodedTypography}`);
  console.log(`Hardcoded Radius            : ${totalHardcodedRadius}`);
  console.log(`Hardcoded Elevation         : ${totalHardcodedElevation}`);
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL DESIGN DEBT POINTS    : ${totalDebtPoints}`);
  console.log('================================================================\n');

  console.log('📋 TOP 10 HIGHEST DESIGN DEBT MODULES/FILES:');
  const top10 = fileDebtMap.slice(0, 10);
  top10.forEach((f, idx) => {
    console.log(`  ${idx + 1}. [${f.total} pts] ${f.file} (Colors: ${f.colors}, Spacing: ${f.spacing}, Typography: ${f.typography}, Radius: ${f.radius}, Elevation: ${f.elevation})`);
  });
  console.log('================================================================\n');

  const baselineData = {
    timestamp: new Date().toISOString(),
    filesScanned: files.length,
    filesWithDebt: fileDebtMap.length,
    classification: {
      nonCanonicalDebt,
      canonicalLiteralDebt
    },
    metrics: {
      hardcodedColors: totalHardcodedColors,
      hardcodedSpacing: totalHardcodedSpacing,
      hardcodedTypography: totalHardcodedTypography,
      hardcodedRadius: totalHardcodedRadius,
      hardcodedElevation: totalHardcodedElevation,
      totalDebtPoints
    },
    top10DebtFiles: top10
  };

  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(baselineData, null, 2), 'utf8');
  console.log(`💾 Design Debt Baseline saved to: docs/design_debt_baseline_2026.json\n`);

  return baselineData;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scanDesignDebt();
}
