import { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
  useLeagueSelection,
  useApi,
  useSession,
  useStaticTradeData,
} from "../components/session-hooks";
import { useTranslation } from "react-i18next";
import ViewHistoryTabs from "./Dashboard/ViewHistoryTabs";
import MoneyChart from "./Dashboard/MoneyChart";
import LatestSnapshotPanel from "./Dashboard/LatestSnapshotPanel";
import SettingsModal from "./Dashboard/SettingsModal";
import type { DashboardItem } from "./Dashboard/types";
import {
  ApiEndpoint,
  SyncUserInventoryJobDataDto as SyncUserInventoryJobDataSchema,
  SyncUserInventoryJobDataSchemaVersion,
  SyncUserInventorySnapshotDataEnvelopeDto as SyncUserInventorySnapshotDataEnvelopeSchema,
  type SyncUserInventoryJobDataDto,
  type UserInventorySnapshotDto,
} from "@meepen/poe-accountant-api-schema";
import type { SharedCurrencyItem } from "../components/league-context";

const POE_IMAGE_BASE_URL = "https://pathofexile.com";
const SYNC_POLL_INTERVAL_MS = 2500;
const SYNC_POLL_MAX_ATTEMPTS = 120;

type ParseSnapshotPayloadResult = {
  data: SyncUserInventoryJobDataDto | null;
  isOutOfDate: boolean;
};

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolvePoeImageUrl(image: string | undefined): string {
  if (!image) {
    return "/vite.svg";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `${POE_IMAGE_BASE_URL}${image}`;
}

function parseSnapshotPayload(payload: unknown): ParseSnapshotPayloadResult {
  const parsed = SyncUserInventoryJobDataSchema.safeParse(payload);
  if (parsed.success) {
    return {
      data: parsed.data,
      isOutOfDate: false,
    };
  }

  const envelope =
    SyncUserInventorySnapshotDataEnvelopeSchema.safeParse(payload);
  if (envelope.success) {
    const version = envelope.data.schemaVersion ?? null;
    return {
      data: null,
      isOutOfDate:
        version !== null && version !== SyncUserInventoryJobDataSchemaVersion,
    };
  }

  return {
    data: null,
    isOutOfDate: false,
  };
}

export default function Dashboard() {
  const staticTradeData = useStaticTradeData();
  const { user } = useSession();
  const { selectedLeague } = useLeagueSelection();
  const api = useApi();
  const { t } = useTranslation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [rowValues, setRowValues] = useState<Record<string, number>>({});
  const [loadedSnapshotData, setLoadedSnapshotData] =
    useState<SyncUserInventoryJobDataDto | null>(null);
  const [loadedSnapshotCurrencyList, setLoadedSnapshotCurrencyList] = useState<
    SharedCurrencyItem[]
  >([]);
  const [inventorySnapshots, setInventorySnapshots] = useState<
    UserInventorySnapshotDto[]
  >([]);
  const [loadingInventorySnapshots, setLoadingInventorySnapshots] =
    useState(false);
  const [inventorySnapshotsError, setInventorySnapshotsError] = useState<
    string | null
  >(null);
  const [requestedSnapshotId, setRequestedSnapshotId] = useState<string | null>(
    null,
  );
  const [_syncStatus, setSyncStatus] = useState<
    { severity: "success" | "error"; message: string } | undefined
  >(undefined);

  const resetRightPaneData = useCallback(() => {
    setLoadedSnapshotData(null);
    setLoadedSnapshotCurrencyList([]);
  }, []);

  const fetchInventorySnapshots = useCallback(async () => {
    if (!selectedLeague) {
      return;
    }

    setLoadingInventorySnapshots(true);
    setInventorySnapshotsError(null);

    try {
      const result = await api.request(ApiEndpoint.GetUserInventorySnapshots, {
        realm: selectedLeague.realm,
        leagueId: selectedLeague.leagueId,
      });
      setInventorySnapshots(result.snapshots);
    } catch (error: unknown) {
      console.error("Failed to load inventory snapshot history", error);
      setInventorySnapshotsError(t("league_inspection_history_error"));
    } finally {
      setLoadingInventorySnapshots(false);
    }
  }, [api, selectedLeague, t]);

  const fetchLatestSnapshotForRightPane = useCallback(async () => {
    if (!selectedLeague) {
      resetRightPaneData();
      return;
    }

    try {
      const latestSnapshotsPage = await api.request(
        ApiEndpoint.GetUserInventorySnapshots,
        {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
        },
      );

      if (latestSnapshotsPage.snapshots.length === 0) {
        resetRightPaneData();
        return;
      }
      const latestSnapshot = latestSnapshotsPage.snapshots[0];

      const [snapshotCurrencyList, payload] = await Promise.all([
        api.request(ApiEndpoint.GetUserInventorySnapshotCurrencyList, {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
          snapshotId: latestSnapshot.id,
        }),
        api.request(ApiEndpoint.GetUserInventorySnapshotData, {
          realm: selectedLeague.realm,
          leagueId: selectedLeague.leagueId,
          snapshotId: latestSnapshot.id,
        }),
      ]);

      const parsedPayload = parseSnapshotPayload(payload);
      if (!parsedPayload.data || parsedPayload.isOutOfDate) {
        resetRightPaneData();
        return;
      }

      setLoadedSnapshotData(parsedPayload.data);
      setLoadedSnapshotCurrencyList(snapshotCurrencyList);
    } catch (error: unknown) {
      console.error("Failed to load latest right-pane snapshot data", error);
      resetRightPaneData();
    }
  }, [api, resetRightPaneData, selectedLeague]);

  const items = useMemo<DashboardItem[]>(() => {
    if (!loadedSnapshotData) {
      return [];
    }

    const grouped = Object.values(loadedSnapshotData.items)
      .flat()
      .reduce<
        Map<
          string,
          {
            id: string;
            name: string;
            imageUrl: string;
            quantity: number;
            totalValue: number;
            currencyId: string;
          }
        >
      >((result, entry) => {
        const currencyId =
          staticTradeData.entryByName.get(entry.itemName)?.entry.id ??
          entry.itemName;
        const key = `${entry.itemId}:${currencyId}`;
        const existing = result.get(key);

        if (existing) {
          result.set(key, {
            ...existing,
            quantity: existing.quantity + entry.count,
            totalValue: existing.totalValue + entry.value,
          });
        } else {
          result.set(key, {
            id: key,
            name: entry.itemName,
            imageUrl: resolvePoeImageUrl(entry.icon ?? undefined),
            quantity: entry.count,
            totalValue: entry.value,
            currencyId,
          });
        }

        return result;
      }, new Map());

    return Array.from(grouped.values())
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        imageUrl: entry.imageUrl,
        quantity: entry.quantity,
        unitValue: entry.quantity > 0 ? entry.totalValue / entry.quantity : 0,
        currencyId: entry.currencyId,
      }))
      .sort((a, b) => b.unitValue * b.quantity - a.unitValue * a.quantity)
      .slice(0, 100);
  }, [loadedSnapshotData, staticTradeData.entryByName]);

  const totalNetWorthChaos = useMemo(
    () => items.reduce((total, item) => total + (rowValues[item.id] ?? 0), 0),
    [items, rowValues],
  );

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const valueA = rowValues[a.id] ?? 0;
      const valueB = rowValues[b.id] ?? 0;
      return valueB - valueA;
    });
  }, [items, rowValues]);

  const handleRowValues = (itemId: string, value: number) => {
    setRowValues((current) => {
      const numericValue = value;
      if (current[itemId] === numericValue) {
        return current;
      }
      return {
        ...current,
        [itemId]: numericValue,
      };
    });
  };

  useEffect(() => {
    if (!user || !selectedLeague) {
      return;
    }

    void fetchInventorySnapshots();
    void fetchLatestSnapshotForRightPane();
  }, [
    fetchInventorySnapshots,
    fetchLatestSnapshotForRightPane,
    selectedLeague,
    user,
  ]);

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
    if (isSyncing || !selectedLeague) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus(undefined);

    try {
      const result = await api.request(ApiEndpoint.SyncUserInventory, {
        realm: selectedLeague.realm,
        leagueId: selectedLeague.leagueId,
      });

      let done = result.done;
      let attempts = 0;

      while (!done && attempts < SYNC_POLL_MAX_ATTEMPTS) {
        attempts += 1;
        await waitFor(SYNC_POLL_INTERVAL_MS);
        const jobResult = await api.request(ApiEndpoint.GetUserJobResult, {
          jobId: result.id,
        });

        done =
          typeof (jobResult as { done?: unknown }).done === "boolean"
            ? Boolean((jobResult as { done?: boolean }).done)
            : false;
      }

      if (!done) {
        setSyncStatus({
          severity: "error",
          message: t("dashboard_sync_error"),
        });
        return;
      }

      await fetchInventorySnapshots();
      await fetchLatestSnapshotForRightPane();

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
          width: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: 0,
          minWidth: 0,
          overflowY: "auto",
        }}
      >
        {/* Top Chart */}
        <Box
          sx={{
            flex: "3 1 0",
            minHeight: "16rem",
            minWidth: 0,
            width: "100%",
            display: "flex",
            overflow: "hidden",
          }}
        >
          <MoneyChart
            snapshots={inventorySnapshots}
            loading={loadingInventorySnapshots}
            error={inventorySnapshotsError}
            onSnapshotClick={(snapshotId) => {
              setRequestedSnapshotId(snapshotId);
            }}
          />
        </Box>

        {/* Bottom Section */}
        <Box
          sx={{
            flex: "2 1 0",
            minHeight: "18rem",
            display: "flex",
          }}
        >
          <ViewHistoryTabs
            onOpenSettings={handleOpenSettings}
            isSyncing={isSyncing}
            handleSync={handleSync}
            requestedSnapshotId={requestedSnapshotId}
            onRequestedSnapshotHandled={() => {
              setRequestedSnapshotId(null);
            }}
          />
        </Box>
      </Box>

      {/* Right Side */}
      <Box
        sx={{
          flex: 1,
          minWidth: "18.75rem",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <LatestSnapshotPanel
          totalNetWorthChaos={totalNetWorthChaos}
          snapshotCurrencyList={loadedSnapshotCurrencyList}
          items={sortedItems}
          onRowBaseValueChange={handleRowValues}
        />
      </Box>

      {/* Settings Modal */}
      <SettingsModal open={settingsOpen} onClose={handleCloseSettings} />
    </Box>
  );
}
