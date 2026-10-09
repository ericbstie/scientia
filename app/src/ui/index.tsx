// Shared UI primitives. Prefer these over ad-hoc markup so pages stay consistent.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type Ref, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import { fmtDateTime, relative, type StudentStatus } from "../lib/format";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "danger" | "ghost"; size?: "small" };
export function Button({ variant, size, className = "", type = "button", ...rest }: BtnProps) {
  return <button type={type} className={`btn ${variant ?? ""} ${size ?? ""} ${className}`} {...rest} />;
}

export function ButtonLink({ to, variant, size, children, "aria-label": ariaLabel }: { to: string; variant?: "primary" | "ghost"; size?: "small"; children: ReactNode; "aria-label"?: string }) {
  return <Link to={to} className={`btn ${variant ?? ""} ${size ?? ""}`} aria-label={ariaLabel}>{children}</Link>;
}

// After client-side navigation, move focus to the new page's h1 so screen readers announce it.
let firstRender = true;
export function PageHeader({ title, eyebrow, subtitle, actions }: { title: ReactNode; eyebrow?: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (firstRender) { firstRender = false; return; }
    h1.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 ref={h1} tabIndex={-1}>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </header>
  );
}

/** Sets the document title: "<page> · <course code> · Scientia", or "<page> · Scientia" outside a course. */
export function useTitle(page: string | undefined, courseCode?: string) {
  useEffect(() => {
    if (page) document.title = [page, courseCode, "Scientia"].filter(Boolean).join(" · ");
  }, [page, courseCode]);
}

/** Polite live announcement for list, filter and month changes ("Showing 3 users"). */
export function Status({ children }: { children: ReactNode }) {
  return <p className="visually-hidden" aria-live="polite" aria-atomic="true">{children}</p>;
}

/** Summary above a form with two or more errors; each entry links to its field. */
export function ErrorSummary({ errors: all }: { errors: (false | undefined | "" | { id: string; message: string })[] }) {
  const errors = all.filter((e): e is { id: string; message: string } => !!e);
  if (errors.length < 2) return null;
  return (
    <div className="alert danger" role="alert">
      <p style={{ margin: 0, fontWeight: 600 }}>There are {errors.length} problems with this form.</p>
      <ul style={{ margin: "var(--s1) 0 0", paddingLeft: "var(--s5)" }}>
        {errors.map((e) => (
          <li key={e.id}><a href={`#${e.id}`} onClick={(ev) => { ev.preventDefault(); const el = document.getElementById(e.id); (el?.matches("fieldset") ? el.querySelector<HTMLElement>("input") : el)?.focus(); }}>{e.message}</a></li>
        ))}
      </ul>
    </div>
  );
}

