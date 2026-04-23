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
        "on-tertiary-container": "#ffb99c",
        "on-tertiary-fixed": "#360f00",
        "on-error": "#ffffff",
        "inverse-surface": "#2e3037",
        "surface-container-highest": "#e1e2ea",
        "surface-container-high": "#e7e7f0",
        "on-surface-variant": "#424752",
        "surface": "#f9f9ff",
        "on-primary-container": "#b1c9ff",
        "primary": "#003b82",
        "inverse-on-surface": "#f0f0f9",
        "on-secondary": "#ffffff",
        "inverse-primary": "#adc6ff",
        "outline-variant": "#c2c6d4",
        "surface-variant": "#e1e2ea",
        "on-primary": "#ffffff",
        "surface-dim": "#d9d9e2",
        "on-tertiary": "#ffffff",
        "on-background": "#191b21",
        "primary-fixed": "#d8e2ff",
        "secondary-fixed-dim": "#88d5c2",
        "surface-container": "#ededf6",
        "primary-container": "#0051ae",
        "error": "#ba1a1a",
        "secondary": "#126a5b",
        "surface-tint": "#1a5bb9",
        "surface-container-lowest": "#ffffff",
        "secondary-container": "#a1efdb",
        "on-surface": "#191b21",
        "on-secondary-fixed-variant": "#005144",
        "primary-fixed-dim": "#adc6ff",
        "tertiary-fixed-dim": "#ffb597",
        "on-primary-fixed": "#001a41",
        "outline": "#737784",
        "on-secondary-fixed": "#00201a",
        "on-secondary-container": "#1a6f5f",
        "on-tertiary-fixed-variant": "#7d2d00",
        "tertiary-fixed": "#ffdbcd",
        "tertiary-container": "#933702",
        "surface-container-low": "#f3f3fb",
        "tertiary": "#6e2600",
        "secondary-fixed": "#a4f1de",
        "on-primary-fixed-variant": "#004494",
        "on-error-container": "#93000a",
        "background": "#f9f9ff",
        "surface-bright": "#f9f9ff",
        "error-container": "#ffdad6"
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
  ],
}
