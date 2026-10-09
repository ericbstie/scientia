import { useEffect } from "react";
import { useCourse } from "../../../App";

/** Document title: "<Page> · <COURSE> · Scientia". */
export function useDocTitle(title: string | undefined) {
  const { course } = useCourse();
  useEffect(() => {
    if (title) document.title = `${title} · ${course.code} · Scientia`;
  }, [title, course.code]);
}

/** After a row disappears, keep keyboard users in the page: focus the page heading. */
export function focusHeading() {
  requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());
}

/** Announcement read state is kept per signed-in user in this browser (no schema column yet). */
const readKey = (userId: string) => `scientia:read-announcements:${userId}`;
export function readAnnouncements(userId: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(readKey(userId)) ?? "[]") as string[]); } catch { return new Set(); }
}
export function markAnnouncementRead(userId: string, id: string) {
  try {
    const set = readAnnouncements(userId);
    set.add(id);
    localStorage.setItem(readKey(userId), JSON.stringify([...set]));
  } catch { /* storage unavailable: the marker just stays */ }
}

export const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0] ?? name;

/** Focus a field by id (the shared Field primitives do not forward refs). */
export const focusField = (id: string) => document.getElementById(id)?.focus();

/** Inline row links are one text line tall; keep every target at least 24 px (US-20). */
export const linkTarget = { paddingBlock: 2 } as const;