export function Section({ title, action, children, id }: { title: ReactNode; action?: ReactNode; children: ReactNode; id?: string }) {
  const hid = useId();
  return (
    <section className="section" aria-labelledby={hid} id={id}>
      <div className="section-title"><h2 id={hid}>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Badge({ tone, children }: { tone?: "success" | "warning" | "danger" | "accent"; children: ReactNode }) {
  return <span className={`badge ${tone ?? ""}`}>{children}</span>;
}

const statusTone: Record<StudentStatus | TeacherStatus, "success" | "warning" | "danger" | "accent" | undefined> = {
  "Not submitted": undefined, Submitted: "accent", Late: "warning", Missing: "danger", Closed: undefined, Graded: "success",
  "Needs grading": "warning", "Graded (not released)": "accent", Released: "success",
};
export type TeacherStatus = "Needs grading" | "Graded (not released)" | "Released";

/** Status badge using the fixed vocabulary in docs/design/ui-guidelines.md. */
export function StatusBadge({ status }: { status: StudentStatus | TeacherStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}

export function Due({ at }: { at: string }) {
  return <><time dateTime={at}>{fmtDateTime(at)}</time> <span className="muted">· {relative(at)}</span></>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return <p className="muted" role="status" aria-live="polite">{label}…</p>;
}

export function ErrorNote({ error }: { error: Error | null | undefined }) {
  if (!error) return null;
  return <div className="alert danger" role="alert">{error.message}</div>;
}

const describedBy = (id: string, hint?: string, error?: string) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

type FieldBase = { label: string; hint?: string; error?: string };
// React 19: `ref` is a regular prop on function components.
type WithRef<T> = { ref?: Ref<T> };

/** Label with a visible "Required" marker beside it; the control itself carries the required state for assistive tech. */
function FieldLabel({ id, label, required }: { id: string; label: string; required?: boolean }) {
  if (!required) return <label htmlFor={id}>{label}</label>;
  return <div className="label-row"><label htmlFor={id}>{label}</label><span className="req" aria-hidden="true">Required</span></div>;
}
function FieldNotes({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error-text" id={`${id}-error`}>{error}</span>}
    </>
  );
}

export function Field({ label, hint, error, id, ...rest }: FieldBase & WithRef<HTMLInputElement> & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="field">
      <FieldLabel id={fid} label={label} required={rest.required} />
      <input id={fid} className="input" aria-describedby={describedBy(fid, hint, error)} aria-invalid={!!error || undefined} {...rest} />
      <FieldNotes id={fid} hint={hint} error={error} />
    </div>
  );
}

export function TextArea({ label, hint, error, id, ...rest }: FieldBase & WithRef<HTMLTextAreaElement> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="field">
      <FieldLabel id={fid} label={label} required={rest.required} />
      <textarea id={fid} className="textarea" aria-describedby={describedBy(fid, hint, error)} aria-invalid={!!error || undefined} {...rest} />
      <FieldNotes id={fid} hint={hint} error={error} />
    </div>
  );
}

export function Select({ label, hint, error, id, children, ...rest }: FieldBase & WithRef<HTMLSelectElement> & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="field">
      <FieldLabel id={fid} label={label} required={rest.required} />
      <select id={fid} className="select" aria-describedby={describedBy(fid, hint, error)} aria-invalid={!!error || undefined} {...rest}>{children}</select>
      <FieldNotes id={fid} hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className="check">
      <input id={id} type="checkbox" {...rest} />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/** Native <dialog> with a labelled heading; closes on Escape and backdrop click. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const hid = useId();
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
      // Focus the first field, or the first button (Cancel) in a confirm dialog.
      requestAnimationFrame(() => (d.querySelector<HTMLElement>("input, select, textarea") ?? d.querySelector<HTMLElement>("button"))?.focus());
    }
    if (!open && d.open) d.close();
    if (!open && opener.current instanceof HTMLElement) opener.current.focus();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={hid} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <h2 id={hid}>{title}</h2>
      {open && children}
    </dialog>
  );
}

// Toasts: one polite live region for confirmations ("Submitted", "Saved").
const ToastContext = createContext<(msg: string) => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = (m: string) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3500);
  };
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className={msg ? "toast" : "visually-hidden"}>{msg}</div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

export function Avatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
  return <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-grid", placeItems: "center", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)", flex: "none" }}>{initials}</span>;
}

/** Confirmation dialog for destructive actions: Cancel is focused first. */
export function Confirm({ open, title, children, confirmLabel, onConfirm, onCancel, busy }: { open: boolean; title: string; children?: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      {children && <div style={{ marginBottom: "var(--s4)" }}>{children}</div>}
      <div className="actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
      </div>
    </Dialog>
  );
}

/** Message pages rendered in place for access problems (ia.md "Access rules"). */
export function NoAccess({ what = "this page" }: { what?: string }) {
  useTitle("No access");
  return (
    <div className="content">
      <PageHeader title={what === "this page" ? "You don't have access" : `You don't have access to ${what}`} />
      <p>If you think this is a mistake, contact your teacher or administrator.</p>
      <Link to="/">Go to your dashboard</Link>
    </div>
  );
}
export function NotFound() {
  useTitle("Page not found");
  return (
    <div className="content">
      <PageHeader title="Page not found" />
      <p>This page doesn't exist or has been removed.</p>
      <Link to="/">Go to your dashboard</Link>
    </div>
  );
}
