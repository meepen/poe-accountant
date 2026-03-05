import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Box,
  Paper,
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
} from "@mui/material";
import {
  useApi,
  useSession,
  useStaticTradeData,
} from "../components/session-hooks";
import { useTranslation } from "react-i18next";
import ViewHistoryTabs from "./Dashboard/ViewHistoryTabs";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema";
import CurrencyValueDisplay from "../components/CurrencyValueDisplay";

interface DashboardItem {
  name: string;
  imageUrl: string;
  quantity: number;
  unitValue: number;
  currencyId: string;
}

const POE_IMAGE_BASE_URL = "https://pathofexile.com";

function resolvePoeImageUrl(image: string | undefined): string {
  if (!image) {
    return "/vite.svg";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `${POE_IMAGE_BASE_URL}${image}`;
}

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

  const api = useApi();
  const { t } = useTranslation();
  const { snapshot, loadStaticTradeData } = useStaticTradeData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rowChaosValues, setRowChaosValues] = useState<Record<string, number>>(
    {},
  );
  const [_syncStatus, setSyncStatus] = useState<
    { severity: "success" | "error"; message: string } | undefined
  >(undefined);

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
        {/* Top Chart */}
        <MoneyChart />

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
