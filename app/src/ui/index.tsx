// Shared UI primitives on Designsystemet components (docs/decisions/0007-designsystemet.md).
// Pages use these, or Designsystemet components directly, never ad-hoc markup.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode, type Ref, type ComponentProps, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import { Alert, Avatar as DsAvatar, Breadcrumbs, BreadcrumbsLink, Button as DsButton, Card, CardBlock, Checkbox as DsCheckbox, Dialog as DsDialog, EXPERIMENTAL_FileUpload as FileUpload, Field as DsField, FieldDescription, Heading, Input, Label, Link as DsLink, Paragraph, Select as DsSelect, Tag, Textarea, ValidationMessage } from "@digdir/designsystemet-react";
import { fmtDateTime, initials, relative, type StudentStatus } from "../lib/format";

/** The Scientia mark. The favicon in index.html is the same shape; change both together. */
export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--ds-color-accent-base-default)" />
      <path d="M10 21c1.5 1.4 3.6 2 5.8 2 3 0 5.2-1.4 5.2-3.8 0-5-10.2-2.9-10.2-7.6C10.8 9.4 12.9 8 15.6 8c2 0 3.7.6 5 1.6" fill="none" stroke="var(--ds-color-accent-base-contrast-default)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

type BtnProps = Omit<ComponentProps<typeof DsButton>, "variant"> & { variant?: "primary" | "secondary" | "tertiary" };
/** Designsystemet button that defaults to secondary: one primary per screen (ui-guidelines.md). Delete actions add data-color="danger". */
export function Button({ variant = "secondary", type = "button", ...rest }: BtnProps) {
  return <DsButton variant={variant} type={type} {...rest} />;
}

/** Navigation styled as a button. */
export function ButtonLink({ to, variant = "secondary", children, ...rest }: { to: string; variant?: "primary" | "secondary" | "tertiary"; children: ReactNode; "aria-label"?: string; "data-color"?: string }) {
  return <DsButton asChild variant={variant} {...rest}><Link to={to}>{children}</Link></DsButton>;
}

/** A link to a page in the app, as Designsystemet's Link: the one way a link looks (rows, cards, text). */
export function TextLink({ to, children, ...rest }: { to: string; children: ReactNode } & Omit<ComponentProps<typeof Link>, "to" | "children">) {
  return <DsLink asChild><Link to={to} {...rest}>{children}</Link></DsLink>;
}

/** A link that leaves the app or downloads a file, styled like TextLink. */
export const ExtLink = DsLink;

// After client-side navigation, move focus to the new page's h1 so screen readers announce it.
let firstRender = true;
/** Page header: optional back link to the parent page, one h1, optional sentence, actions on the right. */
export function PageHeader({ title, back, subtitle, actions }: { title: ReactNode; back?: { to: string; label: string }; subtitle?: ReactNode; actions?: ReactNode }) {
  const h1 = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (firstRender) { firstRender = false; return; }
    h1.current?.focus({ preventScroll: true });
  }, [pathname]);
  return (
    <header className="page-header">
      <div>
        {back && <Breadcrumbs><BreadcrumbsLink asChild><Link to={back.to}>{back.label}</Link></BreadcrumbsLink></Breadcrumbs>}
        <Heading level={1} data-size="md" ref={h1} tabIndex={-1}>{title}</Heading>
        {subtitle && <Paragraph className="subtitle">{subtitle}</Paragraph>}
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
  return <p className="ds-sr-only" aria-live="polite" aria-atomic="true">{children}</p>;
}

/** Summary above a form with two or more errors; each entry links to its field.
 *  Designsystemet's styling with our behaviour: the first invalid field keeps focus (ui-guidelines.md "Errors"),
 *  where the ErrorSummary component would take it. */
export function ErrorSummary({ errors: all }: { errors: (false | undefined | "" | { id: string; message: string })[] }) {
  const errors = all.filter((e): e is { id: string; message: string } => !!e);
  if (errors.length < 2) return null;
  return (
    <div className="ds-error-summary" role="alert">
      <Heading level={2} data-size="2xs">There are {errors.length} problems with this form</Heading>
      <ul>
        {errors.map((e) => (
          <li key={e.id}><a href={`#${e.id}`} onClick={(ev) => { ev.preventDefault(); const el = document.getElementById(e.id); (el?.matches("fieldset") ? el.querySelector<HTMLElement>("input") : el)?.focus(); }}>{e.message}</a></li>
        ))}
      </ul>
    </div>
  );
}

