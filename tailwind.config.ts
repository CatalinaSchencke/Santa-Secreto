import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './imports/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  mode: 'jit', // Just-In-Time mode para recompilación más rápida
  theme: {
    extend: {
      fontFamily: {
        'raleway': ['Raleway', 'sans-serif'],
      },
      colors: {
        'santa-red': '#ce3b46',
      },
      fontWeight: {
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      }
    },
  },
  plugins: [],
  safelist: [
    'font-medium',
    'font-semibold', 
    'font-bold',
    'font-extrabold',
    'font-black',
    'font-raleway',
  ],
};

export default config;