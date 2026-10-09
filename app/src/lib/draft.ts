// A typed answer kept on this device until it is submitted (I-001): one per person and
// assignment, dropped on submit, on Sign out and after 30 days. If storage is blocked or
// full nothing is kept, silently, and the form works as before.
const prefix = "scientia-draft:";
const maxAge = 30 * 24 * 3600 * 1000;
const key = (userId: string, assignmentId: string) => `${prefix}${userId}:${assignmentId}`;

export function readDraft(userId: string, assignmentId: string): string | null {
  try {
    const saved = JSON.parse(localStorage.getItem(key(userId, assignmentId)) ?? "null") as { text: string; at: number } | null;
    if (saved && Date.now() - saved.at < maxAge) return saved.text;
    localStorage.removeItem(key(userId, assignmentId));
  } catch {}
  return null;
}

/** Keeps `text`, or forgets the draft when it is empty. */
export function writeDraft(userId: string, assignmentId: string, text: string) {
  try {
    if (text.trim()) localStorage.setItem(key(userId, assignmentId), JSON.stringify({ text, at: Date.now() }));
    else localStorage.removeItem(key(userId, assignmentId));
  } catch {}
}

export function clearDrafts() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith(prefix)) localStorage.removeItem(k);
  } catch {}
}
