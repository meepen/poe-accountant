import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Container } from "@mui/material";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { useTranslation } from "react-i18next";
import LeagueInspectionContent from "./LeagueInspection/LeagueInspectionContent";
import LeagueInspectionHeader from "./LeagueInspection/LeagueInspectionHeader";
import type {
  ChartData,
  HistoryState,
  League,
  PriceHistoryItem,
  PriceListItem,
} from "./LeagueInspection/types";
import { useApi } from "../components/session-hooks";

const DEFAULT_CURRENCY_MATCH = /^(divine)$/i;

export default function LeagueInspection() {
  const api = useApi();
  const { t } = useTranslation();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leagueLoading, setLeagueLoading] = useState(true);
  const [selectedLeagueKey, setSelectedLeagueKey] = useState<string | null>(
    null,
  );
  const [currencyList, setCurrencyList] = useState<PriceListItem[] | null>(
    null,
  );
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [relativeCurrency, setRelativeCurrency] = useState<string | null>(null);
  const [historyByCurrency, setHistoryByCurrency] = useState<
    Record<string, HistoryState | undefined>
  >({});
  const toggleCurrency = useCallback((currency: string) => {
    setSelectedCurrencies((current) =>
      current.includes(currency)
        ? current.filter((item) => item !== currency)
        : [...current, currency],
    );
  }, []);

  const historyByCurrencyRef = useRef(historyByCurrency);

  useEffect(() => {
    historyByCurrencyRef.current = historyByCurrency;
  }, [historyByCurrency]);

  useEffect(() => {
    let mounted = true;

    async function fetchLeagues() {
      try {
        const result = await api.request(ApiEndpoint.GetUserLeagues);
        if (!mounted) {
          return;
        }
        setLeagues(result);
        if (result.length > 0) {
          const latest = result[0];
          setSelectedLeagueKey(
            (current) => current ?? `${latest.realm}:${latest.leagueId}`,
          );
        }
      } catch (error) {
        console.error("Failed to fetch leagues:", error);
      } finally {
        if (mounted) {
          setLeagueLoading(false);
        }
      }
    }

    void fetchLeagues();

    return () => {
      mounted = false;
    };
  }, [api]);

  const selectedLeague = useMemo(
    () =>
      leagues.find(
        (league) => `${league.realm}:${league.leagueId}` === selectedLeagueKey,
      ) ?? null,
    [leagues, selectedLeagueKey],
  );

  useEffect(() => {
    if (!selectedLeague) {
      return;
    }

    const league = selectedLeague;
    let mounted = true;

    async function fetchCurrencyList() {
      try {
        setCurrencyLoading(true);
        setCurrencyError(null);
        setSelectedCurrencies([]);
        setHistoryByCurrency({});
        const result = await api.request(
          ApiEndpoint.GetExchangeRatesCurrencyList,
          {
            realm: league.realm,
            leagueId: league.leagueId,
          },
        );
        if (mounted) {
          setCurrencyList(result);
          const defaults = result
            .filter((item) => DEFAULT_CURRENCY_MATCH.test(item.currency))
            .map((item) => item.currency);
          setSelectedCurrencies(defaults);
          const stableCurrencies = Array.from(
            new Set(result.map((item) => item.value.currency)),
          );
          const defaultRelative =
            stableCurrencies.find((currency) => /chaos/i.test(currency)) ||
            stableCurrencies[0] ||
            null;
          setRelativeCurrency(defaultRelative);
        }
      } catch (error) {
        console.error("Failed to fetch currency list:", error);
        if (mounted) {
          setCurrencyError(t("league_inspection_currency_error"));
          setCurrencyList(null);
        }
      } finally {
        if (mounted) {
          setCurrencyLoading(false);
        }
      }
    }

    void fetchCurrencyList();

    return () => {
      mounted = false;
    };
  }, [api, selectedLeague, t]);

  useEffect(() => {
    if (!selectedLeague || selectedCurrencies.length === 0) {
      return;
    }

    const league = selectedLeague;
    let mounted = true;

    async function fetchHistoryForCurrency(currency: string) {
      try {
        setHistoryByCurrency((prev) => ({
          ...prev,
          [currency]: {
            loading: true,
            data: null,
            error: null,
          },
        }));
        const result = (await api.request(
          ApiEndpoint.GetExchangeRatesCurrencyHistorical,
          {
            realm: league.realm,
            leagueId: league.leagueId,
            currency,
          },
        )) as PriceHistoryItem[];
        if (mounted) {
          setHistoryByCurrency((prev) => ({
            ...prev,
            [currency]: {
              loading: false,
              data: result,
              error: null,
            },
          }));
        }
      } catch (error) {
        console.error("Failed to fetch currency history:", error);
        if (mounted) {
          setHistoryByCurrency((prev) => ({
            ...prev,
            [currency]: {
              loading: false,
              data: null,
              error: t("league_inspection_history_error"),
            },
          }));
        }
      }
    }

    selectedCurrencies.forEach((currency) => {
      const existing = historyByCurrencyRef.current[currency];
      if (!existing || (!existing.data && !existing.loading)) {
        void fetchHistoryForCurrency(currency);
      }
    });

    return () => {
      mounted = false;
    };
  }, [api, selectedCurrencies, selectedLeague, t]);

  const chartData: ChartData = useMemo(() => {
    if (selectedCurrencies.length === 0 || !relativeCurrency) {
      return {
        x: [],
        series: [],
      };
    }

    const timestamps = new Set<number>();
    selectedCurrencies.forEach((currency) => {
      const entries = historyByCurrency[currency]?.data ?? [];
      entries
        .filter((entry) => entry.stableCurrency === relativeCurrency)
        .forEach((entry) => {
          const time = new Date(entry.dataStaleness).getTime();
          if (!Number.isNaN(time)) {
            timestamps.add(time);
          }
        });
    });

    const x = Array.from(timestamps)
      .sort((a, b) => a - b)
      .map((time) => new Date(time));

    const series = selectedCurrencies.map((currency) => {
      const entries = historyByCurrency[currency]?.data ?? [];
      const valueByTime = new Map<number, number>();
      const confidenceByTime = new Map<number, number>();
      entries
        .filter((entry) => entry.stableCurrency === relativeCurrency)
        .forEach((entry) => {
          const time = new Date(entry.dataStaleness).getTime();
          const value = Number(entry.valuedAt);
          const confidence =
            typeof entry.confidenceScore === "number"
              ? entry.confidenceScore
              : null;
          if (!Number.isNaN(time) && !Number.isNaN(value)) {
            valueByTime.set(time, value);
            if (confidence !== null && !Number.isNaN(confidence)) {
              confidenceByTime.set(time, confidence);
            }
          }
        });

      const data = x.map((time) => valueByTime.get(time.getTime()) ?? null);
      const confidence = x.map(
        (time) => confidenceByTime.get(time.getTime()) ?? null,
      );
      return {
        data,
        confidence,
        label: currency,
      };
    });

    return { x, series };
  }, [historyByCurrency, relativeCurrency, selectedCurrencies]);

  const chartLoading = useMemo(
    () =>
      selectedCurrencies.some(
        (currency) => historyByCurrency[currency]?.loading,
      ),
    [historyByCurrency, selectedCurrencies],
  );

  const chartHasData = useMemo(
    () =>
      chartData.series.some((series) =>
        series.data.some((value) => value !== null),
      ),
    [chartData.series],
  );

  const chartError = useMemo(() => {
    for (const currency of selectedCurrencies) {
      const error = historyByCurrency[currency]?.error;
      if (error) {
        return error;
      }
    }
    return null;
  }, [historyByCurrency, selectedCurrencies]);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        height: "100%",
        p: 4,
        gap: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          flex: 1,
          minHeight: 0,
          height: "100%",
          overflow: "hidden",
        }}
      >
        <LeagueInspectionHeader
          leagues={leagues}
          selectedLeagueKey={selectedLeagueKey}
          leagueLoading={leagueLoading}
          onLeagueChange={setSelectedLeagueKey}
        />
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            height: "100%",
            minHeight: 0,
          }}
        >
          <LeagueInspectionContent
            leagueLoading={leagueLoading}
            hasLeagues={leagues.length > 0}
            currencyLoading={currencyLoading}
            currencyError={currencyError}
            currencyList={currencyList}
            selectedCurrencies={selectedCurrencies}
            relativeCurrency={relativeCurrency}
            onRelativeCurrencyChange={setRelativeCurrency}
            onToggleCurrency={toggleCurrency}
            chartData={chartData}
            chartLoading={chartLoading}
            chartHasData={chartHasData}
            chartError={chartError}
          />
        </Box>
      </Box>
    </Container>
  );
}
