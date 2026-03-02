/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: '#3b82f6',
                    dark: '#2563eb'
                },
                card: {
                    DEFAULT: '#ffffff',
                    dark: '#1e293b'
                }
            }
        },
    },
    plugins: [],
}
