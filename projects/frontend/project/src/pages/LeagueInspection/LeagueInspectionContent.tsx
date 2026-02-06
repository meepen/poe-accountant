import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ChartData, PriceListItem } from "./types";
import CurrencyTable from "./CurrencyTable";
import RelativeCurrencyChart from "./RelativeCurrencyChart";

type LeagueInspectionContentProps = {
  leagueLoading: boolean;
  hasLeagues: boolean;
  currencyLoading: boolean;
  currencyError: string | null;
  currencyList: PriceListItem[] | null;
  selectedCurrencies: string[];
  relativeCurrency: string | null;
  onRelativeCurrencyChange: (value: string | null) => void;
  onToggleCurrency: (currency: string) => void;
  chartData: ChartData;
  chartLoading: boolean;
  chartHasData: boolean;
  chartError: string | null;
};

export default function LeagueInspectionContent({
  leagueLoading,
  hasLeagues,
  currencyLoading,
  currencyError,
  currencyList,
  selectedCurrencies,
  relativeCurrency,
  onRelativeCurrencyChange,
  onToggleCurrency,
  chartData,
  chartLoading,
  chartHasData,
  chartError,
}: LeagueInspectionContentProps) {
  const { t } = useTranslation();

  if (leagueLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasLeagues) {
    return (
      <Typography variant="body1">{t("league_inspection_empty")}</Typography>
    );
  }

  if (currencyLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (currencyError) {
    return <Typography variant="body1">{currencyError}</Typography>;
  }

  if (!currencyList || currencyList.length === 0) {
    return (
      <Typography variant="body1">
        {t("league_inspection_currency_empty")}
      </Typography>
    );
  }

  const relativeOptions = Array.from(
    new Set(currencyList.map((item) => item.value.currency)),
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        alignItems: "stretch",
        flex: 1,
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Paper
        sx={{
          flex: 2,
          height: "100%",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          p: 2,
          gap: 2,
          overflow: "hidden",
        }}
      >
        <RelativeCurrencyChart
          relativeCurrency={relativeCurrency}
          relativeOptions={relativeOptions}
          selectedCurrencies={selectedCurrencies}
          chartData={chartData}
          chartLoading={chartLoading}
          chartHasData={chartHasData}
          chartError={chartError}
          onRelativeChange={onRelativeCurrencyChange}
        />
      </Paper>
      <CurrencyTable
        currencyList={currencyList}
        selectedCurrencies={selectedCurrencies}
        onToggleCurrency={onToggleCurrency}
      />
    </Box>
  );
}
