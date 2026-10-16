/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta de Autor "Punto Fino"
        pf: {
          carbon: '#111215',       // Base mate profunda del local
          surface: '#18191E',      // Superficie cards y nav
          elevated: '#22242B',     // Superficie elevada / inputs
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(17, 18, 21, 0.12)',
          
          bone: '#F7F5F0',         // Lino hueso / texto claro
          sand: '#EFECE4',         // Arena suave
          muted: '#9B988F',        // Texto secundario neutro cálido
          subtle: '#6A6862',       // Líneas y placeholders
          
          terracota: '#E15233',    // Acento caleño vibrante
          'terracota-hover': '#C44327',
          'terracota-glow': 'rgba(225, 82, 51, 0.25)',
          
          brass: '#B89758',        // Latón ahumado / tijeras y navaja
          'brass-dark': '#967840',
          'brass-light': '#D4B373',
          
          // Estados de servicio
          available: '#2EA063',    // Cupo libre / abierto
          busy: '#D9822B',         // En silla / atendiendo
          danger: '#D34538',       // Cancelado / no-show
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        none: '0px',
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      boxShadow: {
        'fine': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        'fine-terracota': '0 0 0 1.5px #E15233',
        'fine-brass': '0 0 0 1.5px #B89758',
        'elevation': '0 10px 30px -5px rgba(0, 0, 0, 0.6)',
      },
    },
  },
  plugins: [],
};