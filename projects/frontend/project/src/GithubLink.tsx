import { IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function GithubLink() {
  return (
    <IconButton
      component="a"
      href="https://github.com/meepen/poe-accountant"
      target="_blank"
      rel="noopener noreferrer"
      color="inherit"
      aria-label="GitHub"
    >
      <GitHubIcon />
    </IconButton>
  );
}
