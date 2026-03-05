import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints";
import { ApiError } from "@meepen/poe-accountant-api-schema/api/api-service";
import type { StaticTradeDataSnapshot } from "@meepen/poe-accountant-api-schema/api/dtos/prices/static-trade-data.dto";
import { useSession } from "./session-hooks";
import {
  StaticTradeDataActionsContext,
  StaticTradeDataStateContext,
  type StaticTradeDataActionsContextType,
  type StaticTradeDataEntry,
  type StaticTradeDataStateContextType,
} from "./static-trade-data-context";

export function StaticTradeDataProvider({ children }: { children: ReactNode }) {
  const { api } = useSession();
  const loadingRef = useRef(false);
  const snapshotRef = useRef<StaticTradeDataSnapshot | null>(null);
  const [snapshot, setSnapshot] = useState<StaticTradeDataSnapshot | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo<StaticTradeDataEntry[]>(() => {
    if (!snapshot) {
      return [];
    }

    return snapshot.data.result.flatMap((category) =>
      category.entries.map((entry) => ({
        entry,
        category,
      })),
    );
  }, [snapshot]);

  const loadStaticTradeData = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      if (!force && (snapshotRef.current || loadingRef.current)) {
        return;
      }

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.request(ApiEndpoint.GetStaticTradeData);
        snapshotRef.current = result;
        setSnapshot(result);
      } catch (loadError) {
        if (loadError instanceof ApiError && loadError.status === 404) {
          return;
        }
        console.error("Failed to load static trade data:", loadError);
        setError("Failed to load static trade data");
      } finally {
        loadingRef.current = false;
        setIsLoading(false);
      }
    },
    [api],
  );

  const clearStaticTradeData = useCallback(() => {
    snapshotRef.current = null;
    setSnapshot(null);
    setError(null);
  }, []);

  const entryById = useMemo(
    () =>
      entries.reduce(
        (map, entry) => map.set(entry.entry.id, entry),
        new Map<string, StaticTradeDataEntry>(),
      ),
    [entries],
  );

  const entryByName = useMemo(
    () =>
      entries.reduce(
        (map, entry) => map.set(entry.entry.text, entry),
        new Map<string, StaticTradeDataEntry>(),
      ),
    [entries],
  );

  const stateContextValue = useMemo<StaticTradeDataStateContextType>(
    () => ({
      entries,
      entryById,
      entryByName,
      isLoading,
      error,
    }),
    [entries, entryById, entryByName, isLoading, error],
  );

  const actionsContextValue = useMemo<StaticTradeDataActionsContextType>(
    () => ({
      loadStaticTradeData,
      clearStaticTradeData,
    }),
    [loadStaticTradeData, clearStaticTradeData],
  );

  return (
    <StaticTradeDataActionsContext value={actionsContextValue}>
      <StaticTradeDataStateContext value={stateContextValue}>
        {children}
      </StaticTradeDataStateContext>
    </StaticTradeDataActionsContext>
  );
}
