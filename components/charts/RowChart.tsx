import type { CSSProperties } from "react";

// Horizontal row charts built from HTML, not SVG: the text stays real text at
// any width, marks are positioned in percent of the plot column, and colors
// come from theme tokens. One component covers dumbbells (two dots joined by a
// segment), dot-and-interval rows and bars with a whisker.
//
// Mark specs follow the data-viz method: bars 14px with a 4px rounded data end,
// 2px lines, 10px dots with a 2px surface ring, hairline solid gridlines. Each
// row is the hover/focus target, so the hit area is the whole row, and every
// value is also in the table view that ChartFigure renders beside the chart.

export type Tone = "series-1" | "series-2" | "series-3" | "deemph";

export type Mark =
  | { type: "dot"; value: number; hollow?: boolean; tone?: Tone }
  | { type: "segment"; from: number; to: number }
  | { type: "whisker"; from: number; to: number }
  | { type: "bar"; to: number; tone?: Tone };

export type ChartRow = {
  label: string;
  sub?: string;
  marks: Mark[];
  /** Short readout in the value column (hidden on narrow screens). */
  value: string;
  /** Tooltip lines, value first. */
  tip: string[];
};

export type LegendItem = {
  shape: "dot" | "hollow" | "bar" | "whisker" | "threshold";
  label: string;
  tone?: Tone;
};

export type Scale = {
  min: number;
  max: number;
  ticks: number[];
  unit?: string;
  decimals?: number;
  title?: string;
};

const ORDER: Record<Mark["type"], number> = { bar: 0, segment: 1, whisker: 2, dot: 3 };

function pct(v: number, s: Scale): number {
  const p = ((v - s.min) / (s.max - s.min)) * 100;
  return Math.max(0, Math.min(100, p));
}

function toneStyle(tone?: Tone): CSSProperties | undefined {
  return tone ? ({ "--mark": `var(--${tone})` } as CSSProperties) : undefined;
}

function MarkEl({ mark, scale }: { mark: Mark; scale: Scale }) {
  switch (mark.type) {
    case "dot":
      return (
        <span
          className={mark.hollow ? "mark-dot hollow" : "mark-dot"}
          style={{ left: `${pct(mark.value, scale)}%`, ...toneStyle(mark.tone) }}
        />
      );
    case "segment":
    case "whisker": {
      const a = pct(Math.min(mark.from, mark.to), scale);
      const b = pct(Math.max(mark.from, mark.to), scale);
      return (
        <span
          className={mark.type === "segment" ? "mark-segment" : "mark-whisker"}
          style={{ left: `${a}%`, width: `${b - a}%` }}
        />
      );
    }
    case "bar":
      return <span className="mark-bar" style={{ width: `${pct(mark.to, scale)}%`, ...toneStyle(mark.tone) }} />;
  }
}

export function RowChart({
  label,
  rows,
  scale,
  legend,
  threshold,
}: {
  label: string;
  rows: ChartRow[];
  scale: Scale;
  legend?: LegendItem[];
  threshold?: number;
}) {
  const tick = (v: number) => `${v.toFixed(scale.decimals ?? 0)}${scale.unit ?? ""}`;
  return (
    <div className="chart" role="group" aria-label={label}>
      {legend && legend.length > 0 ? (
        <div className="chart-legend">
          {legend.map((item) => (
            <span className="legend-item" key={item.label}>
              <span className={`legend-swatch ${item.shape}`} style={toneStyle(item.tone)} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="chart-rows">
        <div className="chart-overlay" aria-hidden="true">
          {scale.ticks.map((t) => (
            <span key={t} className="chart-gridline" style={{ left: `${pct(t, scale)}%` }} />
          ))}
          {threshold != null ? (
            <span className="chart-threshold" style={{ left: `${pct(threshold, scale)}%` }} />
          ) : null}
        </div>

        {rows.map((row) => {
          const title = row.sub ? `${row.label}, ${row.sub}` : row.label;
          const marks = [...row.marks].sort((a, b) => ORDER[a.type] - ORDER[b.type]);
          return (
            // role="img" makes the aria-label a valid name (a bare div may not be
            // named); the children are presentational and already aria-hidden.
            <div
              key={title}
              className="chart-row"
              role="img"
              tabIndex={0}
              data-tip-title={title}
              data-tip={row.tip.join("\n")}
              aria-label={`${title}: ${row.tip.join("; ")}`}
            >
              <div className="chart-label" aria-hidden="true">
                {row.label}
                {row.sub ? <small>{row.sub}</small> : null}
              </div>
              <div className="chart-plot" aria-hidden="true">
                {marks.map((m, i) => (
                  <MarkEl key={i} mark={m} scale={scale} />
                ))}
              </div>
              <div className="chart-value" aria-hidden="true">
                {row.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-axis" aria-hidden="true">
        <span className="chart-axis-title">{scale.title}</span>
        <div className="chart-axis-track">
          {scale.ticks.map((t) => {
            const p = pct(t, scale);
            return (
              <span
                key={t}
                className="chart-tick"
                data-edge={p <= 0 ? "start" : p >= 100 ? "end" : undefined}
                style={{ left: `${p}%` }}
              >
                {tick(t)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
