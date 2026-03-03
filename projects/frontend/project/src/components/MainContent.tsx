import Box from "@mui/material/Box";
import { Routes, Route, Navigate } from "react-router-dom";
import { lazy } from "react";
import { useSession } from "./session-hooks";

const PreLogin = lazy(() => import("../pages/PreLogin"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const JobsPage = lazy(() => import("../pages/JobsPage"));
const LeagueInspection = lazy(() => import("../pages/LeagueInspection"));

export default function MainContent() {
  const { user } = useSession();

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        minHeight: 0,
      }}
    >
      <Routes>
        {user ? (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/league-inspection" element={<LeagueInspection />} />
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
