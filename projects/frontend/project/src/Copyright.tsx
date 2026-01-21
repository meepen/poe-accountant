import { Typography } from "@mui/material";

export default function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary">
      {"Copyright © "}
      {"Devin Korb"} {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}
