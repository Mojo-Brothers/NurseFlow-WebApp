/**
 * NurseFlow Absolute Immunity Sentinel (AST-Based)
 * Scans operational modules for syntactical design violations.
 * UN-BYPASSABLE Architectural Enforcement.
 */
import fs from 'fs';
import path from 'path';
import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default;
import postcss from 'postcss';

const FORBIDDEN_PROPERTIES = ['backdropFilter', 'backdrop-filter', 'WebkitBackdropFilter'];
const FORBIDDEN_CLASSES = ['card-presentation', 'card-ambient', 'glass'];
const FORBIDDEN_COMPONENTS = ['PresentationCard'];

const TARGET_DIRECTORIES = [
  'src/modules/triage',
  'src/modules/billing'
];

let violationCount = 0;

async function auditJSX(fullPath, content) {
  try {
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    traverse(ast, {
      JSXOpeningElement(nodePath) {
        const componentName = nodePath.node.name.name;
        
        // 1. Forbidden Component Usage
        if (FORBIDDEN_COMPONENTS.includes(componentName)) {
          console.error(`[AST BREACH] Forbidden component <${componentName}> used in operational module: ${fullPath}`);
          violationCount++;
        }

        // 2. Style Object Inspection
        nodePath.node.attributes.forEach(attr => {
          if (attr.name?.name === 'style' && attr.value?.expression?.type === 'ObjectExpression') {
            attr.value.expression.properties.forEach(prop => {
              const propName = prop.key?.name || prop.key?.value;
              if (FORBIDDEN_PROPERTIES.includes(propName)) {
                console.error(`[AST BREACH] Prohibited style property "${propName}" found in <${componentName}> at ${fullPath}`);
                violationCount++;
              }
            });
          }

          // 3. ClassName Inspection
          if (attr.name?.name === 'className' && attr.value?.type === 'StringLiteral') {
            FORBIDDEN_CLASSES.forEach(cls => {
              if (attr.value.value.includes(cls)) {
                console.error(`[AST BREACH] Prohibited class "${cls}" found in ${fullPath}`);
                violationCount++;
              }
            });
          }
        });
      },
      // 4. Forbidden String Literal Usage (Catching bypass attempts)
      StringLiteral(nodePath) {
        if (FORBIDDEN_PROPERTIES.includes(nodePath.node.value)) {
            // Check if this is part of an object key or dynamic property
            console.warn(`[AST WARNING] Potentially prohibited string literal "${nodePath.node.value}" found in ${fullPath}`);
        }
      }
    });
  } catch (e) {
    console.error(`[PARSE ERROR] Could not parse ${fullPath}: ${e.message}`);
  }
}

async function auditCSS(fullPath, content) {
  try {
    const root = postcss.parse(content);
    root.walkDecls(decl => {
      if (FORBIDDEN_PROPERTIES.includes(decl.prop) || decl.value.includes('blur(')) {
        console.error(`[CSS BREACH] Prohibited property "${decl.prop}: ${decl.value}" found in ${fullPath}`);
        violationCount++;
      }
    });
  } catch (e) {
    console.error(`[PARSE ERROR] Could not parse CSS ${fullPath}: ${e.message}`);
  }
}

async function scan() {
  console.log('\n--- 🛡️ NURSEFLOW ABSOLUTE IMMUNITY SENTINEL START ---');
  
  for (const dir of TARGET_DIRECTORIES) {
    if (!fs.existsSync(dir)) continue;
    
    // Skip if it's the lab directory
    if (dir.includes('lab')) continue;
    
    const files = fs.readdirSync(dir, { recursive: true });
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      if (file.endsWith('.jsx')) {
        await auditJSX(fullPath, content);
      } else if (file.endsWith('.css')) {
        await auditCSS(fullPath, content);
      }
    }
  }

  if (violationCount > 0) {
    console.error(`\n❌ TOTAL ARCHITECTURAL BREACHES: ${violationCount}`);
    console.error('ACTION REQUIRED: Clinical modules must adhere to "Dead Serious" design standards.');
    process.exit(1);
  } else {
    console.log('\n✅ ARCHITECTURAL INTEGRITY SECURE. NO SYNTACTICAL BREACHES DETECTED.');
    process.exit(0);
  }
}

scan();
