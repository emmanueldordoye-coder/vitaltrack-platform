import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f5ff",
          500: "#4253d6",
          700: "#2f3db3",
        },
        lighthouse: {
          primary: "#16305e",
          accent: "#0a9e6b",
          background: "#eef0f4",
        },
      },
    },
  },
  plugins: [],
};

export default config;
