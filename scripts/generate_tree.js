import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.gemini',
  '.system_generated',
  'coverage'
]);

function buildTree(dir, prefix = '') {
  let output = '';
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const filtered = entries.filter(e => !IGNORE_DIRS.has(e.name));

  filtered.forEach((entry, index) => {
    const isLast = index === filtered.length - 1;
    const pointer = isLast ? '└── ' : '├── ';
    output += `${prefix}${pointer}${entry.name}\n`;

    if (entry.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      output += buildTree(path.join(dir, entry.name), nextPrefix);
    }
  });

  return output;
}

const tree = `NURSEFLOW ENTERPRISE HIS 2026 — REPOSITORY STRUCTURE\n=======================================================\nRoot: ${rootDir}\nGenerated: ${new Date().toISOString()}\n\n` + buildTree(rootDir);

fs.writeFileSync(path.join(rootDir, 'tree.txt'), tree, 'utf8');
console.log('Successfully generated tree.txt');
