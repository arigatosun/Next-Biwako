import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        }
      },
      aspectRatio: {
        'w-16': '16',
        'h-9': '9'
      },
      screens: {
        'xs': '375px',
        ...defaultTheme.screens,
      },
      fontFamily: {
        'zen-kaku': ['var(--font-zen-kaku)', ...defaultTheme.fontFamily.sans],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '700',
        bold: '700',
        black: '900',
        300: '300',
        400: '400',
        500: '500',
        700: '700',
        900: '900'
      },
      fontSize: {
        // 標準サイズ
        'xxs': ['0.625rem', {
          lineHeight: '0.875rem',
          letterSpacing: '0.03em'
        }],
        'xs': ['0.75rem', {
          lineHeight: '1rem',
          letterSpacing: '0.03em'
        }],
        'sm': ['0.875rem', {
          lineHeight: '1.25rem',
          letterSpacing: '0.03em'
        }],
        'base': ['1rem', {
          lineHeight: '1.5rem',
          letterSpacing: '0.03em'
        }],
        'lg': ['1.125rem', {
          lineHeight: '1.75rem',
          letterSpacing: '0.03em'
        }],
        'xl': ['1.25rem', {
          lineHeight: '1.75rem',
          letterSpacing: '0.03em'
        }],
        '2xl': ['1.5rem', {
          lineHeight: '2rem',
          letterSpacing: '0.03em'
        }],
        '3xl': ['1.875rem', {
          lineHeight: '2.25rem',
          letterSpacing: '0.03em'
        }],
        '4xl': ['2.25rem', {
          lineHeight: '2.5rem',
          letterSpacing: '0.03em'
        }],
        // モバイル用サイズ
        'mobile-xxs': ['0.625rem', {
          lineHeight: '0.875rem',
          letterSpacing: '0.03em'
        }],
        'mobile-xs': ['0.75rem', {
          lineHeight: '1rem',
          letterSpacing: '0.03em'
        }],
        'mobile-sm': ['0.813rem', {
          lineHeight: '1.125rem',
          letterSpacing: '0.03em'
        }],
        'mobile-base': ['0.938rem', {
          lineHeight: '1.375rem',
          letterSpacing: '0.03em'
        }],
        'mobile-lg': ['1.063rem', {
          lineHeight: '1.5rem',
          letterSpacing: '0.03em'
        }],
        'mobile-xl': ['1.188rem', {
          lineHeight: '1.625rem',
          letterSpacing: '0.03em'
        }]
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      minHeight: {
        'screen-small': '100vh',
        'screen-large': 'calc(100vh - 4rem)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    }
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require("tailwindcss-animate")
  ],
} satisfies Config;

export default config;