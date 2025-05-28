/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Make sure this is also correct for your project!
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#0F172A",
        "brand-surface": "#1E293B",
        "brand-primary": "#84CC16", // Lime Green
        "brand-secondary": "#7E22CE", // Vivid Purple
        "brand-highlight": "#EC4899", // Bright Pink
        "text-on-dark": "#E2E8F0",
        "text-on-light": "#0F172A",
        "brand-light-bg": "#F8FAFC",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      animation: {
        blob: "blob 7s infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slower": "pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "fade-in": "fade-in 0.8s ease-out forwards",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // ... other keyframes ...
      },
      animation: {
        blob: "blob 7s infinite ease-in-out",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        // ... other animations ...
      },
    },
  },
  plugins: [
    // ... your plugins
  ],
};