/** A titled region of a page: h2 and an optional action on the right. */
export function Section({ title, action, children, id }: { title: ReactNode; action?: ReactNode; children: ReactNode; id?: string }) {
  const hid = useId();
  return (
    <section className="section" aria-labelledby={hid} id={id}>
      <div className="section-title"><Heading level={2} data-size="xs" id={hid}>{title}</Heading>{action}</div>
      {children}
    </section>
  );
}

/** A list of rows on one neutral card, at the small size used inside rows. Children are <Row>s. */
export function List({ children, label }: { children: ReactNode; label?: string }) {
  return <Card asChild className="list" data-color="neutral" data-size="sm"><ul aria-label={label}>{children}</ul></Card>;
}

/** One row of a List: main column (title link and meta line) and a side column (dates, status).
 *  The row's content is back in the accent, so its links and buttons stay blue on the neutral card.
 *  `tint` puts the row on the accent's tinted surface: the next thing to do, or something new (brand.md). */
export function Row({ children, className = "", tint }: { children: ReactNode; className?: string; tint?: boolean }) {
  return <CardBlock asChild data-color="accent"><li className={`row ${tint ? "tint " : ""}${className}`}>{children}</li></CardBlock>;
}

/** A neutral panel for a form or a single block of content; what is inside keeps the accent. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card data-color="neutral" className={className}><div data-color="accent" className="stack">{children}</div></Card>;
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card data-color="neutral">
      <Heading level={3} data-size="2xs">{title}</Heading>
      {children && <Paragraph>{children}</Paragraph>}
      {action && <div data-color="accent">{action}</div>}
    </Card>
  );
}

type Tone = "success" | "warning" | "danger" | "accent" | "neutral";
const toneColor: Record<Tone, string> = { success: "success", warning: "warning", danger: "danger", accent: "accent", neutral: "neutral" };
/** A label beside a title: a status, or one of the fixed words in ui-guidelines.md.
 *  Accent tags are outlined so they stay visible on a tinted row, whose surface is their fill. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <Tag data-color={toneColor[tone]} data-size="sm" data-variant={tone === "accent" ? "outline" : undefined}>{children}</Tag>;
}

const statusTone: Record<StudentStatus | TeacherStatus, Tone> = {
  "Not submitted": "neutral", Submitted: "accent", Late: "warning", Missing: "danger", Closed: "neutral", Graded: "success",
  "Needs grading": "warning", "Graded (not released)": "accent", Released: "success",
};
type TeacherStatus = "Needs grading" | "Graded (not released)" | "Released";

/** Status badge using the fixed vocabulary in docs/design/ui-guidelines.md. */
export function StatusBadge({ status }: { status: StudentStatus | TeacherStatus }) {
  return <Badge tone={statusTone[status]}>{status}</Badge>;
}

export function Due({ at }: { at: string }) {
  return <><time dateTime={at}>{fmtDateTime(at)}</time> <span className="muted">· {relative(at)}</span></>;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return <Paragraph className="muted" role="status" aria-live="polite">{label}…</Paragraph>;
}

export function ErrorNote({ error }: { error: Error | string | null | undefined }) {
  if (!error) return null;
  return <Alert data-color="danger" role="alert">{typeof error === "string" ? error : error.message}</Alert>;
}

/** Focus a field by id, after React has rendered its error text. */
export const focusField = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

/** After a row disappears, keep keyboard users in the page: focus the page heading. */
export const focusHeading = () => requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());

type FieldBase = { label: string; hint?: string; error?: string; optional?: boolean };
// React 19: `ref` is a regular prop on function components.
type WithRef<T> = { ref?: Ref<T> };

/** Fields are required unless marked "Optional" beside the label (Designsystemet's blue tag);
 *  `required` on the control carries the state for assistive tech. Designsystemet's Field links
 *  the label, hint and error to the control. */
