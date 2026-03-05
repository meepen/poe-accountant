import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints";
import { useSession } from "./session-hooks";
import {
  getLeagueKey,
  LeagueContext,
  type League,
  type LeagueContextType,
  type SharedCurrencyItem,
} from "./league-context";

export function LeagueProvider({ children }: { children: ReactNode }) {
  const { user, api, isLoading, userSettings } = useSession();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(false);
  const [sharedCurrencyList, setSharedCurrencyList] = useState<
    SharedCurrencyItem[]
  >([]);
  const [sharedCurrencyListLoading, setSharedCurrencyListLoading] =
    useState(false);
  const [selectedLeagueKey, setSelectedLeagueKey] = useState<string | null>(
    null,
  );
  const hasInitializedFromUserSettingsRef = useRef(false);
  const lastPatchedLeagueIdRef = useRef<string | null | undefined>(undefined);

  const refreshLeagues = useCallback(async () => {
    if (!user) {
      setLeagues([]);
      setSelectedLeagueKey(null);
      setLeaguesLoading(false);
      return;
    }

    setLeaguesLoading(true);
    try {
      const result = await api.request(ApiEndpoint.GetUserLeagues);
      const preferredLeagueId = !hasInitializedFromUserSettingsRef.current
        ? (userSettings?.currentLeagueId ?? null)
        : null;
      const preferredLeague = preferredLeagueId
        ? result.find((league) => league.id === preferredLeagueId)
        : null;

      setLeagues(result);
      setSelectedLeagueKey((current) => {
        if (preferredLeague) {
          return getLeagueKey(preferredLeague);
        }

        if (!current) {
          return result.length > 0 ? getLeagueKey(result[0]) : null;
        }

        const exists = result.some(
          (league) => getLeagueKey(league) === current,
        );
        if (exists) {
          return current;
        }

        return result.length > 0 ? getLeagueKey(result[0]) : null;
      });
      hasInitializedFromUserSettingsRef.current = true;
    } catch (error) {
      console.error("Failed to fetch leagues:", error);
      setLeagues([]);
      setSelectedLeagueKey(null);
    } finally {
      setLeaguesLoading(false);
    }
  }, [api, user, userSettings]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void refreshLeagues();
  }, [isLoading, refreshLeagues]);

  useEffect(() => {
    if (!user) {
      hasInitializedFromUserSettingsRef.current = false;
      lastPatchedLeagueIdRef.current = undefined;
    }
  }, [user]);

  const selectedLeague = useMemo(
    () =>
      leagues.find((league) => getLeagueKey(league) === selectedLeagueKey) ??
      null,
    [leagues, selectedLeagueKey],
  );

  useEffect(() => {
    if (
      !user ||
      isLoading ||
      leaguesLoading ||
      !hasInitializedFromUserSettingsRef.current
    ) {
      return;
    }

    const selectedLeagueId = selectedLeague?.id ?? null;
    if (lastPatchedLeagueIdRef.current === selectedLeagueId) {
      return;
    }
    lastPatchedLeagueIdRef.current = selectedLeagueId;

    void api
      .request(ApiEndpoint.UpdateUserSettings, {
        currentLeagueId: selectedLeagueId,
      })
      .catch((error: unknown) => {
        console.error("Failed to persist user league settings:", error);
      });
  }, [api, user, isLoading, leaguesLoading, selectedLeague]);

  const refreshSharedCurrencyList = useCallback(async () => {
    if (!user || !selectedLeague) {
      setSharedCurrencyList([]);
      setSharedCurrencyListLoading(false);
      return;
    }

    setSharedCurrencyListLoading(true);
    try {
      const result = await api.request(
        ApiEndpoint.GetExchangeRatesCurrencyList,
        {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
        },
      );
      setSharedCurrencyList(result);
    } catch (error) {
      console.error("Failed to fetch shared currency list:", error);
      setSharedCurrencyList([]);
    } finally {
      setSharedCurrencyListLoading(false);
    }
  }, [api, selectedLeague, user]);

  useEffect(() => {
    void refreshSharedCurrencyList();
  }, [refreshSharedCurrencyList]);

  const contextValue = useMemo<LeagueContextType>(
    () => ({
      leagues,
      leaguesLoading,
      selectedLeagueKey,
      selectedLeague,
      sharedCurrencyList,
      sharedCurrencyListLoading,
      setSelectedLeagueKey,
      refreshLeagues,
      refreshSharedCurrencyList,
    }),
    [
      leagues,
      leaguesLoading,
      selectedLeagueKey,
      selectedLeague,
      sharedCurrencyList,
      sharedCurrencyListLoading,
      setSelectedLeagueKey,
      refreshLeagues,
      refreshSharedCurrencyList,
    ],
  );

  return <LeagueContext value={contextValue}>{children}</LeagueContext>;
}
