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
        /* Core Branding - Rich Deep Oceanic (Premium EHIS 2026) */
        "primary": "var(--primary)",
        "on-primary": "var(--on-primary)",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",
        "secondary": "var(--secondary)",
        "on-secondary": "var(--on-secondary)",
        "secondary-container": "var(--secondary-container)",
        "on-secondary-container": "var(--on-secondary-container)",
        "tertiary": "var(--tertiary)",
        "on-tertiary": "var(--on-tertiary)",
        "tertiary-container": "var(--tertiary-container)",
        "on-tertiary-container": "var(--on-tertiary-container)",
        
        /* Clinical Status - Anti-Collapse Signaling */
        "success": "var(--status-success, #059669)",
        "warning": "var(--status-warning, #ea580c)",
        "warning-container": "var(--status-warning-container, #ffedd5)",
        "info": "var(--status-info, #2563eb)",
        "info-container": "var(--status-info-container, #dbeafe)",
        "error": "var(--error, #dc2626)",
        "on-error": "var(--on-error, #ffffff)",
        "error-container": "var(--error-container, #fee2e2)",
        "on-error-container": "var(--on-error-container, #991b1b)",

        /* Surfaces & Layout (Glassmorphism & Crispness) */
        "surface": "var(--surface)",
        "on-surface": "var(--on-surface)",
        "surface-variant": "var(--surface-variant)",
        "on-surface-variant": "var(--on-surface-variant)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "background": "var(--background)",
        "on-background": "var(--on-background)",
        "outline": "var(--outline)",
        "outline-variant": "var(--outline-variant)",
      },
      borderRadius: {
        "none": "0",
        "sm": "0.125rem",
        "DEFAULT": "0.375rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "full": "9999px"
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'premium-soft': '0 4px 20px -2px rgba(0, 0, 0, 0.03), 0 0 3px rgba(0,0,0,0.01)',
        'premium-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.06), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
        'premium-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'glow-primary': '0 0 20px rgba(1, 92, 128, 0.25)', 
        'glow-error': '0 0 25px rgba(220, 38, 38, 0.4)',
      },
      animation: {
        'slide-up-fade': 'slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down-fade': 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-alert': 'pulseAlert 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUpFade: {
          '0%': { opacity: 0, transform: 'translateY(15px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideDownFade: {
          '0%': { opacity: 0, transform: 'translateY(-15px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.85 },
        },
        pulseAlert: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)' },
          '50%': { boxShadow: '0 0 0 20px rgba(220, 38, 38, 0.15)' },
        },
      },
      fontFamily: {
        "sans": ["Inter", "system-ui", "sans-serif"],
        "headline": ["Outfit", "Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "Roboto Mono", "monospace"]
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '24px',
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
}
