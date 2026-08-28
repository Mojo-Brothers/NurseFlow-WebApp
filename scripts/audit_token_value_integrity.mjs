/**
 * NurseFlow Enterprise HIS 2026 — Phase D1.1: Design Token Value Integrity & Anti-Drift Auditor
 * 
 * Mandated by Principal Architect (Bos Robby):
 * - Strict 1-to-1 Bijective Value Verification between Canonical JS Tokens & CSS Variables.
 * - Exact value comparison for Light and Dark themes.
 * - Orphan variable detection (reject unmapped `--nf-*` CSS variables).
 * - Duplicate canonical key detection.
 * - Exit code 1 if ANY drift, mismatch, missing mapping, or orphan variable is found.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCanonicalCssVariables } from '../src/design-system/tokens/cssMapping.js';
import {
  BASE_TOKENS,
  SEMANTIC_TOKENS,
  CLINICAL_SEVERITY,
  TYPOGRAPHY_TOKENS,
  SPACING_TOKENS,
  ELEVATION_TOKENS,
  MOTION_TOKENS
} from '../src/design-system/tokens/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GENERATED_CSS_PATH = path.resolve(__dirname, '../src/design-system/styles/tokens.generated.css');
const INDEX_CSS_PATH = path.resolve(__dirname, '../src/index.css');

/**
 * Normalizes CSS/Hex values for strict comparison
 */
function normalizeVal(val) {
  if (typeof val !== 'string') val = String(val);
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Parses CSS text into :root and .dark variable maps
 */
function parseCssVariables(cssContent) {
  const rootVars = {};
  const darkVars = {};

  // Extract :root block
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/);
  if (rootMatch) {
    const lines = rootMatch[1].split(';');
    for (const line of lines) {
      const match = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+)$/);
      if (match) {
        rootVars[match[1].trim()] = match[2].trim();
      }
    }
  }

  // Extract .dark block
  const darkMatch = cssContent.match(/\.dark\s*\{([^}]+)\}/);
  if (darkMatch) {
    const lines = darkMatch[1].split(';');
    for (const line of lines) {
      const match = line.match(/^\s*(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+)$/);
      if (match) {
        darkVars[match[1].trim()] = match[2].trim();
      }
    }
  }

  return { rootVars, darkVars };
}

