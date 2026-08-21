import { useState } from "react";
import { TopNav, type Tab } from "./components/TopNav";
import { Dashboard } from "./components/Dashboard";
import { TransactionList } from "./components/TransactionList";
import { UploadPanel } from "./components/UploadPanel";
import { ReviewImport } from "./components/ReviewImport";
import { IncomeManager } from "./components/IncomeManager";
import type { ParsedTransactionDraft } from "./types";

interface PendingImport {
  drafts: ParsedTransactionDraft[];
  fileName: string;
  latestBalance?: { date: string; amount: number };
}

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [pending, setPending] = useState<PendingImport | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "var(--page-bg)" }}>
      <TopNav
        active={tab}
        onChange={(t) => {
          setPending(null);
          setTab(t);
        }}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tab === "dashboard" && <Dashboard onGoToUpload={() => setTab("upload")} />}
        {tab === "transactions" && <TransactionList />}
        {tab === "income" && <IncomeManager />}
        {tab === "upload" &&
          (pending ? (
            <ReviewImport
              drafts={pending.drafts}
              fileName={pending.fileName}
              latestBalance={pending.latestBalance}
              onCancel={() => setPending(null)}
              onDone={() => {
                setPending(null);
                setTab("dashboard");
              }}
            />
          ) : (
            <UploadPanel
              onParsed={(drafts, meta) =>
                setPending({ drafts, fileName: meta.fileName, latestBalance: meta.latestBalance })
              }
            />
          ))}
      </main>
    </div>
  );
}

export default App;
