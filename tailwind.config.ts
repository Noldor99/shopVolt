/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			backgroundImage: {
				"main-hero": "url('/main-hero.png')"
			},
			colors: {
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				secondary: 'var(--secondary)',
				primary: 'var(--primary)',
				turquoise: 'var(--turquoise)',
				destructive: 'var(--destructive)',
				muted: {
					DEFAULT: ' var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				white: '#FFF',
				red: '#DA0000',
				purple: '#6A64E8',
				yellow: '#E3E31B',
				greenBlue: '#5AA'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		},
		// fontFamily: {
		// 	mono: [
		// 		'var(--space-mono)',
		// 		'sans-serif'
		// 	]
		// }
	},
	plugins: [require("tailwindcss-animate")],
}
