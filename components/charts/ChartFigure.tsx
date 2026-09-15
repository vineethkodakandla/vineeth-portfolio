import type { ReactNode } from "react";
import { Source } from "@/components/Source";
import type { SourceRef } from "@/content/sources";

export type TableSpec = {
  caption?: string;
  columns: { label: string; numeric?: boolean }[];
  rows: (string | number)[][];
  /** How many leading columns identify a row (rendered as row headers). Default 1. */
  rowHeaders?: number;
};

export function DataTable({ table }: { table: TableSpec }) {
  const headerCols = table.rowHeaders ?? 1;
  return (
    <table className="data">
      {table.caption ? <caption>{table.caption}</caption> : null}
      <thead>
        <tr>
          {table.columns.map((c, j) => (
            <th key={j} scope="col" className={c.numeric ? "num" : undefined}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) =>
              j < headerCols ? (
                <th key={j} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={j} className={table.columns[j]?.numeric ? "num" : undefined}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// A chart is never the only way to read a value: every figure ships its data as
// a table and names the committed file the data came from.
export function ChartFigure({
  title,
  description,
  children,
  table,
  sources,
  note,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  table: TableSpec;
  sources: SourceRef[];
  note?: string;
}) {
  return (
    <figure className="chart-figure">
      <figcaption>
        <span className="chart-title">{title}</span>
        {description ? <p>{description}</p> : null}
      </figcaption>
      {children}
      {note ? <p className="chart-note">{note}</p> : null}
      <details className="chart-table-wrap">
        <summary>Show the numbers as a table</summary>
        <div className="table-scroll">
          <DataTable table={table} />
        </div>
      </details>
      <Source source={sources} />
    </figure>
  );
}
