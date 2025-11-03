// Tailwind CSS 4 uses CSS-first configuration
// Theme is defined in app/globals.css using @theme directive
// This file is kept for compatibility but most config is in CSS
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
} satisfies Config

export default config

