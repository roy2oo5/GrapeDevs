/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary-container": "#fdfcff",
        "on-error": "#ffffff",
        "on-primary-fixed-variant": "#004b73",
        "primary-fixed": "#cce5ff",
        "on-secondary-container": "#5c647a",
        "on-primary-fixed": "#001d31",
        "on-surface-variant": "#3f4850",
        "secondary-container": "#dae2fd",
        "tertiary": "#006947",
        "tertiary-container": "#00855b",
        "primary": "#006194",
        "error": "#ba1a1a",
        "on-secondary-fixed-variant": "#3f465c",
        "secondary-fixed-dim": "#bec6e0",
        "surface-container": "#eceef0",
        "background": "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface": "#f7f9fb",
        "on-secondary": "#ffffff",
        "on-tertiary-container": "#f5fff6",
        "inverse-primary": "#93ccff",
        "surface-container-lowest": "#ffffff",
        "on-secondary-fixed": "#131b2e",
        "on-tertiary-fixed-variant": "#005236",
        "surface-container-low": "#f2f4f6",
        "secondary": "#565e74",
        "outline-variant": "#bfc7d2",
        "on-error-container": "#93000a",
        "inverse-surface": "#2d3133",
        "tertiary-fixed": "#6ffbbe",
        "primary-container": "#007bb9",
        "on-tertiary-fixed": "#002113",
        "surface-bright": "#f7f9fb",
        "inverse-on-surface": "#eff1f3",
        "outline": "#707881",
        "primary-fixed-dim": "#93ccff",
        "on-background": "#191c1e",
        "surface-tint": "#006398",
        "error-container": "#ffdad6",
        "secondary-fixed": "#dae2fd",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-variant": "#e0e3e5",
        "tertiary-fixed-dim": "#4edea3",
        "on-primary": "#ffffff",
        "on-surface": "#191c1e",
        "on-tertiary": "#ffffff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "1.5rem",
        "space-xl": "2.25rem",
        "space-xs": "0.25rem",
        "margin": "2rem",
        "margin-mobile": "1rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "gutter-mobile": "1rem",
        "space-lg": "1.5rem"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "headline-xl": ["Plus Jakarta Sans", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-lg": ["Inter", "sans-serif"],
        "label-sm": ["Inter", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "headline-xl-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "headline-sm": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "body-md": [
          "0.875rem",
          {
            "lineHeight": "1.375rem",
            "letterSpacing": "-0.006em",
            "fontWeight": "400"
          }
        ],
        "headline-xl": [
          "2.25rem",
          {
            "lineHeight": "2.75rem",
            "letterSpacing": "-0.025em",
            "fontWeight": "600"
          }
        ],
        "label-md": [
          "0.75rem",
          {
            "lineHeight": "1rem",
            "letterSpacing": "0.025em",
            "fontWeight": "600"
          }
        ],
        "body-lg": [
          "1rem",
          {
            "lineHeight": "1.5rem",
            "letterSpacing": "-0.011em",
            "fontWeight": "500"
          }
        ],
        "label-lg": [
          "0.875rem",
          {
            "lineHeight": "1.25rem",
            "letterSpacing": "0.01em",
            "fontWeight": "600"
          }
        ],
        "label-sm": [
          "0.6875rem",
          {
            "lineHeight": "0.875rem",
            "letterSpacing": "0.05em",
            "fontWeight": "600"
          }
        ],
        "headline-lg": [
          "1.5rem",
          {
            "lineHeight": "2rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "body-sm": [
          "0.75rem",
          {
            "lineHeight": "1.125rem",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "headline-xl-mobile": [
          "1.75rem",
          {
            "lineHeight": "2.25rem",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "headline-sm": [
          "1.25rem",
          {
            "lineHeight": "1.75rem",
            "letterSpacing": "-0.015em",
            "fontWeight": "600"
          }
        ]
      }
    }
  },
  plugins: [],
};
