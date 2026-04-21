import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
      sourceType: 'commonjs',
    },
    rules: {
      'no-undef': 'off', // CommonJS 'exports'/'require' can sometimes trip this in flat config
    }
  },
  // 🛡️ ARCHITECTURAL IMMUNITY: Design Law Zoning
  {
    files: ['src/modules/triage/**/*.{js,jsx}', 'src/modules/billing/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: '../../../components/ui/PresentationCard.jsx',
          message: '❌ DESIGN VIOLATION: Presentation components are FORBIDDEN in operational zones. Use <ClinicalCard /> instead.'
        }],
        patterns: [{
          group: ['**/PresentationCard', '**/card-ambient', '**/card-presentation'],
          message: '❌ DESIGN VIOLATION: Avoid aesthetic contamination in clinical modules.'
        }]
      }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: '❌ SECURITY VIOLATION: dangerouslySetInnerHTML is forbidden in NurseFlow clinical modules.'
        }
      ]
    }
  }
])
