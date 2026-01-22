import { createTheme } from "@mui/material";
import fontinRegular from "./assets/fonts/Fontin-Regular.ttf";
import fontinBold from "./assets/fonts/Fontin-Bold.ttf";
import fontinItalic from "./assets/fonts/Fontin-Italic.ttf";

export const createAppTheme = (mode: "light" | "dark") => {
  const isDark = mode === "dark";
  const primaryMain = isDark ? "#dcb678" : "#8c6b38"; // Gold/Brass vs Darker Brass for light
  const secondaryMain = "#a80000"; // Dark Red

  return createTheme({
    palette: {
      mode,
      ...(isDark
        ? {
            background: {
              default: "#080606", // Very dark brownish black
              paper: "#1a1310", // Dark brown
            },
            primary: {
              main: primaryMain,
            },
            secondary: {
              main: secondaryMain,
            },
            text: {
              primary: "#efe5d3", // Off-white/beige
              secondary: "#a38d6d", // Muted Gold
            },
          }
        : {
            primary: {
              main: primaryMain,
            },
            secondary: {
              main: secondaryMain,
            },
          }),
    },
    typography: {
      fontFamily: '"Fontin", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { color: primaryMain },
      h2: { color: primaryMain },
      h3: { color: primaryMain },
      h4: { color: primaryMain },
      h5: { color: primaryMain },
      h6: { color: primaryMain },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#1a1310" : primaryMain,
            borderBottom: isDark ? "1px solid #5a4b35" : "none",
            color: isDark ? "#efe5d3" : "#fff",
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
};
