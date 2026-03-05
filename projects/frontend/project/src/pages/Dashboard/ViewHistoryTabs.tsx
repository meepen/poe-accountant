import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import {
  ApiEndpoint,
  type SyncUserInventoryJobDataDto,
  type UserInventorySnapshotDto,
} from "@meepen/poe-accountant-api-schema";
import { useApi } from "../../components/session-hooks";

interface ViewHistoryTabsProps {
  onOpenSettings: () => void;
  handleSync: () => Promise<void>;
  isSyncing: boolean;
}

export default function ViewHistoryTabs({
  onOpenSettings,
  handleSync,
  isSyncing,
}: ViewHistoryTabsProps) {
  const { t } = useTranslation();
  const api = useApi();
  const [tabIndex, setTabIndex] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<UserInventorySnapshotDto[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null,
  );
  const [snapshotData, setSnapshotData] =
    useState<SyncUserInventoryJobDataDto | null>(null);
  const [loadingSnapshotData, setLoadingSnapshotData] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    if (tabIndex !== 1) {
      return;
    }

    let mounted = true;

    async function fetchSnapshots() {
      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const result = await api.request(ApiEndpoint.GetUserInventorySnapshots);
        if (!mounted) {
          return;
        }
        setSnapshots(result);
      } catch (error: unknown) {
        console.error("Failed to load inventory snapshots", error);
        if (!mounted) {
          return;
        }
        setHistoryError("Failed to load inventory history.");
      } finally {
        if (mounted) {
          setLoadingHistory(false);
        }
      }
    }

    void fetchSnapshots();

    return () => {
      mounted = false;
    };
  }, [api, tabIndex]);

  const loadSnapshotData = async (snapshotId: string) => {
    setSelectedSnapshotId(snapshotId);
    setLoadingSnapshotData(true);
    setHistoryError(null);

    try {
      const result = await api.request(
        ApiEndpoint.GetUserInventorySnapshotData,
        {
          snapshotId,
        },
      );
      setSnapshotData(result);
    } catch (error: unknown) {
      console.error("Failed to load inventory snapshot data", error);
      setHistoryError("Failed to load selected snapshot data.");
      setSnapshotData(null);
    } finally {
      setLoadingSnapshotData(false);
    }
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
        <Tooltip title={t("settings_aria_label")}>
          <IconButton
            onClick={onOpenSettings}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            isSyncing
              ? t("dashboard_sync_in_progress")
              : t("dashboard_sync_button")
          }
        >
          <span>
            <IconButton
              aria-label={t("dashboard_sync_button")}
              onClick={() => {
                void handleSync();
              }}
              disabled={isSyncing}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
        {tabIndex === 0 && <Typography>{t("view_content_area")}</Typography>}
        {tabIndex === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {loadingHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : snapshots.length === 0 ? (
              <Typography variant="body2">
                No inventory snapshots yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Generated</TableCell>
                    <TableCell>League</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {snapshots.map((snapshot) => (
                    <TableRow key={snapshot.id}>
                      <TableCell>
                        {new Date(snapshot.generatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{`${snapshot.realm}/${snapshot.leagueId}`}</TableCell>
                      <TableCell align="right">{snapshot.totalValue}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => {
                            void loadSnapshotData(snapshot.id);
                          }}
                        >
                          Load
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {historyError ? (
              <Typography variant="body2" color="error">
                {historyError}
              </Typography>
            ) : null}

            {loadingSnapshotData ? (
              <Typography variant="body2">Loading snapshot data...</Typography>
            ) : snapshotData && selectedSnapshotId ? (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              >
                {JSON.stringify(snapshotData, null, 2)}
              </Box>
            ) : null}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
