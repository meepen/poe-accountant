import { useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Modal,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import { useApi, useSession } from "../components/session-hooks";
import { useTranslation } from "react-i18next";
import ViewHistoryTabs from "./Dashboard/ViewHistoryTabs";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema";

// Placeholder data
const ITEMS = [
  { name: "Divine Orb", price: "245 c" },
  { name: "Mirror of Kalandra", price: "740 d" },
  { name: "Mageblood", price: "320 d" },
  { name: "Headhunter", price: "45 d" },
  { name: "Tabula Rasa", price: "12 c" },
];

function MoneyChart() {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Paper
      sx={{
        p: 2,
        height: "35rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.100",
      }}
    >
      <Typography variant="h6" color="text.secondary">
        {t("chart_placeholder_money")}
      </Typography>
    </Paper>
  );
}

function ItemTable() {
  const { t } = useTranslation();
  return (
    <TableContainer sx={{ height: "100%" }}>
      <Table stickyHeader aria-label="items table">
        <TableHead>
          <TableRow>
            <TableCell>{t("table_header_item")}</TableCell>
            <TableCell align="right">{t("table_header_est_price")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ITEMS.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell align="right">{row.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Dashboard() {
  const { user } = useSession();
  const api = useApi();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    { severity: "success" | "error"; message: string } | undefined
  >(undefined);

  if (!user) {
    return null;
  }

  const handleOpenSettings = () => {
    setSettingsOpen(true);
  };
  const handleCloseSettings = () => {
    setSettingsOpen(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(undefined);

    try {
      const result = await api.request(ApiEndpoint.SyncUserInventory);
      setSyncStatus({
        severity: "success",
        message: t("dashboard_sync_success", { jobId: result.id }),
      });
    } catch (error: unknown) {
      console.error("Failed to sync inventory:", error);
      setSyncStatus({
        severity: "error",
        message: t("dashboard_sync_error"),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        p: 4,
        gap: 3,
        overflow: "hidden",
      }}
    >
      {/* Left Side */}
      <Box
        sx={{
          flex: 3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={() => {
              void handleSync();
            }}
            disabled={isSyncing}
          >
            {isSyncing
              ? t("dashboard_sync_in_progress")
              : t("dashboard_sync_button")}
          </Button>
        </Box>
        {syncStatus ? (
          <Alert severity={syncStatus.severity}>{syncStatus.message}</Alert>
        ) : null}

        {/* Top Chart */}
        <MoneyChart />

        {/* Bottom Section */}
        <ViewHistoryTabs onOpenSettings={handleOpenSettings} />
      </Box>

      {/* Right Side */}
      <Box
        sx={{
          flex: 1,
          minWidth: "18.75rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Paper
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="h6">{t("section_items")}</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <ItemTable />
          </Box>
        </Paper>
      </Box>

      {/* Settings Modal */}
      <Modal
        open={settingsOpen}
        onClose={handleCloseSettings}
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "25rem",
            bgcolor: "background.paper",
            border: "0.125rem solid #000",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="settings-modal-title" variant="h6" component="h2">
            {t("modal_title_settings")}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox defaultChecked />}
              label={t("settings_test_checkbox")}
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
