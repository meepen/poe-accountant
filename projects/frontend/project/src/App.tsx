import { useState, useMemo } from "react";
import {
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
  useMediaQuery,
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
import GithubLink from "./GithubLink";
import { useTranslation } from "react-i18next";
import { createAppTheme } from "./theme";

export default function App() {
  const { user, logout, login, isLoading } = useSession();
  const { t } = useTranslation();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () => createAppTheme(prefersDarkMode ? "dark" : "light"),
    [prefersDarkMode],
  );

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
      <ThemeProvider theme={theme}>
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
    <ThemeProvider theme={theme}>
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
              <Typography
                variant="h6"
                component="div"
                sx={{ mx: 2, color: "inherit" }}
              >
                {t("app_title")}
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
                        {t("menu_developer")}
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
                        {t("menu_jobs")}
                      </MenuItem>
                    </Menu>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        handleMenuClose();
                        logout();
                      }}
                    >
                      {t("menu_logout")}
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
                  {t("menu_login")}
                </Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
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
        </Box>
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
