import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import GGGNotice from "./GGGNotice";
import Copyright from "./Copyright";
import GithubLink from "./GithubLink";

export default function FooterBar() {
  return (
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
  );
}
