import { z } from "zod";

// Reads the nightly results that llm-eval-observatory commits to its own repo.
// Pages that use this regenerate at most hourly (ISR).
//
// Failures come in two kinds and are handled differently:
// - A transport failure (network error, timeout, non-2xx, unreadable body) is
//   usually brief. In a production runtime it is thrown, so Next keeps serving
//   the last good page and retries the regeneration shortly, instead of caching
//   the fallback for an hour. During the build and in development the fallback
//   renders instead, so an outage at GitHub cannot fail a deploy.
// - A data problem (schema mismatch, a mock snapshot) will not fix itself on a
//   retry, so the fallback renders and the problem is logged.
// history.jsonl is optional: if it fails, only the nights count is left out.

const RAW = "https://raw.githubusercontent.com/vineethkodakandla/llm-eval-observatory/main/public/data";
export const EVAL_FILES = {
  latest: "https://github.com/vineethkodakandla/llm-eval-observatory/blob/main/public/data/latest.json",
  history: "https://github.com/vineethkodakandla/llm-eval-observatory/blob/main/public/data/history.jsonl",
};

const num = z.number().nullable().optional();

const autopilotModel = z
  .object({
    model: z.string(),
    label: z.string().optional(),
    n: z.number().optional(),
    accuracy: num,
    ci95: z.array(z.number()).nullable().optional(),
    false_clear_rate: num,
    abstention_accuracy: num,
    hallucinated_citation_rate: num,
  })
  .passthrough();

const robustnessModel = z
  .object({
    model: z.string(),
    label: z.string().optional(),
    n: z.number().optional(),
    defended: z.number().optional(),
    defense_rate: num,
  })
  .passthrough();

const perModel = z.object({ model: z.string() }).passthrough();

const latestSchema = z
  .object({
    mock: z.boolean(),
    generated_at: z.string(),
    models: z.array(z.object({ id: z.string(), label: z.string().optional() }).passthrough()),
    tracks: z
      .object({
        autopilot: z.object({ n_cases: z.number().optional(), per_model: z.array(autopilotModel) }).passthrough().optional(),
        robustness: z.object({ n_attacks: z.number().optional(), per_model: z.array(robustnessModel) }).passthrough().optional(),
        capability: z.object({ per_model: z.array(perModel) }).passthrough().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type ModelRow = {
  id: string;
  label: string;
  accuracy: number | null;
  ci: [number, number] | null;
  cases: number | null;
  falseClearRate: number | null;
  abstention: number | null;
  defended: number | null;
  attacks: number | null;
};

export type EvalSnapshot = {
  generatedAt: string;
  dateLabel: string;
  timeLabel: string;
  stale: boolean;
  configured: number;
  completed: number;
  rows: ModelRow[];
  nightsWithData: number | null;
};

const DAY = 86_400_000;
const TIMEOUT_MS = 8000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const throwTransientFailures = () =>
  process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";

// Formatted by hand: Intl month abbreviations vary by ICU version ("Sep" vs "Sept").
function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const two = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    time: `${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`,
  };
}

function countNights(historyText: string, anchorIso: string): number {
  const anchor = Date.parse(anchorIso.slice(0, 10));
  const dates = new Set<string>();
  for (const line of historyText.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { date?: string; mock?: boolean };
      if (row.mock !== false || !row.date) continue;
      const t = Date.parse(row.date);
      if (t <= anchor && anchor - t < 30 * DAY) dates.add(row.date);
    } catch {
      /* skip a malformed line rather than fail the panel */
    }
  }
  return dates.size;
}

async function fetchHistory(): Promise<string | null> {
  try {
    const res = await fetch(`${RAW}/history.jsonl`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function getEvalSnapshot(): Promise<EvalSnapshot | null> {
  // Started first so both requests run in parallel; it never rejects.
  const historyText = fetchHistory();

  let body: unknown;
  try {
    const res = await fetch(`${RAW}/latest.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`latest.json returned HTTP ${res.status}`);
    body = await res.json();
  } catch (err) {
    console.error("[eval-live] could not load latest.json:", err instanceof Error ? err.message : err);
    if (throwTransientFailures()) throw err;
    return null;
  }

  const parsed = latestSchema.safeParse(body);
  if (!parsed.success || parsed.data.mock) {
    console.error(
      "[eval-live] latest.json is not a usable snapshot:",
      parsed.success ? "mock data" : parsed.error.issues.slice(0, 3),
    );
    return null;
  }
  const latest = parsed.data;

  const labels = new Map(latest.models.map((m) => [m.id, m.label ?? m.id]));
  const robustness = new Map((latest.tracks.robustness?.per_model ?? []).map((r) => [r.model, r]));
  const completedIds = new Set<string>([
    ...(latest.tracks.autopilot?.per_model ?? []).map((m) => m.model),
    ...(latest.tracks.robustness?.per_model ?? []).map((m) => m.model),
    ...(latest.tracks.capability?.per_model ?? []).map((m) => m.model),
  ]);

  const rows: ModelRow[] = [...completedIds].map((id) => {
    const a = latest.tracks.autopilot?.per_model.find((m) => m.model === id);
    const r = robustness.get(id);
    // ci95 is stored as [point, lower, upper].
    const ci = a?.ci95 && a.ci95.length >= 3 ? ([a.ci95[1], a.ci95[2]] as [number, number]) : null;
    return {
      id,
      label: a?.label ?? r?.label ?? labels.get(id) ?? id,
      accuracy: a?.accuracy ?? null,
      ci,
      cases: a?.n ?? latest.tracks.autopilot?.n_cases ?? null,
      falseClearRate: a?.false_clear_rate ?? null,
      abstention: a?.abstention_accuracy ?? null,
      defended: r?.defended ?? null,
      attacks: r?.n ?? latest.tracks.robustness?.n_attacks ?? null,
    };
  });
  rows.sort((x, y) => (y.accuracy ?? -1) - (x.accuracy ?? -1));

  const history = await historyText;
  const { date, time } = formatDate(latest.generated_at);
  return {
    generatedAt: latest.generated_at,
    dateLabel: date,
    timeLabel: time,
    stale: Date.now() - Date.parse(latest.generated_at) > 1.5 * DAY,
    configured: latest.models.length,
    completed: completedIds.size,
    rows,
    nightsWithData: history == null ? null : countNights(history, latest.generated_at),
  };
}
