import { useMemo } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useSession } from "./components/session-hooks";
import { createAppTheme } from "./theme";
import AppBarNav from "./components/AppBarNav";
import FooterBar from "./components/FooterBar";
import MainContent from "./components/MainContent";

export default function App() {
  const { user, logout, login, isLoading } = useSession();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () => createAppTheme(prefersDarkMode ? "dark" : "light"),
    [prefersDarkMode],
  );

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
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AppBarNav user={user} login={login} logout={logout} />
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          <MainContent />
        </Box>
        <FooterBar />
      </Box>
    </ThemeProvider>
  );
}
