/** @type {import('tailwindcss').Config} */
export default {
  // 🔽 **MODIFICA CHIAVE** 🔽
  // Questi pattern sono specifici e ignorano node_modules.
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",             // Scansiona file nella root (es. App.tsx)
    "./components/**/*.{js,ts,jsx,tsx}", // Scansiona tutto dentro /components
    "./lib/**/*.{js,ts,jsx,tsx}",      // Scansiona tutto dentro /lib
    "./services/**/*.{js,ts,jsx,tsx}" // Scansiona tutto dentro /services
  ],
  // 🔼 **FINE DELLA MODIFICA** 🔼

  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        'custom-coral': '#F76F53',

        // Light Theme
        'notion-bg': '#ffffff',
        'notion-sidebar': '#f7f7f5',
        'notion-text': '#37352f',
        'notion-text-gray': '#9b9a97',
        'notion-border': '#edece9',
        'notion-hover': '#e3e3e1',
        'notion-active': '#d5d5d3',

        // Dark Theme
        'notion-bg-dark': '#191919',
        'notion-sidebar-dark': '#202020',
        'notion-text-dark': '#e2e2e2',
        'notion-text-gray-dark': '#8a8a8a',
        'notion-border-dark': '#3a3a3a',
        'notion-hover-dark': '#303030',
        'notion-active-dark': '#3f3f3f',
      },
    },
  },
  plugins: [],
}