function FieldFrame({ id, label, hint, error, optional, children }: FieldBase & { id: string; children: ReactNode }) {
  return (
    <DsField>
      {optional ? <div className="label-row"><Label htmlFor={id}>{label}</Label><Tag data-color="info" data-size="sm">Optional</Tag></div> : <Label htmlFor={id}>{label}</Label>}
      {hint && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      {children}
      {error && <ValidationMessage id={`${id}-error`} className="error-text">{error}</ValidationMessage>}
    </DsField>
  );
}

export function Field({ label, hint, error, optional, id, ...rest }: FieldBase & WithRef<HTMLInputElement> & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldFrame id={fid} label={label} hint={hint} error={error} optional={optional}><Input id={fid} {...(rest as object)} /></FieldFrame>;
}

export function TextArea({ label, hint, error, optional, id, ...rest }: FieldBase & WithRef<HTMLTextAreaElement> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldFrame id={fid} label={label} hint={hint} error={error} optional={optional}><Textarea id={fid} rows={5} {...rest} /></FieldFrame>;
}

export function Select({ label, hint, error, optional, id, children, ...rest }: FieldBase & WithRef<HTMLSelectElement> & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const fid = id ?? auto;
  return <FieldFrame id={fid} label={label} hint={hint} error={error} optional={optional}><DsSelect id={fid} {...(rest as object)}>{children}</DsSelect></FieldFrame>;
}

/** A file picker as Designsystemet's upload area: click anywhere in it, or drop a file on it.
 *  The text inside repeats what the file input itself announces, so it is hidden from assistive tech. */
export function FileField({ label, hint, error, optional, id, onChange, ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const fid = id ?? auto;
  const [chosen, setChosen] = useState<string>();
  return (
    <FieldFrame id={fid} label={label} hint={hint} error={error} optional={optional}>
      <FileUpload>
        <Paragraph aria-hidden="true">{chosen ?? "Drag a file here, or"}</Paragraph>
        <DsButton asChild variant="secondary"><span aria-hidden="true">{chosen ? "Choose another file" : "Choose file"}</span></DsButton>
        <input id={fid} type="file" onChange={(e) => { setChosen(e.target.files?.[0]?.name); onChange?.(e); }} {...rest} />
      </FileUpload>
    </FieldFrame>
  );
}

/** Password input, masked until the person ticks "Show password" (for passwords they must pass on). */
export function PasswordField(props: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <Field {...props} type={shown ? "text" : "password"} />
      <Checkbox label="Show password" checked={shown} onChange={(e) => setShown(e.target.checked)} />
    </>
  );
}

export function Checkbox({ label, ...rest }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <DsCheckbox label={label} {...(rest as object)} />;
}

/** Designsystemet dialog with a labelled heading; closes on Escape and outside clicks.
 *  Every dialog has its own Cancel button, so the icon-only close button is left out. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const hid = useId();
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      // Focus the first field, or the first button (Cancel) in a confirm dialog.
      requestAnimationFrame(() => {
        const d = ref.current;
        (d?.querySelector<HTMLElement>("input, select, textarea") ?? d?.querySelector<HTMLElement>("button"))?.focus();
      });
    } else if (opener.current instanceof HTMLElement) opener.current.focus();
  }, [open]);
  return (
    <DsDialog ref={ref} open={open} onClose={onClose} closeButton={false} closedby="any" aria-labelledby={hid}>
      <Heading level={2} data-size="xs" id={hid}>{title}</Heading>
      {open && <div className="dialog-body">{children}</div>}
    </DsDialog>
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
      <div role="status" aria-live="polite" className={msg ? "toast" : "ds-sr-only"}>{msg}</div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

export function Avatar({ name }: { name: string }) {
  return <DsAvatar aria-hidden="true" data-size="sm" data-color="accent">{initials(name)}</DsAvatar>;
}

/** Confirmation dialog for destructive actions: Cancel is focused first. */
export function Confirm({ open, title, children, confirmLabel, onConfirm, onCancel, busy }: { open: boolean; title: string; children?: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <Dialog open={open} onClose={onCancel} title={title}>
      {children && <Paragraph>{children}</Paragraph>}
      <div className="actions">
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="primary" data-color="danger" onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
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
      <div className="stack">
        <Paragraph>If you think this is a mistake, contact your teacher or administrator.</Paragraph>
        <Paragraph><TextLink to="/">Go to your dashboard</TextLink></Paragraph>
      </div>
    </div>
  );
}
export function NotFound() {
  useTitle("Page not found");
  return (
    <div className="content">
      <PageHeader title="Page not found" />
      <div className="stack">
        <Paragraph>This page doesn't exist or has been removed.</Paragraph>
        <Paragraph><TextLink to="/">Go to your dashboard</TextLink></Paragraph>
      </div>
    </div>
  );
}
