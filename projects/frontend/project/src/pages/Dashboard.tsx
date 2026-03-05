import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import {
  useLeagueSelection,
  useApi,
  useSession,
  useStaticTradeData,
} from "../components/session-hooks";
import { useTranslation } from "react-i18next";
import ViewHistoryTabs from "./Dashboard/ViewHistoryTabs";
import {
  ApiEndpoint,
  type UserInventorySnapshotDto,
} from "@meepen/poe-accountant-api-schema";
import CurrencyValueDisplay from "../components/common/CurrencyValueDisplay";

interface DashboardItem {
  name: string;
  imageUrl: string;
  quantity: number;
  unitValue: number;
  currencyId: string;
}

const POE_IMAGE_BASE_URL = "https://pathofexile.com";
const SYNC_POLL_INTERVAL_MS = 2500;
const SYNC_POLL_MAX_ATTEMPTS = 120;

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolvePoeImageUrl(image: string | undefined): string {
  if (!image) {
    return "/vite.svg";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `${POE_IMAGE_BASE_URL}${image}`;
}

interface MoneyChartProps {
  snapshots: UserInventorySnapshotDto[];
  loading: boolean;
  error: string | null;
}

function MoneyChart({ snapshots, loading, error }: MoneyChartProps) {
  const { t } = useTranslation();
  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
      }),
    [],
  );

  const chartData = useMemo(
    () =>
      snapshots
        .map((snapshot) => {
          const timestamp = new Date(snapshot.generatedAt);
          const value = Number(snapshot.totalValue);

          if (Number.isNaN(timestamp.getTime()) || Number.isNaN(value)) {
            return null;
          }

          return {
            timestamp,
            value,
          };
        })
        .filter((entry): entry is { timestamp: Date; value: number } =>
          Boolean(entry),
        )
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    [snapshots],
  );

  const hasData = chartData.length > 0;

  return (
    <Paper
      sx={{
        p: 2,
        height: "35rem",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {loading && !hasData ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4, flex: 1 }}>
            <CircularProgress />
          </Box>
        ) : error && !hasData ? (
          <Typography variant="body2">{error}</Typography>
        ) : !hasData ? (
          <Typography variant="body2">
            {t("league_inspection_history_empty")}
          </Typography>
        ) : (
          <LineChart
            grid={{ vertical: true, horizontal: true }}
            axisHighlight={{ x: "line" }}
            xAxis={[
              {
                data: chartData.map((entry) => entry.timestamp),
                scaleType: "time",
                label: t("league_inspection_time_label"),
                height: 84,
                valueFormatter: (value: Date) =>
                  value.toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                tickLabelStyle: {
                  angle: -30,
                  textAnchor: "end",
                  fontSize: 11,
                },
              },
            ]}
            yAxis={[
              {
                valueFormatter: (value: number | null) =>
                  typeof value === "number" && !Number.isNaN(value)
                    ? compactNumberFormatter.format(value)
                    : "",
              },
            ]}
            series={[
              {
                data: chartData.map((entry) => entry.value),
              },
            ]}
            margin={{ left: 72, right: 28, top: 20, bottom: 16 }}
            sx={{
              flex: 1,
              overflow: "visible",
            }}
          />
        )}
      </Box>
    </Paper>
  );
}

interface ItemTableProps {
  items: DashboardItem[];
  onRowChaosValueChange: (itemName: string, value: number | null) => void;
}

