import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
} from "@mui/material";
import GGGNotice from "./GGGNotice";
import { useSession } from "./SessionContext";
import fontinRegular from "./assets/fonts/Fontin-Regular.ttf";
import fontinBold from "./assets/fonts/Fontin-Bold.ttf";
import fontinItalic from "./assets/fonts/Fontin-Italic.ttf";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#080606", // Very dark brownish black
      paper: "#1a1310", // Dark brown
    },
    primary: {
      main: "#dcb678", // Gold/Brass
    },
    secondary: {
      main: "#a80000", // Dark Red
    },
    text: {
      primary: "#efe5d3", // Off-white/beige
      secondary: "#a38d6d", // Muted Gold
    },
  },
  typography: {
    fontFamily: '"Fontin", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { color: "#dcb678" },
    h2: { color: "#dcb678" },
    h3: { color: "#dcb678" },
    h4: { color: "#dcb678" },
    h5: { color: "#dcb678" },
    h6: { color: "#dcb678" },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1310",
          borderBottom: "1px solid #5a4b35",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Fontin';
          src: url('${fontinRegular}') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Fontin';
          src: url('${fontinBold}') format('truetype');
          font-weight: bold;
          font-style: normal;
        }
        @font-face {
          font-family: 'Fontin';
          src: url('${fontinItalic}') format('truetype');
          font-weight: normal;
          font-style: italic;
        }
      `,
    },
  },
});

export default function App() {
  const { user, logout, login } = useSession();

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Path of Exile Accountant
            </Typography>
            {user ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="subtitle1">{user.username}</Typography>
                <Button color="inherit" onClick={logout}>
                  Log Out
                </Button>
              </Box>
            ) : (
              <Button color="inherit" onClick={login}>
                Log In
              </Button>
            )}
          </Toolbar>
        </AppBar>
        <Container component="main" sx={{ mt: 8, mb: 2, flex: 1 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Welcome
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Track your Path of Exile transactions efficiently.
          </Typography>
        </Container>
        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            mt: "auto",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="sm">
            <Typography variant="body2" color="text.secondary" align="center">
              <GGGNotice />
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
