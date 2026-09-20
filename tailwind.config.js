/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#161A22",
          soft: "#252B38",
          dark: "#0F1218",
          muted: "#353D50",
        },
        paper: {
          DEFAULT: "#F6F4EF",
          raised: "#FFFFFF",
          muted: "#ECE8DF",
          subtle: "#FAF9F6",
        },
        line: {
          DEFAULT: "#DEDACE",
          soft: "#EAE7DE",
          dark: "#C8C2B3",
        },
        slate: {
          DEFAULT: "#5B6272",
          soft: "#8B90A0",
          light: "#AEB3C0",
        },
        amber: {
          DEFAULT: "#B8752C",
          soft: "#F3E3CC",
          dark: "#94581C",
        },
        teal: {
          DEFAULT: "#2C6E63",
          soft: "#DCEBE7",
          dark: "#1F534B",
        },
        rust: {
          DEFAULT: "#A6402F",
          soft: "#F3DBD6",
          dark: "#862F21",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Inter",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "'SFMono-Regular'",
          "Consolas",
          "'Liberation Mono'",
          "Menlo",
          "'Courier New'",
          "monospace",
        ],
      },
      boxShadow: {
        panel: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06)",
        card: "0 2px 4px rgba(22, 26, 34, 0.04)",
      },
    },
  },
  plugins: [],
};
