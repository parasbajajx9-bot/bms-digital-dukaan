import { useAuth } from "@clerk/react";
import { useEffect, useState, type ReactNode } from "react";
import {
  getCloudShopData,
  saveCloudShopData,
  downloadShopBackup,
} from "@/lib/cloud-storage";
import {
  hasShopData,
  SHOP_DATA_CHANGED_EVENT,
  storage,
  type ShopDataSnapshot,
} from "@/lib/storage";

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "conflict"; local: ShopDataSnapshot; cloud: ShopDataSnapshot }
  | { kind: "ready" };

type SyncStatus = "saved" | "saving" | "offline";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function StatusCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-14">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 h-1.5 w-14 rounded-full bg-primary" />
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <div className="mt-3 text-sm leading-6 text-slate-600">{children}</div>
      </section>
    </main>
  );
}

export function CloudDataBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    let cancelled = false;
    setPhase({ kind: "loading" });
    setBackupDownloaded(false);

    void (async () => {
      try {
        const response = await getCloudShopData();
        if (cancelled) return;
        const local = storage.getSnapshot();
        const localHasData = hasShopData(local);

        if (!response.hasCloudData && localHasData) {
          await saveCloudShopData(local);
          if (!cancelled) setPhase({ kind: "ready" });
          return;
        }

        if (response.hasCloudData && localHasData && canonical(local) !== canonical(response.data)) {
          setPhase({ kind: "conflict", local, cloud: response.data });
          return;
        }

        if (response.hasCloudData && !localHasData) {
          storage.restoreSnapshot(response.data, false);
        }
        setPhase({ kind: "ready" });
      } catch (error) {
        if (!cancelled) {
          setPhase({
            kind: "error",
            message: error instanceof Error ? error.message : "Unable to connect to cloud storage.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (phase.kind !== "ready" || !userId) return;
    let timer: number | undefined;
    let inFlight = false;

    const sync = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (inFlight) return;
        inFlight = true;
        setSyncStatus("saving");
        try {
          await saveCloudShopData(storage.getSnapshot());
          setSyncStatus("saved");
        } catch {
          setSyncStatus("offline");
        } finally {
          inFlight = false;
        }
      }, 650);
    };

    window.addEventListener(SHOP_DATA_CHANGED_EVENT, sync);
    window.addEventListener("online", sync);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener(SHOP_DATA_CHANGED_EVENT, sync);
      window.removeEventListener("online", sync);
    };
  }, [phase.kind, userId]);

  if (!isLoaded || phase.kind === "loading") {
    return (
      <StatusCard title="Opening your shop">
        Connecting securely to your cloud shop data…
      </StatusCard>
    );
  }

  if (phase.kind === "error") {
    return (
      <StatusCard title="Your shop data could not be loaded">
        <p>{phase.message}</p>
        <p className="mt-2">Your browser copy has not been replaced. Check your connection and try again.</p>
        <button
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setPhase({ kind: "loading" })}
        >
          Try again
        </button>
      </StatusCard>
    );
  }

  if (phase.kind === "conflict") {
    return (
      <StatusCard title="Two different shop copies were found">
        <p>
          This browser and your cloud account both have data. Download the browser copy before choosing
          which one to keep. The other copy will not be deleted automatically.
        </p>
        <button
          className="mt-5 w-full rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            downloadShopBackup(phase.local);
            setBackupDownloaded(true);
          }}
        >
          Download browser backup
        </button>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            disabled={!backupDownloaded}
            className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            onClick={() => {
              storage.restoreSnapshot(phase.cloud, false);
              setPhase({ kind: "ready" });
            }}
          >
            Use cloud copy
          </button>
          <button
            disabled={!backupDownloaded}
            className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-45"
            onClick={async () => {
              try {
                await saveCloudShopData(phase.local);
                setPhase({ kind: "ready" });
              } catch (error) {
                setPhase({
                  kind: "error",
                  message: error instanceof Error ? error.message : "Unable to save the browser copy.",
                });
              }
            }}
          >
            Keep browser copy
          </button>
        </div>
        {!backupDownloaded && (
          <p className="mt-3 text-xs text-slate-500">Download the backup to enable either choice.</p>
        )}
      </StatusCard>
    );
  }

  return (
    <>
      {children}
      <div
        role="status"
        className="fixed bottom-3 right-3 z-40 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm"
      >
        {syncStatus === "saving" && "Saving to cloud…"}
        {syncStatus === "saved" && "Saved to cloud"}
        {syncStatus === "offline" && "Not synced — changes stay on this device"}
      </div>
    </>
  );
}
