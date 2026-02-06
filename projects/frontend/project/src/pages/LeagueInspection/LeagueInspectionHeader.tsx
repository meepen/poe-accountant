import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { League } from "./types";

type LeagueInspectionHeaderProps = {
  leagues: League[];
  selectedLeagueKey: string | null;
  leagueLoading: boolean;
  onLeagueChange: (value: string | null) => void;
};

export default function LeagueInspectionHeader({
  leagues,
  selectedLeagueKey,
  leagueLoading,
  onLeagueChange,
}: LeagueInspectionHeaderProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography variant="h4" component="h1">
        {t("league_inspection_title")}
      </Typography>
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel
          id="league-select-label"
          sx={{
            transform: "translate(14px, 9px) scale(1)",
            "&.MuiInputLabel-shrink": {
              transform: "translate(14px, -6px) scale(0.75)",
            },
          }}
        >
          {t("league_inspection_league_label")}
        </InputLabel>
        <Select
          labelId="league-select-label"
          label={t("league_inspection_league_label")}
          value={selectedLeagueKey ?? ""}
          onChange={(event) => {
            const value = event.target.value;
            onLeagueChange(
              typeof value === "string" && value.length > 0 ? value : null,
            );
          }}
          disabled={leagueLoading || leagues.length === 0}
        >
          {leagues.map((league) => {
            const key = `${league.realm}:${league.leagueId}`;
            return (
              <MenuItem key={key} value={key}>
                {league.leagueName ?? league.leagueId}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
