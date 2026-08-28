/**
 * NurseFlow Enterprise HIS 2026 — Phase D2.2.0: Selection Primitive Discovery & Contract Inventory
 * 
 * Mandated by Principal Architect (Bos Robby):
 * - Systematic Machine Discovery of all Selection & Data Entry patterns across src/
 * - Discovers: <select>, Custom Comboboxes, Checkboxes, Radios, Searchable Pickers
 * - Produces Classification Matrix to ground D2.2 components on real codebase usage.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, '../src');

const EXCLUDED_PATTERNS = [
  /src[\\/]design-system[\\/]tokens/,
  /src[\\/]design-system[\\/]styles/,
  /src[\\/]archive/,
  /node_modules/,
  /\.test\.(js|jsx)$/
];

function getAllFiles(dir, exts = ['.jsx', '.js']) {
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

export function runSelectionInventory() {
  const files = getAllFiles(SRC_DIR);

  let nativeSelectCount = 0;
  let customComboboxCount = 0;
  let checkboxCount = 0;
  let radioCount = 0;
  let searchableLookupCount = 0;

  const selectFiles = [];
  const checkboxFiles = [];
  const radioFiles = [];

  const nativeSelectRegex = /<select\b/g;
  const customComboboxRegex = /<(?:Select|CustomSelect|Combobox|SelectTrigger|RadixSelect)\b/g;
  const checkboxRegex = /<input[^>]*type=['"]checkbox['"]|<Checkbox\b/g;
  const radioRegex = /<input[^>]*type=['"]radio['"]|<RadioGroup\b|<Radio\b/g;
  const searchableRegex = /(?:searchQuery|searchTerm|filter\([^)]*toLowerCase|icdSearch|medicationSearch)/g;

  for (const filePath of files) {
    const relPath = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    const nativeSelects = (content.match(nativeSelectRegex) || []).length;
    const customSelects = (content.match(customComboboxRegex) || []).length;
    const checkboxes = (content.match(checkboxRegex) || []).length;
    const radios = (content.match(radioRegex) || []).length;
    const searchables = (content.match(searchableRegex) || []).length;

    nativeSelectCount += nativeSelects;
    customComboboxCount += customSelects;
    checkboxCount += checkboxes;
    radioCount += radios;
    searchableLookupCount += searchables;

    if (nativeSelects > 0 || customSelects > 0) {
      selectFiles.push({ file: relPath, native: nativeSelects, custom: customSelects });
    }
    if (checkboxes > 0) {
      checkboxFiles.push({ file: relPath, count: checkboxes });
    }
    if (radios > 0) {
      radioFiles.push({ file: relPath, count: radios });
    }
  }

  console.log('\n================================================================');
  console.log('🔍 PHASE D2.2.0: SELECTION & DATA ENTRY DISCOVERY INVENTORY');
  console.log('================================================================\n');
  console.log(`Source Files Scanned          : ${files.length}`);
  console.log('----------------------------------------------------------------');
  console.log(`Native <select> Instances     : ${nativeSelectCount} (in ${selectFiles.filter(f => f.native > 0).length} files)`);
  console.log(`Custom Select / Comboboxes    : ${customComboboxCount} (in ${selectFiles.filter(f => f.custom > 0).length} files)`);
  console.log(`Checkbox Elements             : ${checkboxCount} (in ${checkboxFiles.length} files)`);
  console.log(`Radio / RadioGroup Elements   : ${radioCount} (in ${radioFiles.length} files)`);
  console.log(`Searchable Clinical Lookups   : ${searchableLookupCount} instances`);
  console.log('================================================================\n');

  console.log('📊 SELECTION PRIMITIVE CLASSIFICATION MATRIX:');
  console.log('----------------------------------------------------------------');
  console.log('  1. ClinicalSelect:');
  console.log('     - Mode 1: Native Clean Mode (Gender, Ward, Status dropdowns)');
  console.log('     - Mode 2: Searchable Combobox Mode (ICD-10, E-Prescription Medicines)');
  console.log('  2. ClinicalCheckbox:');
  console.log('     - Mode 1: Standard Checkbox (Form boolean consent)');
  console.log('     - Mode 2: Indeterminate Tree Checkbox (CPOE order bundle, Surgery Checklist)');
  console.log('  3. ClinicalRadio:');
  console.log('     - Mode 1: Standard Radio Group (Form single-choice)');
  console.log('     - Mode 2: Segmented Clinical Card (Triage ESI 1-5, Pain Scale)');
  console.log('================================================================\n');

  return {
    filesScanned: files.length,
    nativeSelectCount,
    customComboboxCount,
    checkboxCount,
    radioCount,
    searchableLookupCount
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSelectionInventory();
}