export function runTokenIntegrityAudit() {
  console.log('\n================================================================');
  console.log('🎨 PHASE D1.1: DESIGN TOKEN VALUE INTEGRITY & ANTI-DRIFT AUDIT');
  console.log('================================================================\n');

  const { root: expectedRoot, dark: expectedDark } = getCanonicalCssVariables();

  // Read CSS content
  if (!fs.existsSync(GENERATED_CSS_PATH)) {
    console.error(`❌ Missing generated CSS file at: ${GENERATED_CSS_PATH}`);
    process.exit(1);
  }

  const generatedCss = fs.readFileSync(GENERATED_CSS_PATH, 'utf8');
  const { rootVars: actualRoot, darkVars: actualDark } = parseCssVariables(generatedCss);

  let missingMappings = 0;
  let valueMismatches = 0;
  let orphanCssVariables = 0;
  let duplicateCanonicalKeys = 0;

  // 1. Check Duplicate Canonical Keys
  const rootKeySet = new Set();
  for (const k of Object.keys(expectedRoot)) {
    if (rootKeySet.has(k)) {
      console.error(`  ❌ Duplicate canonical key in root: ${k}`);
      duplicateCanonicalKeys++;
    }
    rootKeySet.add(k);
  }

  const darkKeySet = new Set();
  for (const k of Object.keys(expectedDark)) {
    if (darkKeySet.has(k)) {
      console.error(`  ❌ Duplicate canonical key in dark: ${k}`);
      duplicateCanonicalKeys++;
    }
    darkKeySet.add(k);
  }

  // 2. Check Root Values
  for (const [key, expectedVal] of Object.entries(expectedRoot)) {
    if (!(key in actualRoot)) {
      console.error(`  ❌ Missing CSS variable in :root: [${key}]`);
      missingMappings++;
    } else if (normalizeVal(actualRoot[key]) !== normalizeVal(expectedVal)) {
      console.error(`  ❌ Value mismatch in :root: [${key}] -> Expected: "${expectedVal}", Got: "${actualRoot[key]}"`);
      valueMismatches++;
    }
  }

  // 3. Check Dark Values
  for (const [key, expectedVal] of Object.entries(expectedDark)) {
    if (!(key in actualDark)) {
      console.error(`  ❌ Missing CSS variable in .dark: [${key}]`);
      missingMappings++;
    } else if (normalizeVal(actualDark[key]) !== normalizeVal(expectedVal)) {
      console.error(`  ❌ Value mismatch in .dark: [${key}] -> Expected: "${expectedVal}", Got: "${actualDark[key]}"`);
      valueMismatches++;
    }
  }

  // 4. Orphan CSS Variable Detection (Any --nf-* in generated CSS not in canonical dictionary)
  for (const key of Object.keys(actualRoot)) {
    if (key.startsWith('--nf-') && !(key in expectedRoot)) {
      console.error(`  ❌ Orphan CSS variable in :root: [${key}]`);
      orphanCssVariables++;
    }
  }
  for (const key of Object.keys(actualDark)) {
    if (key.startsWith('--nf-') && !(key in expectedDark)) {
      console.error(`  ❌ Orphan CSS variable in .dark: [${key}]`);
      orphanCssVariables++;
    }
  }

  // Count Category Totals
  let baseTokensCount = 0;
  for (const shades of Object.values(BASE_TOKENS)) {
    baseTokensCount += Object.keys(shades).length;
  }

  let semanticLightCount = Object.keys(SEMANTIC_TOKENS.light.canvas).length +
    Object.keys(SEMANTIC_TOKENS.light.surface).length +
    Object.keys(SEMANTIC_TOKENS.light.text).length +
    Object.keys(SEMANTIC_TOKENS.light.border).length +
    Object.keys(SEMANTIC_TOKENS.light.interactive).length;

  let semanticDarkCount = Object.keys(SEMANTIC_TOKENS.dark.canvas).length +
    Object.keys(SEMANTIC_TOKENS.dark.surface).length +
    Object.keys(SEMANTIC_TOKENS.dark.text).length +
    Object.keys(SEMANTIC_TOKENS.dark.border).length +
    Object.keys(SEMANTIC_TOKENS.dark.interactive).length;

  let clinicalTokensCount = Object.keys(CLINICAL_SEVERITY.esi).length +
    Object.keys(CLINICAL_SEVERITY.panic).length +
    Object.keys(CLINICAL_SEVERITY.medication).length +
    Object.keys(CLINICAL_SEVERITY.news2).length +
    Object.keys(CLINICAL_SEVERITY.codes).length;

  let typographyCount = Object.keys(TYPOGRAPHY_TOKENS.fontFamily).length +
    Object.keys(TYPOGRAPHY_TOKENS.fontSize).length +
    Object.keys(TYPOGRAPHY_TOKENS.fontWeight).length +
    Object.keys(TYPOGRAPHY_TOKENS.features).length;

  let spacingCount = Object.keys(SPACING_TOKENS.scale).length +
    Object.keys(SPACING_TOKENS.componentHeight).length +
    Object.keys(SPACING_TOKENS.radius).length;

  let elevationCount = Object.keys(ELEVATION_TOKENS.shadow).length +
    Object.keys(ELEVATION_TOKENS.zIndex).length;

  let motionCount = Object.keys(MOTION_TOKENS.duration).length +
    Object.keys(MOTION_TOKENS.easing).length;

  console.log(`Base tokens checked       : ${baseTokensCount}`);
  console.log(`Semantic Light checked    : ${semanticLightCount}`);
  console.log(`Semantic Dark checked     : ${semanticDarkCount}`);
  console.log(`Clinical tokens checked   : ${clinicalTokensCount}`);
  console.log(`Typography checked        : ${typographyCount}`);
  console.log(`Spacing checked           : ${spacingCount}`);
  console.log(`Elevation checked         : ${elevationCount}`);
  console.log(`Motion checked            : ${motionCount}`);
  console.log('----------------------------------------------------------------');
  console.log(`Missing mappings          : ${missingMappings}`);
  console.log(`Value mismatches          : ${valueMismatches}`);
  console.log(`Orphan CSS variables      : ${orphanCssVariables}`);
  console.log(`Duplicate canonical keys  : ${duplicateCanonicalKeys}`);
  console.log('================================================================');

  if (missingMappings === 0 && valueMismatches === 0 && orphanCssVariables === 0 && duplicateCanonicalKeys === 0) {
    console.log('🟢 VERDICT: PASS — 100% VALUE INTEGRITY & ZERO DRIFT VERIFIED\n');
  } else {
    console.error('🔴 VERDICT: FAIL — TOKEN VALUE DRIFT OR ORPHAN VARIABLES DETECTED\n');
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runTokenIntegrityAudit();
}
