import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function Copyright() {
  const { t } = useTranslation();
  return (
    <Typography variant="body2" color="text.secondary">
      {t("copyright", { year: new Date().getFullYear() })}
      {"Devin Korb"}
      {"."}
    </Typography>
  );
}
