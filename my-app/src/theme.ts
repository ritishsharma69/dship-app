import { createTheme } from '@mui/material/styles'

// Khushiyan Store — premium design system
// Tight palette: ink black surfaces, brand pink for CTAs only, soft warm neutrals.
const BRAND_PINK = '#F02A4D'
const BRAND_PINK_DARK = '#D92243'
const INK = '#141414'
const TEXT_PRIMARY = '#1A1A1A'
const TEXT_SECONDARY = '#6B7280'
const BORDER = '#ECE9E2'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: BRAND_PINK, dark: BRAND_PINK_DARK, contrastText: '#FFFFFF' },
    secondary: { main: INK },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    divider: BORDER,
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    fontWeightBold: 800,
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontWeight: 800, letterSpacing: '-0.01em' },
    button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0.1 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'transform 0.15s ease, box-shadow 0.2s ease, background-color 0.2s ease',
        },
        contained: {
          backgroundColor: BRAND_PINK,
          boxShadow: '0 1px 2px rgba(255,63,108,0.25)',
          '&:hover': {
            backgroundColor: BRAND_PINK_DARK,
            boxShadow: '0 6px 16px rgba(255,63,108,0.32)',
            transform: 'translateY(-1px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        outlined: {
          borderColor: 'rgba(0,0,0,0.16)',
          color: TEXT_PRIMARY,
          '&:hover': { borderColor: TEXT_PRIMARY, backgroundColor: 'rgba(0,0,0,0.02)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${BORDER}`,
          boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'medium' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(0,0,0,0.28)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND_PINK, borderWidth: 1.5 },
        },
      },
    },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: INK, color: '#FFFFFF' } } },
    MuiContainer: {
      defaultProps: { maxWidth: false }, // Remove max-width constraint
      styleOverrides: {
        root: {
          maxWidth: 'none !important', // Override any max-width
          padding: '0 16px', // Add some padding instead
        }
      }
    },
  },
})

export default theme

