// Small bits of state that the schema has no column for yet are kept as an invisible
// JSON suffix after U+2063 at the end of a body text. Remove this file once the
// migrations add announcements.edited_at and a way to keep removed replies
// (see the M3 content report).
const SEP = "⁣";

export type Meta = { edited?: boolean; removed?: string[] };

export function splitBody(raw: string | null | undefined): { text: string; meta: Meta } {
  const value = raw ?? "";
  const i = value.indexOf(SEP);
  if (i < 0) return { text: value, meta: {} };
  try {
    return { text: value.slice(0, i), meta: JSON.parse(value.slice(i + 1)) as Meta };
  } catch {
    return { text: value.slice(0, i), meta: {} };
  }
}

export function joinBody(text: string, meta: Meta): string {
  const clean: Meta = {};
  if (meta.edited) clean.edited = true;
  if (meta.removed?.length) clean.removed = meta.removed;
  return Object.keys(clean).length ? text + SEP + JSON.stringify(clean) : text;
}
