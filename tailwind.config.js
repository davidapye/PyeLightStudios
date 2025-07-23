/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        tomatoes: ['"Tomatoes"', 'sans-serif'],
        'beautiful-people': ['"Beautiful People"', 'cursive'],
        quickkiss: ['"Quick Kiss"', 'cursive']
      },
    },
  },
  plugins: [],
}

