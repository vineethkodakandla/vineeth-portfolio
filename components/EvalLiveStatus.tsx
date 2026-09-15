import { Source } from "@/components/Source";
import { DataTable } from "@/components/charts/ChartFigure";
import { EVAL_FILES, getEvalSnapshot, type EvalSnapshot } from "@/lib/eval-live";

const pct = (v: number | null) => (v == null ? "n/a" : `${Math.round(v * 1000) / 10}%`);

function Unavailable() {
  return (
    <div className="live-status">
      <span className="live-flag" data-state="stale">
        Live data unavailable
      </span>
      <div className="label">
        The nightly results could not be loaded just now.{" "}
        <a href="https://llm-eval-observatory.vercel.app">Open the dashboard</a> instead.
      </div>
    </div>
  );
}

function statusLine(snap: EvalSnapshot) {
  return snap.stale ? `Latest run: ${snap.dateLabel}` : `Nightly run of ${snap.dateLabel}`;
}

// Compact version for the project card.
export default async function EvalLiveStatus() {
  const snap = await getEvalSnapshot();
  if (!snap) return <Unavailable />;
  return (
    <div className="live-status">
      <span className="live-flag" data-state={snap.stale ? "stale" : "live"}>
        {statusLine(snap)}
      </span>
      <div className="value">
        {snap.completed} of {snap.configured} models
      </div>
      <div className="label">
        completed that run.
        {snap.nightsWithData != null ? ` ${snap.nightsWithData} of the 30 nights up to it produced results.` : ""}{" "}
        Models that are unavailable or rate-limited on Groq&apos;s free tier are skipped for the night.
      </div>
      <Source
        prefix="Live data"
        source={[
          { label: "latest.json", href: EVAL_FILES.latest },
          { label: "history.jsonl", href: EVAL_FILES.history },
        ]}
      />
    </div>
  );
}

// Full version for the case study: one row per model that finished.
export async function EvalLivePanel() {
  const snap = await getEvalSnapshot();
  if (!snap) {
    return (
      <section className="live-panel" aria-label="Latest nightly results">
        <Unavailable />
      </section>
    );
  }
  return (
    <section className="live-panel" aria-labelledby="live-panel-title">
      <span className="live-flag" data-state={snap.stale ? "stale" : "live"}>
        {statusLine(snap)}, {snap.timeLabel} UTC
      </span>
      <h2 id="live-panel-title">
        {snap.completed} of {snap.configured} configured models completed this run
      </h2>
      <p>
        {snap.nightsWithData != null
          ? `${snap.nightsWithData} of the 30 nights up to this run produced results. `
          : ""}
        This panel reads the committed results file and refreshes at most hourly, so it changes without a
        redeploy.
      </p>
      <div className="table-scroll">
        <DataTable
          table={{
            columns: [
              { label: "Model" },
              { label: "AML decisions correct", numeric: true },
              { label: "95% CI", numeric: true },
              { label: "False clears", numeric: true },
              { label: "Ambiguous cases sent to review", numeric: true },
              { label: "Injection attacks defended", numeric: true },
            ],
            rows: snap.rows.map((r) => [
              r.label,
              pct(r.accuracy),
              r.ci ? `${pct(r.ci[0])} to ${pct(r.ci[1])}` : "n/a",
              pct(r.falseClearRate),
              pct(r.abstention),
              r.defended != null && r.attacks != null ? `${r.defended} of ${r.attacks}` : "n/a",
            ]),
          }}
        />
      </div>
      <Source
        prefix="Live data"
        source={[
          { label: "latest.json", href: EVAL_FILES.latest },
          { label: "history.jsonl", href: EVAL_FILES.history },
        ]}
      />
    </section>
  );
}
