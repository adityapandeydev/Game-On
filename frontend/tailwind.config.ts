import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sidebar: "#333333",
        header: "#222222",
        cardBg: "#444444",
        textPrimary: "#ffffff",
        textSecondary: "#aaaaaa",
      },
    },
  },
  plugins: [],
};

export default config;
