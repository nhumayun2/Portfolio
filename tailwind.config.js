/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}", // This line tells Tailwind where to find your classes
  ],
  theme: {
    extend: {
      // Ensure your custom colors and fonts are here as previously discussed
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Oswald", "sans-serif"],
      },
      colors: {
        primary: "#3B82F6",
        secondary: "#10B981",
        darkbg: "#1A202C",
        lighttext: "#E2E8F0",
        heroButton: "#d5dfe0",
        accent: "#F97316",
        "gray-800": "#2D3748", // Ensure these custom grays are defined if you use them
        "gray-900": "#1A202C",
        "gray-950": "#0A0A0A", // A very dark gray, useful for footers
      },
    },
  },
  plugins: [],
};
