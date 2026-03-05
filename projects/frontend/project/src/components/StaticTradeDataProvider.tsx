import type { ReactNode } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { ApiEndpoint } from "@meepen/poe-accountant-api-schema/api/api-endpoints.enum";
import { ApiError } from "@meepen/poe-accountant-api-schema/api/api-service";
import type { StaticTradeDataSnapshot } from "@meepen/poe-accountant-api-schema/api/dtos/prices/static-trade-data.dto";
import { useSession } from "./session-hooks";
import {
  StaticTradeDataActionsContext,
  StaticTradeDataStateContext,
  type StaticTradeDataActionsContextType,
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

  const currencyNameByKey = useMemo(() => {
    const names = new Map<string, string>();
    if (!snapshot) {
      return names;
    }

    for (const category of snapshot.data.result) {
      for (const entry of category.entries) {
        names.set(entry.id, entry.text);
      }
    }

    return names;
  }, [snapshot]);

  const currencyImageByKey = useMemo(() => {
    const images = new Map<string, string>();
    if (!snapshot) {
      return images;
    }

    for (const category of snapshot.data.result) {
      for (const entry of category.entries) {
        if (typeof entry.image === "string" && entry.image.length > 0) {
          images.set(entry.id, entry.image);
        }
      }
    }

    return images;
  }, [snapshot]);

  const stateContextValue = useMemo<StaticTradeDataStateContextType>(
    () => ({
      snapshot,
      currencyNameByKey,
      currencyImageByKey,
      isLoading,
      error,
    }),
    [snapshot, currencyNameByKey, currencyImageByKey, isLoading, error],
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
