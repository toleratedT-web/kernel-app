import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kernel: {
          50: "#fdf8f0",
          100: "#f9edda",
          200: "#f2d7b0",
          300: "#e9bc7d",
          400: "#e0a04f",
          500: "#d4862e",
          600: "#c56d23",
          700: "#a45420",
          800: "#844321",
          900: "#6c381e",
          950: "#3a1c0e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
