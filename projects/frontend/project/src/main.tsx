import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import App from "./App";
import { SessionProvider } from "./components/SessionContext";
import "./utils/i18n";
import "./index.css";

function getRoot() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  return rootElement;
}

ReactDOM.createRoot(getRoot()).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            backgroundColor: "#080606",
            color: "#efe5d3",
          }}
        >
          <CircularProgress sx={{ color: "#dcb678" }} />
        </Box>
      }
    >
      <SessionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SessionProvider>
    </Suspense>
  </React.StrictMode>,
);
