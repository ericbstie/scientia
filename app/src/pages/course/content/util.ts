import { useCourse } from "../../../App";
import { useTitle } from "../../../ui";

/** Document title: "<Page> · <COURSE> · Scientia". */
export function useDocTitle(title: string | undefined) {
  const { course } = useCourse();
  useTitle(title, course.code);
}

/** After a row disappears, keep keyboard users in the page: focus the page heading. */
export function focusHeading() {
  requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());
}

export const lastName = (name: string) => name.trim().split(/\s+/).slice(-1)[0] ?? name;

/** Focus a field by id (the shared Field primitives do not forward refs). */
export const focusField = (id: string) => document.getElementById(id)?.focus();

