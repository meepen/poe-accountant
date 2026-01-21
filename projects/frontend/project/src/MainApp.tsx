import { Typography, Box } from "@mui/material";
import { useSession } from "./SessionContext";

export default function MainApp() {
  const { user } = useSession();

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1">Welcome back, {user.username}!</Typography>
    </Box>
  );
}
