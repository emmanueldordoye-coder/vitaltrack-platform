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
      },
    },
  },
  plugins: [],
};

export default config;
