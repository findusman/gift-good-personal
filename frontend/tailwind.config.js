/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/pages/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        beige: '#F4EFEA',
        'beige-light': '#FBF9F7',
        'beige-dark': '#E9E0D5',
        'beige-600': '#C3B29A',
        'beige-300': '#EEE8E0',
        'beige-900': '#F5F5F5',
        dark: '#333',
        light: '#FBF9F7',
        'black-soft': '#333333',
        grey: '#CCC',
        gray: '#999999',
        'red-error': '#FF0000',
        'dark-gray': '#666666',
      },
      fontFamily: {
        lato: ['Lato', 'sans-serif'],
        crimsonpro: ['Crimson Pro', 'serif'],
        crimsontext: ['Crimson Text', 'serif'],
      },
      fontSize: {
        '1.5lg': '1.188rem', // 19px
        '1.5xl': '1.375rem', // 22px
        '2.6xl': '1.75rem', // 28px
        '3.3xl': '2rem', // 32px
        '4.2xl': '2.375rem', // 38px
      },
      spacing: {
        4.5: '1.125rem', // 18px
        6.5: '1.625rem', // 26px
        8.75: '2.1875rem', // 35px;
        10.5: '2.625rem', // 42px
        12.5: '3.125rem', // 50px
        13: '3.25rem', // 52px
        18: '4.5rem', // 72px
        19: '4.75rem', // 76px
        21: '5.25rem', // 84px
        22: '5.5rem', // 88px
        23: '5.75rem', // 92px
        25: '6.25rem', // 100px
      },
      outlineWidth: {
        1.5: '0.094rem', // 1.5px
      },
      backgroundPosition: {
        'left-overlap-bottom': 'left 33% bottom',
      },
      backgroundSize: {
        'size-190': '190%',
      },
      width: {
        16.25: '16.25rem', // 260px
        125: '31.25rem', // 500px
      },
      height: {
        105: '26.25rem', // 420px
      },
      boxShadow: {
        custom: '0px 2px 6px 4px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
