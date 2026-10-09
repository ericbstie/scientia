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

export const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0] ?? name;

/** Focus a field by id (the shared Field primitives do not forward refs). */
export const focusField = (id: string) => document.getElementById(id)?.focus();

