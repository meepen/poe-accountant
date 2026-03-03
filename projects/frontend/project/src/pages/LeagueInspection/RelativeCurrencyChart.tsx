import {
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ChartData } from "./types";

type RelativeCurrencyChartProps = {
  relativeCurrency: string | null;
  relativeOptions: string[];
  selectedCurrencies: string[];
  chartData: ChartData;
  chartLoading: boolean;
  chartHasData: boolean;
  chartError: string | null;
  onRelativeChange: (value: string | null) => void;
};

export default function RelativeCurrencyChart({
  relativeCurrency,
  relativeOptions,
  selectedCurrencies,
  chartData,
  chartLoading,
  chartHasData,
  chartError,
  onRelativeChange,
}: RelativeCurrencyChartProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesWithConfidence = useMemo(
    () =>
      chartData.series.map((series) => ({
        ...series,
        valueFormatter: (
          value: number | null,
          context: { dataIndex?: number },
        ) => {
          if (value === null || Number.isNaN(value)) {
            return null;
          }
          const rawConfidence =
            typeof context.dataIndex === "number"
              ? series.confidence.at(context.dataIndex)
              : null;
          let confidenceLabel = "n/a";
          if (
            typeof rawConfidence === "number" &&
            !Number.isNaN(rawConfidence)
          ) {
            const percentValue =
              rawConfidence > 1 ? rawConfidence : rawConfidence * 100;
            const rounded = percentValue.toFixed(1).replace(/\.0$/, "");
            confidenceLabel = `${rounded}%`;
          }
          return `${value} (conf: ${confidenceLabel})`;
        },
      })),
    [chartData.series],
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography variant="h6">
          {t("league_inspection_relative_title")}
          {relativeCurrency ? ` (${relativeCurrency})` : ""}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="relative-currency-label">
            {t("league_inspection_relative_label")}
          </InputLabel>
          <Select
            labelId="relative-currency-label"
            label={t("league_inspection_relative_label")}
            value={relativeCurrency ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              onRelativeChange(
                typeof value === "string" && value.length > 0 ? value : null,
              );
            }}
          >
            {relativeOptions.map((currency) => (
              <MenuItem key={currency} value={currency}>
                {currency}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
        ref={containerRef}
      >
        {selectedCurrencies.length === 0 ? (
          <Typography variant="body2">
            {t("league_inspection_graph_empty")}
          </Typography>
        ) : chartLoading && !chartHasData ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : chartError && !chartHasData ? (
          <Typography variant="body2">{chartError}</Typography>
        ) : !chartHasData ? (
          <Typography variant="body2">
            {t("league_inspection_history_empty")}
          </Typography>
        ) : (
          <LineChart
            grid={{ vertical: true, horizontal: true }}
            axisHighlight={{ x: "line" }}
            xAxis={[
              {
                data: chartData.x,
                scaleType: "time",
                label: t("league_inspection_time_label"),
                tickLabelStyle: {
                  angle: -45,
                  textAnchor: "end",
                  fontSize: 11,
                  // Move labels down manually if needed
                  transform: "translateY(10px)",
                },
              },
            ]}
            series={seriesWithConfidence}
            margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
            sx={{
              overflow: "visible",
            }}
          />
        )}
      </Box>
    </>
  );
}
