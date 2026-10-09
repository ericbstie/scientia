import type { ReactNode } from "react";

function inline(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

type Block = { type: "p" | "ul"; lines: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    if (!line.trim()) { current = null; continue; }
    const item = /^[-*] (.*)$/.exec(line);
    const type = item ? "ul" : "p";
    if (!current || current.type !== type) {
      current = { type, lines: [] };
      blocks.push(current);
    }
    current.lines.push(item ? item[1]! : line);
  }
  return blocks;
}

/** Paragraphs, "- " bullet lists and **bold**; everything else is plain text. */
export function Prose({ text }: { text: string }) {
  return (
    <div className="prose">
      {parse(text).map((b, i) =>
        b.type === "ul" ? (
          <ul key={i}>{b.lines.map((l, j) => <li key={j}>{inline(l)}</li>)}</ul>
        ) : (
          <p key={i}>{b.lines.map((l, j) => <span key={j}>{j > 0 && <br />}{inline(l)}</span>)}</p>
        ),
      )}
    </div>
  );
}
