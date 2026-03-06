import { Typography, Box, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";
import CurrencyConversionValueDisplay from "../../components/common/CurrencyConversionValueDisplay";
import type { SharedCurrencyItem } from "../../components/league-context";
import ItemTable from "./ItemTable";
import type { DashboardItem } from "./types";

interface LatestSnapshotPanelProps {
  totalNetWorthChaos: number;
  snapshotCurrencyList: SharedCurrencyItem[];
  items: DashboardItem[];
  onRowBaseValueChange: (itemId: string, value: number) => void;
}

export default function LatestSnapshotPanel({
  totalNetWorthChaos,
  snapshotCurrencyList,
  items,
  onRowBaseValueChange,
}: LatestSnapshotPanelProps) {
  const { t } = useTranslation();

  return (
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
        <Typography variant="h6">{t("dashboard_latest_data")}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            component="div"
            sx={{ mb: 0.5 }}
          >
            {t("dashboard_total_net_worth")}
          </Typography>
          <CurrencyConversionValueDisplay
            quantity={totalNetWorthChaos}
            currency="chaos"
            currencyPriceList={snapshotCurrencyList}
            variant="h5"
            color="success.main"
            fontWeight={700}
          />
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <ItemTable
          items={items}
          snapshotCurrencyList={snapshotCurrencyList}
          onRowBaseValueChange={onRowBaseValueChange}
        />
      </Box>
    </Paper>
  );
}
