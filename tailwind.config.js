export default {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/**/*.md'],
    theme: { 
      extend: {
        fontFamily: {
          def: ['Noto Sans JP', 'sans-serif'],
          eng: ['Hanuman', 'serif'],
          num: ['Cuprum', 'serif']
        },
        keyframes: {
          'slide-down': {
            '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
            '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
          },
        },
        animation: {
          'slide-down': 'slide-down 0.3s ease-out',
        },
      } 
    },
    plugins: []
  }
  