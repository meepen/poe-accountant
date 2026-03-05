import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import {
  ApiEndpoint,
  SyncUserInventoryJobDataDto,
  SyncUserInventoryJobDataSchemaVersion,
  SyncUserInventorySnapshotDataEnvelopeDto,
  type UserInventorySnapshotDto,
} from "@meepen/poe-accountant-api-schema";
import {
  useApi,
  useLeagueSelection,
  useStaticTradeData,
} from "../../components/session-hooks";
import CurrencyConversionValueDisplay from "../../components/common/CurrencyConversionValueDisplay";
import type { SharedCurrencyItem } from "../../components/league-context";

interface ViewHistoryTabsProps {
  onOpenSettings: () => void;
  handleSync: () => Promise<void>;
  isSyncing: boolean;
  requestedSnapshotId?: string | null;
  onRequestedSnapshotHandled?: () => void;
  onSnapshotDataChange?: (
    data: SyncUserInventoryJobDataDto | null,
    currencyList: SharedCurrencyItem[],
  ) => void;
}

type ViewTabItem = {
  id: string;
  name: string;
  icon: string | null;
  quantity: number;
  totalValue: number;
  valueCurrency: string;
};

type ViewStashTab = {
  id: string;
  name: string;
  backgroundColor: string;
};

type ParseSnapshotPayloadResult = {
  data: SyncUserInventoryJobDataDto | null;
  isOutOfDate: boolean;
  version: number | null;
};

const allTabsId = "all";

function parseSnapshotPayload(payload: unknown): ParseSnapshotPayloadResult {
  const parsed = SyncUserInventoryJobDataDto.safeParse(payload);
  if (parsed.success) {
    return {
      data: parsed.data,
      isOutOfDate: false,
      version: parsed.data.schemaVersion,
    };
  }

  const envelope = SyncUserInventorySnapshotDataEnvelopeDto.safeParse(payload);
  if (envelope.success) {
    const version = envelope.data.schemaVersion ?? null;
    return {
      data: null,
      isOutOfDate:
        version !== null && version !== SyncUserInventoryJobDataSchemaVersion,
      version,
    };
  }

  return {
    data: null,
    isOutOfDate: false,
    version: null,
  };
}

function normalizeTabColor(color: string | undefined): string {
  if (!color) {
    return "#455a64";
  }

  return color.startsWith("#") ? color : `#${color}`;
}

function resolveIconUrl(icon: string | null): string | null {
  if (!icon) {
    return null;
  }

  if (icon.startsWith("http")) {
    return icon;
  }

  return null;
}

