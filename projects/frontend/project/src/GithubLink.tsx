import { IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useTranslation } from "react-i18next";

export default function GithubLink() {
  const { t } = useTranslation();
  return (
    <IconButton
      component="a"
      href="https://github.com/meepen/poe-accountant"
      target="_blank"
      rel="noopener noreferrer"
      color="inherit"
      aria-label={t("github_aria_label")}
    >
      <GitHubIcon />
    </IconButton>
  );
}
