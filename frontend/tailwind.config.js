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
                    dark: '#2563eb',
                    foreground: '#f8fafc'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    dark: '#1e293b'
                },
                border: 'hsl(var(--border))',
                profit: '#10b981',
                loss: '#ef4444',
            },
            animation: {
                'skeleton': 'skeleton-loading 1.5s ease-in-out infinite',
                'fade-in': 'fade-in 0.4s ease-out',
                'slide-up': 'slide-up 0.5s ease-out',
            },
            keyframes: {
                'skeleton-loading': {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' }
                },
                'fade-in': {
                    from: { opacity: 0, transform: 'translateY(8px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                },
                'slide-up': {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' }
                }
            },
            backdropBlur: {
                xl: '24px'
            }
        },
    },
    plugins: [],
}