export default function ViewHistoryTabs({
  onOpenSettings,
  handleSync,
  isSyncing,
  requestedSnapshotId,
  onRequestedSnapshotHandled,
  onSnapshotDataChange,
}: ViewHistoryTabsProps) {
  const { t } = useTranslation();
  const api = useApi();
  const staticTradeData = useStaticTradeData();
  const { selectedLeague } = useLeagueSelection();
  const [tabIndex, setTabIndex] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<UserInventorySnapshotDto[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(
    null,
  );
  const [snapshotData, setSnapshotData] =
    useState<SyncUserInventoryJobDataDto | null>(null);
  const [snapshotDataOutOfDate, setSnapshotDataOutOfDate] = useState(false);
  const [snapshotDataVersion, setSnapshotDataVersion] = useState<number | null>(
    null,
  );
  const [loadingSnapshotData, setLoadingSnapshotData] = useState(false);
  const [selectedViewTabId, setSelectedViewTabId] = useState<string>(allTabsId);
  const [snapshotCurrencyList, setSnapshotCurrencyList] = useState<
    SharedCurrencyItem[]
  >([]);
  const stashListContainerRef = useRef<HTMLDivElement | null>(null);

  const viewStashTabs = useMemo<ViewStashTab[]>(() => {
    if (!snapshotData) {
      return [];
    }

    return snapshotData.stashTabs.map((tab) => ({
      id: tab.id,
      name: tab.name,
      backgroundColor: normalizeTabColor(tab.color),
    }));
  }, [snapshotData]);

  const allEntries = useMemo(() => {
    if (!snapshotData) {
      return [];
    }

    return Object.values(snapshotData.items).flat();
  }, [snapshotData]);

  const effectiveSelectedViewTabId = useMemo(() => {
    if (
      selectedViewTabId !== allTabsId &&
      !viewStashTabs.some((tab) => tab.id === selectedViewTabId)
    ) {
      return allTabsId;
    }

    return selectedViewTabId;
  }, [selectedViewTabId, viewStashTabs]);

  const loadSnapshotCurrencyList = useCallback(
    async (snapshotId: string) => {
      if (!selectedLeague) {
        return;
      }

      try {
        const result = await api.request(
          ApiEndpoint.GetUserInventorySnapshotCurrencyList,
          {
            realm: selectedLeague.realm,
            leagueId: selectedLeague.leagueId,
            snapshotId,
          },
        );
        setSnapshotCurrencyList(result);
      } catch (error: unknown) {
        console.error("Failed to load snapshot currency list", error);
        setSnapshotCurrencyList([]);
      }
    },
    [api, selectedLeague],
  );

  const loadLatestSnapshotForView = useCallback(async () => {
    if (!selectedLeague) {
      return;
    }

    setLoadingSnapshotData(true);
    setHistoryError(null);

    try {
      const latestSnapshotsPage = await api.request(
        ApiEndpoint.GetUserInventorySnapshots,
        {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
        },
      );

      if (latestSnapshotsPage.snapshots.length === 0) {
        setSnapshotData(null);
        setSelectedSnapshotId(null);
        setSnapshotDataOutOfDate(false);
        setSnapshotDataVersion(null);
        setSnapshotCurrencyList([]);
        return;
      }

      const latestSnapshot = latestSnapshotsPage.snapshots[0];

      setSelectedSnapshotId(latestSnapshot.id);

      await api.request(ApiEndpoint.GetUserInventorySnapshot, {
        realm: selectedLeague.realm,
        leagueId: selectedLeague.leagueId,
        snapshotId: latestSnapshot.id,
      });

      await loadSnapshotCurrencyList(latestSnapshot.id);

      const payload = await api.request(
        ApiEndpoint.GetUserInventorySnapshotData,
        {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
          snapshotId: latestSnapshot.id,
        },
      );

      const parsedPayload = parseSnapshotPayload(payload);
      setSnapshotDataVersion(parsedPayload.version);
      setSnapshotDataOutOfDate(parsedPayload.isOutOfDate);

      if (parsedPayload.data) {
        setSnapshotData(parsedPayload.data);
      } else {
        setSnapshotData(null);
        setHistoryError(
          parsedPayload.isOutOfDate
            ? t("dashboard_snapshot_outdated")
            : t("dashboard_error_parse_snapshot_data"),
        );
      }
    } catch (error: unknown) {
      console.error("Failed to load latest inventory snapshot for view", error);
      setSnapshotData(null);
      setHistoryError(t("dashboard_error_load_latest_snapshot"));
    } finally {
      setLoadingSnapshotData(false);
    }
  }, [api, loadSnapshotCurrencyList, selectedLeague, t]);

  const handleSyncAndReloadLatest = useCallback(async () => {
    try {
      await handleSync();
    } finally {
      await loadLatestSnapshotForView();
    }
  }, [handleSync, loadLatestSnapshotForView]);

  const viewListItems = useMemo(() => {
    const sourceEntries =
      effectiveSelectedViewTabId === allTabsId
        ? allEntries
        : allEntries.filter(
            (entry) => entry.stashTabId === effectiveSelectedViewTabId,
          );

    const grouped = sourceEntries.reduce<Map<string, ViewTabItem>>(
      (result, entry) => {
        const valueCurrency =
          staticTradeData.entryById.get(entry.valueCurrency)?.entry.id ??
          entry.valueCurrency;
        const key = `${entry.itemId}:${valueCurrency}`;
        const existing = result.get(key);
        if (existing) {
          result.set(key, {
            ...existing,
            quantity: existing.quantity + entry.count,
            totalValue: existing.totalValue + entry.value,
          });
        } else {
          result.set(key, {
            id: key,
            name: entry.itemName,
            icon: entry.icon,
            quantity: entry.count,
            totalValue: entry.value,
            valueCurrency,
          });
        }
        return result;
      },
      new Map(),
    );

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalValue - a.totalValue,
    );
  }, [allEntries, effectiveSelectedViewTabId, staticTradeData.entryById]);

  const viewListTotal = useMemo(
    () => viewListItems.reduce((sum, item) => sum + item.totalValue, 0),
    [viewListItems],
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  useEffect(() => {
    if (tabIndex !== 1) {
      return;
    }

    if (!selectedLeague) {
      return;
    }
    const league = selectedLeague;

    let mounted = true;

    async function fetchSnapshots() {
      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const result = await api.request(
          ApiEndpoint.GetUserInventorySnapshots,
          {
            realm: league.realm,
            leagueId: league.leagueId,
          },
        );
        if (!mounted) {
          return;
        }
        setSnapshots(result.snapshots);
      } catch (error: unknown) {
        console.error("Failed to load inventory snapshots", error);
        if (!mounted) {
          return;
        }
        setHistoryError(t("dashboard_error_load_inventory_history"));
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
  }, [api, loadSnapshotCurrencyList, selectedLeague, t, tabIndex]);

  useEffect(() => {
    if (tabIndex !== 0 || !selectedLeague) {
      return;
    }

    void loadLatestSnapshotForView();
  }, [loadLatestSnapshotForView, selectedLeague, tabIndex]);

  const loadSnapshotData = useCallback(
    async (snapshotId: string) => {
      if (!selectedLeague) {
        return;
      }
      const league = selectedLeague;

      setSelectedSnapshotId(snapshotId);
      setLoadingSnapshotData(true);
      setHistoryError(null);

      try {
        await api.request(ApiEndpoint.GetUserInventorySnapshot, {
          realm: league.realm,
          leagueId: league.leagueId,
          snapshotId,
        });

        await loadSnapshotCurrencyList(snapshotId);

        const result = await api.request(
          ApiEndpoint.GetUserInventorySnapshotData,
          {
            realm: league.realm,
            leagueId: league.leagueId,
            snapshotId,
          },
        );
        const parsedPayload = parseSnapshotPayload(result);
        setSnapshotDataVersion(parsedPayload.version);
        setSnapshotDataOutOfDate(parsedPayload.isOutOfDate);

        if (!parsedPayload.data) {
          setSnapshotData(null);
          setHistoryError(
            parsedPayload.isOutOfDate
              ? t("dashboard_snapshot_outdated")
              : t("dashboard_error_parse_snapshot_data"),
          );
          return;
        }

        setSnapshotData(parsedPayload.data);
      } catch (error: unknown) {
        console.error("Failed to load inventory snapshot data", error);
        setHistoryError(t("dashboard_error_load_selected_snapshot"));
        setSnapshotData(null);
      } finally {
        setLoadingSnapshotData(false);
      }
    },
    [api, loadSnapshotCurrencyList, selectedLeague, t],
  );

  useEffect(() => {
    if (!requestedSnapshotId) {
      return;
    }

    void loadSnapshotData(requestedSnapshotId);
    onRequestedSnapshotHandled?.();
  }, [loadSnapshotData, onRequestedSnapshotHandled, requestedSnapshotId]);

  useEffect(() => {
    onSnapshotDataChange?.(snapshotData, snapshotCurrencyList);
  }, [onSnapshotDataChange, snapshotCurrencyList, snapshotData]);

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
          <IconButton onClick={onOpenSettings}>
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
                void handleSyncAndReloadLatest();
              }}
              disabled={isSyncing}
            >
              {isSyncing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
        {tabIndex === 0 && (
          <Box
            sx={{
              height: "100%",
              display: "grid",
              gridTemplateColumns: "16rem 1fr",
              gap: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  p: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                }}
              >
                <Typography variant="subtitle2">
                  {t("dashboard_view_stash_tabs")}
                </Typography>
              </Box>
              <Divider />
              <Box
                ref={stashListContainerRef}
                sx={{
                  overflowY: "auto",
                  minHeight: 0,
                  px: 1,
                  py: 1,
                }}
              >
                <List disablePadding>
                  {[
                    {
                      id: allTabsId,
                      name: t("dashboard_view_all_tabs"),
                      backgroundColor: "#455a64",
                    },
                    ...viewStashTabs,
                  ].map((stashTab) => {
                    const isSelected =
                      effectiveSelectedViewTabId === stashTab.id;

                    return (
                      <ListItemButton
                        key={stashTab.id}
                        selected={isSelected}
                        onClick={() => {
                          setSelectedViewTabId(stashTab.id);
                        }}
                        sx={{
                          mb: 1,
                          borderRadius: 1,
                          color: (theme) =>
                            theme.palette.getContrastText(
                              stashTab.backgroundColor,
                            ),
                          backgroundColor: stashTab.backgroundColor,
                          opacity: isSelected ? 1 : 0.8,
                          "&:hover": {
                            backgroundColor: stashTab.backgroundColor,
                            opacity: 1,
                          },
                          "&.Mui-selected": {
                            backgroundColor: stashTab.backgroundColor,
                            boxShadow: 2,
                          },
                          "&.Mui-selected:hover": {
                            backgroundColor: stashTab.backgroundColor,
                          },
                        }}
                      >
                        <ListItemText
                          primary={stashTab.name}
                          slotProps={{
                            primary: {
                              variant: "body2",
                              fontWeight: isSelected ? 700 : 500,
                              sx: {
                                textShadow:
                                  "0 1px 1px rgba(0,0,0,0.75), 0 0 1px rgba(0,0,0,0.6)",
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column", minHeight: 0 }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="subtitle1">
                  {effectiveSelectedViewTabId === allTabsId
                    ? t("dashboard_view_all_tabs")
                    : viewStashTabs.find(
                        (tab) => tab.id === effectiveSelectedViewTabId,
                      )?.name}
                </Typography>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_view_total_value")}:
                  </Typography>
                  <CurrencyConversionValueDisplay
                    quantity={viewListTotal}
                    currency="chaos"
                    currencyPriceList={snapshotCurrencyList}
                    variant="body2"
                    showRawValueTooltip
                  />
                </Box>
              </Box>
              <Divider />
              {loadingSnapshotData ? (
                <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
                  <CircularProgress size={20} />
                </Box>
              ) : snapshotDataOutOfDate ? (
                <Typography sx={{ p: 2 }} color="warning.main" variant="body2">
                  {t("dashboard_snapshot_outdated", {
                    versionText:
                      snapshotDataVersion !== null
                        ? ` (schema v${snapshotDataVersion})`
                        : "",
                  })}
                </Typography>
              ) : !snapshotData ? (
                <Typography sx={{ p: 2 }} variant="body2">
                  {t("dashboard_view_no_snapshot_data")}
                </Typography>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    p: 1,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(5.75rem, 1fr))",
                    gridAutoRows: "6.1rem",
                    gap: 0.75,
                    alignContent: "start",
                  }}
                >
                  {viewListItems.map((item) => (
                    <Box key={item.id} sx={{ minWidth: 0 }}>
                      <Tooltip title={item.name}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 0.5,
                            width: "100%",
                            height: "100%",
                            minWidth: 0,
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.45,
                            textAlign: "center",
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.25,
                              flex: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {item.quantity}x
                            </Typography>
                            <Box
                              sx={{
                                width: "2.2rem",
                                height: "2.2rem",
                                minHeight: "2.2rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.6rem",
                                lineHeight: 1,
                              }}
                            >
                              {resolveIconUrl(item.icon) ? (
                                <Box
                                  component="img"
                                  src={resolveIconUrl(item.icon) ?? undefined}
                                  alt={item.name}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    display: "block",
                                  }}
                                />
                              ) : (
                                "📦"
                              )}
                            </Box>
                          </Box>
                          <CurrencyConversionValueDisplay
                            quantity={item.quantity}
                            currency={
                              staticTradeData.entryByName.get(item.name)?.entry
                                .id ?? item.name
                            }
                            currencyPriceList={snapshotCurrencyList}
                            variant="body2"
                            fontWeight={700}
                            showRawValueTooltip
                            formatOptions={{
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 1,
                            }}
                          />
                        </Paper>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}
        {tabIndex === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {loadingHistory ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : snapshots.length === 0 ? (
              <Typography variant="body2">
                {t("dashboard_history_no_snapshots")}
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {t("dashboard_history_col_generated")}
                    </TableCell>
                    <TableCell>{t("dashboard_history_col_league")}</TableCell>
                    <TableCell align="right">
                      {t("dashboard_history_col_total_value")}
                    </TableCell>
                    <TableCell align="right">
                      {t("dashboard_history_col_action")}
                    </TableCell>
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
                          {t("dashboard_history_action_load")}
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
              <Typography variant="body2">
                {t("dashboard_history_loading_snapshot_data")}
              </Typography>
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
