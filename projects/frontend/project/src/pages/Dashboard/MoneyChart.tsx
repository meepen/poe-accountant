import { useMemo } from "react";
import { Typography, Box, Paper, CircularProgress } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { useTranslation } from "react-i18next";
import type { UserInventorySnapshotDto } from "@meepen/poe-accountant-api-schema";

interface MoneyChartProps {
  snapshots: UserInventorySnapshotDto[];
  loading: boolean;
  error: string | null;
  onSnapshotClick: (snapshotId: string) => void;
}

export default function MoneyChart({
  snapshots,
  loading,
  error,
  onSnapshotClick,
}: MoneyChartProps) {
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
            id: snapshot.id,
            timestamp,
            value,
          };
        })
        .filter(
          (entry): entry is { id: string; timestamp: Date; value: number } =>
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
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {loading && !hasData ? (
          <Box
            sx={{ display: "flex", justifyContent: "center", p: 4, flex: 1 }}
          >
            <CircularProgress />
          </Box>
        ) : error && !hasData ? (
          <Typography variant="body2">{error}</Typography>
        ) : !hasData ? (
          <Typography variant="body2">
            {t("league_inspection_history_empty")}
          </Typography>
        ) : (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          >
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
                  min: 0,
                  valueFormatter: (value: number | null) =>
                    typeof value === "number" && !Number.isNaN(value)
                      ? compactNumberFormatter.format(value)
                      : "",
                },
              ]}
              series={[
                {
                  data: chartData.map((entry) => entry.value),
                  showMark: true,
                },
              ]}
              onAxisClick={(_event, data) => {
                if (!data) {
                  return;
                }

                const selected = chartData.at(data.dataIndex);
                if (!selected) {
                  return;
                }

                onSnapshotClick(selected.id);
              }}
              margin={{ left: 72, right: 28, top: 20, bottom: 16 }}
              sx={{ width: "100%", height: "100%" }}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
}
