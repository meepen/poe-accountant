import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import App from "./App";
import { SessionProvider } from "./SessionContext";
import "./i18n";
import "./index.css";

function getRoot() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }
  return rootElement;
}

const LoadingFallback = () => (
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
);

ReactDOM.createRoot(getRoot()).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <SessionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SessionProvider>
    </Suspense>
  </React.StrictMode>,
);
