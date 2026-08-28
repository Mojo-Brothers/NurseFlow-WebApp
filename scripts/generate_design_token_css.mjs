/**
 * NurseFlow Enterprise HIS 2026 — Canonical Design Token CSS Compiler
 * Compiles JavaScript Single Source of Truth (SSOT) Tokens into tokens.generated.css
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getCanonicalCssVariables } from '../src/design-system/tokens/cssMapping.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STYLES_DIR = path.resolve(__dirname, '../src/design-system/styles');
const OUTPUT_CSS_PATH = path.join(STYLES_DIR, 'tokens.generated.css');

export function generateTokenCss() {
  if (!fs.existsSync(STYLES_DIR)) {
    fs.mkdirSync(STYLES_DIR, { recursive: true });
  }

  const { root, dark } = getCanonicalCssVariables();

  let css = `/**\n * NurseFlow Enterprise HIS 2026 — Canonical Design Tokens (Generated)\n * AUTOMATICALLY GENERATED FROM JS TOKENS SSOT. DO NOT EDIT MANUALLY.\n */\n\n:root {\n`;

  for (const [key, val] of Object.entries(root)) {
    css += `  ${key}: ${val};\n`;
  }
  css += `}\n\n.dark {\n`;

  for (const [key, val] of Object.entries(dark)) {
    css += `  ${key}: ${val};\n`;
  }
  css += `}\n`;

  fs.writeFileSync(OUTPUT_CSS_PATH, css, 'utf8');
  console.log(`✅ Successfully generated canonical CSS tokens at: ${OUTPUT_CSS_PATH}`);
  return OUTPUT_CSS_PATH;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateTokenCss();
}
