/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFDF9',
          100: '#FAF7F2',
          200: '#F5EFEB',
          300: '#EEDFD8',
          400: '#E4CFBF',
        },
        blush: {
          50: '#FDF7F7',
          100: '#FBF0F2',
          200: '#F6DEE3',
          300: '#EFC3CB',
          400: '#E49DA9',
          500: '#D67E8E',
        },
        rose: {
          100: '#F7E7EB',
          200: '#EFCCD4',
          300: '#E3A8B6',
          400: '#D98899',
          500: '#C9788A', // primary brand dusty rose
          600: '#B86B7C',
          700: '#9E5363',
          800: '#7E3E4D',
        },
        mauve: {
          100: '#F2E8EB',
          300: '#CBB2BA',
          500: '#9E6B7A',
          600: '#855361',
        },
        champagne: {
          100: '#F9F4EE',
          200: '#EEDAC5',
          300: '#DEC4A9',
        },
        espresso: {
          600: '#7B6762',
          700: '#5A4540',
          800: '#3E2520',
          900: '#2E1A16', // primary warm dark text
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Playfair Display', 'Georgia', 'serif'],
        display: ['"Playfair Display"', '"Cormorant Garamond"', 'serif'],
        script: ['"Pinyon Script"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(46, 26, 22, 0.04), 0 2px 6px -1px rgba(46, 26, 22, 0.02)',
        'card': '0 10px 30px -4px rgba(46, 26, 22, 0.06), 0 4px 12px -2px rgba(46, 26, 22, 0.03)',
        'modal': '0 25px 50px -12px rgba(46, 26, 22, 0.18)',
      },
      borderRadius: {
        'luxury': '14px',
        'luxury-lg': '20px',
      }
    },
  },
  plugins: [],
}
