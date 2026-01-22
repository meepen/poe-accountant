import { Typography, Button, Box, Container } from "@mui/material";
import { useSession } from "./SessionContext";

export default function PreLogin() {
  const { login } = useSession();

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome!
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Log in to start tracking your Stash automatically and efficiently.
        </Typography>
        <Button variant="contained" size="large" onClick={login} sx={{ mt: 4 }}>
          Log In
        </Button>
      </Box>
    </Container>
  );
}
