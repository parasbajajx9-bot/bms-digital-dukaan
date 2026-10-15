import { useRef, useState } from "react";
import { Cloud, Download, FileUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadShopBackup, parseShopBackup, saveCloudShopData } from "@/lib/cloud-storage";
import { storage } from "@/lib/storage";

export default function AccountDataPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const current = storage.getSnapshot();

  const handleImport = async (file?: File) => {
    if (!file) return;
    setWorking(true);
    setMessage("");
    try {
      const parsed = parseShopBackup(JSON.parse(await file.text()));
      const confirmed = window.confirm(
        "Replace this account's cloud shop data with the selected backup? Download a backup first if you want to keep the current cloud copy.",
      );
      if (!confirmed) return;
      await saveCloudShopData(parsed);
      storage.restoreSnapshot(parsed);
      window.dispatchEvent(new Event("shop-settings-updated"));
      window.dispatchEvent(new Event("inventory-updated"));
      setMessage("Backup restored. Your shop is now using this copy.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The backup could not be restored.");
    } finally {
      setWorking(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <header>
        <div className="flex items-center gap-2">
          <Cloud size={22} className="text-primary" />
          <h1 className="text-xl font-extrabold text-slate-800">Data &amp; backups</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Your records are saved to your signed-in cloud account and cached in this browser.</p>
      </header>

      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 shrink-0 text-emerald-700" size={19} />
          <div>
            <h2 className="font-bold text-emerald-950">Cloud copy is connected</h2>
            <p className="mt-1 text-sm leading-6 text-emerald-900/80">
              Changes sync to this owner's account. Download a backup before moving to a different account or replacing cloud data.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Download size={19} />
          </div>
          <h2 className="mt-4 font-bold text-slate-800">Download a backup</h2>
          <p className="mt-1 min-h-12 text-sm leading-5 text-slate-500">
            Save shop settings, products, customers, bills, and ledger entries as a JSON file.
          </p>
          <p className="mt-3 text-xs text-slate-500">
            {current.inventory.length} products · {current.customers.length} customers · {current.bills.length} bills
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => downloadShopBackup(storage.getSnapshot())}
          >
            Download shop backup
          </Button>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <FileUp size={19} />
          </div>
          <h2 className="mt-4 font-bold text-slate-800">Restore from a backup</h2>
          <p className="mt-1 min-h-12 text-sm leading-5 text-slate-500">
            Use this to move an existing browser backup into your new published account.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
          <Button
            variant="outline"
            className="mt-4 w-full"
            disabled={working}
            onClick={() => fileInput.current?.click()}
          >
            {working ? "Restoring backup…" : "Choose backup file"}
          </Button>
        </article>
      </section>

      {message && (
        <p role="status" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Keep downloaded backups somewhere private. They contain your shop and customer records.
      </p>
    </div>
  );
}
