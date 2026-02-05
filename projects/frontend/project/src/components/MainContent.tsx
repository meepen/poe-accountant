import Box from "@mui/material/Box";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import { useSession } from "./SessionContext";

const PreLogin = lazy(() => import("../pages/PreLogin"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const JobsPage = lazy(() => import("../pages/JobsPage"));

export default function MainContent() {
  const { user } = useSession();

  return (
    <Box
      component="main"
      sx={{ flex: 1, display: "flex", flexDirection: "column" }}
    >
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard />} />
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
  );
}
