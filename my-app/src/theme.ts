import { createTheme } from '@mui/material/styles'

// Neutral palette from user image: #57564F, #7A7A73, #DDDAD0, #F8F3CE
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#57564F', contrastText: '#FFFFFF' },
    secondary: { main: '#7A7A73' },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    divider: '#DDDAD0',
    text: {
      primary: '#000000',
      secondary: '#000000',
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    fontWeightBold: 800,
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 0 } }
    },
    MuiAppBar: { styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#57564F', color: '#FFFFFF' } } },
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

