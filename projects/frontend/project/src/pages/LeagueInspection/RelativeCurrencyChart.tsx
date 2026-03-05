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
import {
  sharedDropdownMenuProps,
  sharedDropdownSx,
} from "../../components/dropdown-styles";
import { useStaticTradeData } from "../../components/session-hooks";
import CurrencyName from "./CurrencyName";

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
  const staticTradeData = useStaticTradeData();
  const relativeCurrencyLabel = t("league_inspection_relative_label");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        notation: "compact",
        compactDisplay: "short",
        maximumFractionDigits: 1,
      }),
    [],
  );
  const seriesWithConfidence = useMemo(
    () =>
      chartData.series.map((series) => ({
        ...series,
        label:
          staticTradeData.entryById.get(series.label)?.entry.text ??
          series.label,
        valueFormatter: (
          value: number | null,
          context: { dataIndex?: number },
        ) => {
          if (value === null || Number.isNaN(value)) {
            return null;
          }
          const formattedValue = compactNumberFormatter.format(value);
          const rawConfidence =
            typeof context.dataIndex === "number"
              ? series.confidence.at(context.dataIndex)
              : null;
          const calculationPath =
            typeof context.dataIndex === "number"
              ? series.calculationPath.at(context.dataIndex)
              : null;
          let confidenceLabel = "n/a";
          let confidencePercentValue: number | null = null;
          if (
            typeof rawConfidence === "number" &&
            !Number.isNaN(rawConfidence)
          ) {
            const percentValue =
              rawConfidence > 1 ? rawConfidence : rawConfidence * 100;
            const rounded = percentValue.toFixed(1).replace(/\.0$/, "");
            confidenceLabel = `${rounded}%`;
            confidencePercentValue = percentValue;
          }
          const shouldShowPath =
            confidencePercentValue !== null &&
            confidencePercentValue < 100 &&
            Array.isArray(calculationPath) &&
            calculationPath.length > 0;
          const translatedPath = calculationPath?.map(
            (currency) =>
              staticTradeData.entryByName.get(currency)?.entry.id ?? currency,
          );
          const pathLabel = shouldShowPath
            ? ` (path: ${translatedPath?.join(" → ") ?? ""})`
            : "";
          return `${formattedValue} (conf: ${confidenceLabel})${pathLabel}`;
        },
      })),
    [chartData.series, compactNumberFormatter, staticTradeData],
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
        <FormControl
          size="small"
          sx={{
            width: "fit-content",
            minWidth: `${Math.max(relativeCurrencyLabel.length + 5, 14)}ch`,
          }}
        >
          <InputLabel id="relative-currency-label">
            {relativeCurrencyLabel}
          </InputLabel>
          <Select
            labelId="relative-currency-label"
            label={relativeCurrencyLabel}
            value={relativeCurrency ?? ""}
            MenuProps={sharedDropdownMenuProps}
            autoWidth
            onChange={(event) => {
              const value = event.target.value;
              onRelativeChange(
                typeof value === "string" && value.length > 0 ? value : null,
              );
            }}
            sx={{
              ...sharedDropdownSx,
              width: "100%",
            }}
          >
            {relativeOptions.map((currency) => (
              <MenuItem key={currency} value={currency}>
                <CurrencyName currencyKey={currency} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
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
            series={seriesWithConfidence}
            margin={{ left: 72, right: 28, top: 20, bottom: 16 }}
            sx={{
              flex: 1,
              overflow: "visible",
            }}
          />
        )}
      </Box>
    </>
  );
}