function ItemTable({ items, onRowChaosValueChange }: ItemTableProps) {
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
          {items.map((row) => (
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                  >
                    {`${row.quantity}x`}
                  </Typography>
                  <img
                    src={row.imageUrl}
                    alt={row.name}
                    width={24}
                    height={24}
                  />
                  {row.name}
                </Box>
              </TableCell>
              <TableCell align="right">
                <CurrencyValueDisplay
                  value={row.unitValue}
                  quantity={row.quantity}
                  inputCurrency={row.currencyId}
                  onChaosValueChange={(value) => {
                    onRowChaosValueChange(row.name, value);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function Dashboard() {
  const { user } = useSession();
  const { selectedLeague } = useLeagueSelection();

  const api = useApi();
  const { t } = useTranslation();
  const { snapshot, loadStaticTradeData } = useStaticTradeData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rowChaosValues, setRowChaosValues] = useState<Record<string, number>>(
    {},
  );
  const [inventorySnapshots, setInventorySnapshots] =
    useState<UserInventorySnapshotDto[]>([]);
  const [loadingInventorySnapshots, setLoadingInventorySnapshots] =
    useState(false);
  const [inventorySnapshotsError, setInventorySnapshotsError] = useState<
    string | null
  >(null);
  const [_syncStatus, setSyncStatus] = useState<
    { severity: "success" | "error"; message: string } | undefined
  >(undefined);

  const fetchInventorySnapshots = useCallback(async () => {
    if (!selectedLeague) {
      return;
    }

    setLoadingInventorySnapshots(true);
    setInventorySnapshotsError(null);

    try {
      const result = await api.request(ApiEndpoint.GetUserInventorySnapshots, {
        realm: selectedLeague.realm,
        leagueId: selectedLeague.leagueId,
      });
      setInventorySnapshots(result.snapshots);
    } catch (error: unknown) {
      console.error("Failed to load inventory snapshot history", error);
      setInventorySnapshotsError(t("league_inspection_history_error"));
    } finally {
      setLoadingInventorySnapshots(false);
    }
  }, [api, selectedLeague, t]);

  const items = useMemo<DashboardItem[]>(() => {
    if (!snapshot) {
      return [];
    }

    const entries = snapshot.data.result.flatMap(
      (category) => category.entries,
    );
    return entries.slice(0, 5).map((entry) => {
      const placeholderQuantity =
        (entry.id
          .split("")
          .reduce((sum, character) => sum + character.charCodeAt(0), 0) %
          50000) +
        1;
      return {
        name: entry.text,
        imageUrl: resolvePoeImageUrl(entry.image),
        quantity: placeholderQuantity,
        unitValue: 1,
        currencyId: entry.id,
      };
    });
  }, [snapshot]);

  const totalNetWorthChaos = useMemo(
    () =>
      items.reduce(
        (total, item) => total + (rowChaosValues[item.name] ?? 0),
        0,
      ),
    [items, rowChaosValues],
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const valueA = rowChaosValues[a.name] ?? 0;
      const valueB = rowChaosValues[b.name] ?? 0;
      return valueB - valueA;
    });
  }, [items, rowChaosValues]);

  const handleRowChaosValueChange = (
    itemName: string,
    value: number | null,
  ) => {
    setRowChaosValues((current) => {
      const numericValue = value ?? 0;
      if (current[itemName] === numericValue) {
        return current;
      }
      return {
        ...current,
        [itemName]: numericValue,
      };
    });
  };

  useEffect(() => {
    void loadStaticTradeData();
  }, [loadStaticTradeData]);

  useEffect(() => {
    if (!user || !selectedLeague) {
      return;
    }

    void fetchInventorySnapshots();
  }, [fetchInventorySnapshots, selectedLeague, user]);

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
    if (isSyncing || !selectedLeague) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus(undefined);

    try {
      const result = await api.request(ApiEndpoint.SyncUserInventory, {
        realm: selectedLeague.realm,
        leagueId: selectedLeague.leagueId,
      });

      let done = result.done;
      let attempts = 0;

      while (!done && attempts < SYNC_POLL_MAX_ATTEMPTS) {
        attempts += 1;
        await waitFor(SYNC_POLL_INTERVAL_MS);
        const jobResult = await api.request(ApiEndpoint.GetUserJobResult, {
          jobId: result.id,
        });

        done =
          typeof (jobResult as { done?: unknown }).done === "boolean"
            ? Boolean((jobResult as { done?: boolean }).done)
            : false;
      }

      if (!done) {
        setSyncStatus({
          severity: "error",
          message: t("dashboard_sync_error"),
        });
        return;
      }

      await fetchInventorySnapshots();

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
        {/* Top Chart */}
        <MoneyChart
          snapshots={inventorySnapshots}
          loading={loadingInventorySnapshots}
          error={inventorySnapshotsError}
        />

        {/* Bottom Section */}
        <ViewHistoryTabs
          onOpenSettings={handleOpenSettings}
          isSyncing={isSyncing}
          handleSync={handleSync}
        />
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
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography variant="h6">{t("section_items")}</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ textAlign: "right" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                component="div"
                sx={{ mb: 0.5 }}
              >
                Total Net Worth
              </Typography>
              <CurrencyValueDisplay
                value={items.length > 0 ? totalNetWorthChaos : null}
                inputCurrency="chaos"
                variant="h5"
                color="success.main"
                fontWeight={700}
              />
            </Box>
          </Box>
          <Box sx={{ flex: 1, overflow: "hidden" }}>
            <ItemTable
              items={sortedItems}
              onRowChaosValueChange={handleRowChaosValueChange}
            />
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
