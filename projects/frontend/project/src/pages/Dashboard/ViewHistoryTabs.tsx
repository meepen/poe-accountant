import { useState } from "react";
import { Typography, Box, Paper, Tabs, Tab, IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTranslation } from "react-i18next";

interface ViewHistoryTabsProps {
  onOpenSettings: () => void;
}

export default function ViewHistoryTabs({
  onOpenSettings,
}: ViewHistoryTabsProps) {
  const { t } = useTranslation();
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Paper
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          pr: 1,
        }}
      >
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label={t("tab_view")} />
          <Tab label={t("tab_history")} />
        </Tabs>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          aria-label={t("settings_aria_label")}
          onClick={onOpenSettings}
        >
          <SettingsIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
        {tabIndex === 0 && <Typography>{t("view_content_area")}</Typography>}
        {tabIndex === 1 && <Typography>{t("history_content_area")}</Typography>}
      </Box>
    </Paper>
  );
}
