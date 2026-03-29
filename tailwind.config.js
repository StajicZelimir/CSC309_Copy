/** @type {import('tailwindcss').Config} */
module.exports = {
  // THIS IS THE FIX: It tells Tailwind to ignore the OS 
  // and listen to your "class="dark"" instead.
  darkMode: 'class', 

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}