import { useState } from "react";
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
  CircularProgress,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { Routes, Route, Navigate, Link as RouterLink } from "react-router-dom";
import GGGNotice from "./GGGNotice";
import Copyright from "./Copyright";
import PreLogin from "./PreLogin";
import MainApp from "./MainApp";
import JobsPage from "./JobsPage";
import { useSession } from "./SessionContext";
import fontinRegular from "./assets/fonts/Fontin-Regular.ttf";
import fontinBold from "./assets/fonts/Fontin-Bold.ttf";
import fontinItalic from "./assets/fonts/Fontin-Italic.ttf";
import GithubLink from "./GithubLink";

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
  const { user, logout, login, isLoading } = useSession();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [developerAnchorEl, setDeveloperAnchorEl] =
    useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const developerOpen = Boolean(developerAnchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setDeveloperAnchorEl(null);
  };

  const handleDeveloperClick = (event: React.MouseEvent<HTMLElement>) => {
    setDeveloperAnchorEl(event.currentTarget);
  };

  const handleDeveloperClose = () => {
    setDeveloperAnchorEl(null);
    handleMenuClose();
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

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
          <Toolbar disableGutters>
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              sx={{
                alignSelf: "stretch",
                borderRadius: 0,
                p: 0,
                mr: 4,
                textTransform: "none",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }}
            >
              <Typography variant="h6" component="div" sx={{ mx: 2 }}>
                Path of Exile Accountant
              </Typography>
            </Button>
            {user ? (
              <>
                <Box sx={{ flexGrow: 1 }} />
                <Box sx={{ display: "flex", alignSelf: "stretch" }}>
                  <Button
                    color="inherit"
                    onClick={handleMenuClick}
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{ borderRadius: 0, px: 3 }}
                  >
                    {user.username}
                  </Button>
                  <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    slotProps={{
                      list: {
                        "aria-labelledby": "basic-button",
                      },
                    }}
                  >
                    <MenuItem onClick={handleDeveloperClick}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <KeyboardArrowLeftIcon
                          fontSize="small"
                          sx={{ mr: 1 }}
                        />
                        Developer
                      </Box>
                    </MenuItem>
                    <Menu
                      anchorEl={developerAnchorEl}
                      open={developerOpen}
                      onClose={handleDeveloperClose}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                    >
                      <MenuItem
                        component={RouterLink}
                        to="/jobs"
                        onClick={handleDeveloperClose}
                      >
                        Jobs
                      </MenuItem>
                    </Menu>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        logout();
                      }}
                    >
                      Log Out
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            ) : (
              <>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  color="inherit"
                  onClick={login}
                  sx={{ borderRadius: 0, px: 3, alignSelf: "stretch" }}
                >
                  Log In
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Container component="main" sx={{ mt: 8, mb: 2, flex: 1 }}>
          <Routes>
            {user ? (
              <>
                <Route path="/" element={<MainApp />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<PreLogin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Container>
        <Box
          component="footer"
          sx={{
            py: 1,
            px: 2,
            mt: "auto",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                <GGGNotice />
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Copyright />
                <GithubLink />
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
