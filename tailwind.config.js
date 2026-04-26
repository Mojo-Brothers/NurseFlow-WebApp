/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Core Branding */
        "primary": "var(--primary)",
        "on-primary": "var(--on-primary)",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",
        "secondary": "var(--secondary, #126a5b)",
        "on-secondary": "var(--on-secondary, #ffffff)",
        "secondary-container": "var(--secondary-container, #a1efdb)",
        "on-secondary-container": "var(--on-secondary-container, #1a6f5f)",
        "tertiary": "var(--tertiary, #6e2600)",
        "on-tertiary": "var(--on-tertiary, #ffffff)",
        "tertiary-container": "var(--tertiary-container, #933702)",
        "on-tertiary-container": "var(--on-tertiary-container, #ffb99c)",
        
        /* Clinical Status - Anti-Collapse Signaling */
        "success": "var(--status-stable, #059669)",
        "warning": "var(--status-warning, #933702)",
        "warning-container": "var(--tertiary-container, #933702)",
        "info": "var(--status-info, #2563eb)",
        "error": "var(--error, #ba1a1a)",
        "on-error": "var(--on-error, #ffffff)",
        "error-container": "var(--error-container, #ffdad6)",
        "on-error-container": "var(--on-error-container, #93000a)",

        /* Surfaces & Layout */
        "surface": "var(--surface)",
        "on-surface": "var(--on-surface)",
        "surface-variant": "var(--surface-variant)",
        "on-surface-variant": "var(--on-surface-variant)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "surface-bright": "var(--surface-bright, #f9f9ff)",
        "surface-dim": "var(--surface-dim, #d9d9e2)",
        "background": "var(--background)",
        "on-background": "var(--on-background)",
        "outline": "var(--outline)",
        "outline-variant": "var(--outline-variant)",
        "inverse-surface": "var(--inverse-surface, #2e3037)",
        "inverse-on-surface": "var(--inverse-on-surface, #f0f0f9)",
        "inverse-primary": "var(--inverse-primary, #adc6ff)",
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        "headline": ["Manrope"],
        "display": ["Manrope"],
        "body": ["Public Sans"],
        "label": ["Public Sans"],
        "mono": ["Roboto Mono"]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
}
