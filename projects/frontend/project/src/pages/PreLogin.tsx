import { Typography, Button, Box, Container } from "@mui/material";
import { useSession } from "../components/SessionContext";
import { useTranslation } from "react-i18next";

export default function PreLogin() {
  const { login } = useSession();
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm">
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {t("welcome_h1")}
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          {t("login_subtitle")}
        </Typography>
        <Button variant="contained" size="large" onClick={login} sx={{ mt: 4 }}>
          {t("login_button")}
        </Button>
      </Box>
    </Container>
  );
}
