/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        logoPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        stadiumLight: {
          "0%": {
            transform: "translateX(-30%) rotate(-5deg)",
            opacity: "0.4",
          },
          "50%": {
            opacity: "0.8",
          },
          "100%": {
            transform: "translateX(30%) rotate(5deg)",
            opacity: "0.4",
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.8s ease-out forwards",
        logoPulse: "logoPulse 3s ease-in-out infinite",
        stadiumLight: "stadiumLight 8s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
}