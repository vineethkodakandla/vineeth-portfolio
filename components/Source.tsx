import type { SourceRef } from "@/content/sources";

// The footnote-style link under every figure: which committed file, at which
// lines, the number came from.
export function Source({
  source,
  prefix = "Data",
}: {
  source: SourceRef | readonly SourceRef[];
  prefix?: string;
}) {
  const list: readonly SourceRef[] = "href" in source ? [source] : source;
  return (
    <span className="source">
      <span>{prefix}:</span>
      {list.map((s, i) => (
        <span key={`${s.href}-${i}`}>
          <a href={s.href}>{s.label}</a>
          {i < list.length - 1 ? "," : null}
        </span>
      ))}
    </span>
  );
}
