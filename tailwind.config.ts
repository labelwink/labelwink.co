import type { Config } from "tailwindcss";
import tailwindAnimate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config = {
  darkMode: 'media', // disabled effectively — use media, never class
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Brand colors
        labelwink: {
          green:          '#1C3829',
          'green-hover':  '#24472F',
          gold:           '#c9a84c',
          'gold-hover':   '#d4b76a',
          cream:          '#FDF8F0',
          'cream-card':   '#FAF5E9',
          'cream-border': '#E8DFC8',
          dark:           '#1A1A1A',
          muted:          '#6B6B5A',
        },
        green: {
          DEFAULT: '#2d5a3d',
          hover: '#3d7a53',
          dark: '#1e3d29',
          tint: '#eef5f1',
          light: '#d4e8db',
        },
        gold: {
          DEFAULT: '#c9a84c',
          hover: '#e0bc5a',
          tint: '#fdf6e3',
          dark: '#a0842e',
        },
        cream: {
          DEFAULT: '#faf8f4',
          surface: '#f5f2ec',
          border: '#e8e2d6',
        },
        brand: {
          bg: '#faf8f4',
          text: '#1a2e1e',
          muted: '#5a7060',
          faint: '#9aab9e',
        },
        // shadcn tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        brand:   ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
        cinzel:  ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      transitionDuration: {
        '350': '350ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [tailwindAnimate, typography],
} satisfies Config;

export default config;
