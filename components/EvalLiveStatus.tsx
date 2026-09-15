import { Source } from "@/components/Source";
import { DataTable } from "@/components/charts/ChartFigure";
import { EVAL_FILES, getEvalSnapshot, type EvalSnapshot } from "@/lib/eval-live";

const pct = (v: number | null) => (v == null ? "n/a" : `${Math.round(v * 1000) / 10}%`);

// The live files move every night, so their links say so rather than implying a
// pinned commit like the rest of the site's sources.
const LIVE_SOURCES = [
  { label: "latest.json", href: EVAL_FILES.latest },
  { label: "history.jsonl", href: EVAL_FILES.history },
];

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
        returned results in that run, and {snap.allTracks} finished all of their tracks.
        {snap.nightsWithData != null ? ` ${snap.nightsWithData} of the 30 nights up to it produced results.` : ""} A
        model that Groq&apos;s free tier rejects or keeps rate-limiting is dropped for the rest of the run.
      </div>
      <Source prefix="Live data, updated nightly" source={LIVE_SOURCES} />
    </div>
  );
}

// Full version for the case study: one row per model that returned results.
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
        {snap.completed} of {snap.configured} configured models returned results in this run
      </h2>
      <p>
        {snap.allTracks} finished all of their tracks.{" "}
        {snap.nightsWithData != null ? `${snap.nightsWithData} of the 30 nights up to this run produced results. ` : ""}
        This panel reads the results file on the project&apos;s main branch, which is updated nightly, and refreshes at
        most hourly.
      </p>
      <div className="table-scroll">
        <DataTable
          table={{
            columns: [
              { label: "Model" },
              { label: "AML decisions correct", numeric: true },
              { label: "95% CI", numeric: true },
              { label: "Escalate cases wrongly cleared", numeric: true },
              { label: "Ambiguous cases sent to review", numeric: true },
              { label: "Injection attacks defended", numeric: true },
            ],
            rows: snap.rows.map((r) => [
              r.label,
              pct(r.accuracy),
              r.ci ? `${pct(r.ci[0])} to ${pct(r.ci[1])}` : "n/a",
              r.falseClears != null && r.escalateCases != null ? `${r.falseClears} of ${r.escalateCases}` : "n/a",
              pct(r.abstention),
              r.defended != null && r.attacks != null ? `${r.defended} of ${r.attacks}` : "n/a",
            ]),
          }}
        />
      </div>
      <Source prefix="Live data, updated nightly" source={LIVE_SOURCES} />
    </section>
  );
}
