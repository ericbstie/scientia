import { ListItem, ListUnordered, Paragraph, Select as DsSelect, Table } from "@digdir/designsystemet-react";
import { useState, type FormEvent } from "react";
import { Badge, Button, Confirm, Dialog, Empty, ErrorNote, ErrorSummary, Field, FileField, focusField, Loading, PageHeader, PasswordField, Select, Status, useTitle, useToast } from "../../ui";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { useAuth } from "../../lib/auth";

type Row = { id: string; full_name: string; email: string; role: string; deactivated: boolean };

async function api(path: string, method: string, body: unknown) {
  const { data } = await db().auth.getSession();
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  return { ok: res.ok, status: res.status, error: json.error };
}

const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const roleNames = ["student", "teacher", "admin"];

export function AdminUsers() {
  const { profile } = useAuth();
  useTitle("Users");
  const toast = useToast();
  const { data, error, loading, reload } = useQuery(async () => must(await db().rpc("admin_users")) as Row[]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState<Row | null>(null);
  const [deactivating, setDeactivating] = useState<Row | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const q = search.trim().toLowerCase();
  const rows = (data ?? []).filter((u) => (!role || u.role === role) && (!q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));

  async function setDeactivated(u: Row, deactivated: boolean) {
    setBusy(true);
    setActionError(null);
    const r = await api(`/api/admin/users/${u.id}`, "PATCH", { deactivated });
    setBusy(false);
    setDeactivating(null);
    if (!r.ok) return setActionError(r.error ?? "Could not update the account. Check your connection and try again.");
    toast(deactivated ? `${u.full_name} deactivated` : `${u.full_name} reactivated`);
    reload();
  }

  async function setUserRole(u: Row, newRole: string) {
    setBusy(true);
    setActionError(null);
    const r = await api(`/api/admin/users/${u.id}`, "PATCH", { role: newRole });
    setBusy(false);
    if (!r.ok) return setActionError(r.error ?? "Could not update the account. Check your connection and try again.");
    toast(`${u.full_name} is now ${newRole === "admin" ? "an" : "a"} ${newRole}`);
    reload();
  }

  return (
    <div className="content wide">
      <PageHeader title="Users" actions={<><Button onClick={() => setImporting(true)}>Import users</Button><Button variant="primary" onClick={() => setCreating(true)}>New user</Button></>} />
      <ErrorNote error={error} />
      <ErrorNote error={actionError} />
      <Status>{data ? `Showing ${rows.length} ${rows.length === 1 ? "user" : "users"}` : ""}</Status>
      <div className="toolbar">
        <Field label="Search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Show role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      {loading && !data ? <Loading /> : rows.length === 0 ? (
        <Empty title="No users match your search" />
      ) : (
        <div className="table-wrap">
          <Table data-color="neutral" data-size="sm" className="stack-rows">
            <caption className="ds-sr-only">Users</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody data-color="accent">
              {rows.map((u) => (
                <tr key={u.id}>
                  <th scope="row">{u.full_name}</th>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">
                    {u.id === profile?.id ? <span className="cap">{u.role}</span> : (
                      <DsSelect className="role-select" aria-label={`Role for ${u.full_name}`} value={u.role} disabled={busy} onChange={(e) => setUserRole(u, e.target.value)}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </DsSelect>
                    )}
                  </td>
                  <td data-label="Status"><Badge tone={u.deactivated ? undefined : "success"}>{u.deactivated ? "Deactivated" : "Active"}</Badge></td>
                  <td data-label="Actions">
                    <div className="actions">
                      <Button variant="tertiary" aria-label={`Reset password for ${u.full_name}`} onClick={() => setResetting(u)}>Reset password</Button>
                      {u.deactivated ? (
                        <Button variant="tertiary" aria-label={`Reactivate ${u.full_name}`} disabled={busy} onClick={() => setDeactivated(u, false)}>Reactivate</Button>
                      ) : u.id === profile?.id ? (
                        <>
                          <Button variant="tertiary" aria-label={`Deactivate ${u.full_name}`} disabled>Deactivate</Button>
                          <span className="muted">You can't deactivate your own account</span>
                        </>
                      ) : (
                        <Button variant="tertiary" aria-label={`Deactivate ${u.full_name}`} onClick={() => setDeactivating(u)}>Deactivate</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="New user">
        <NewUserForm onCancel={() => setCreating(false)} onDone={(name, r) => { setCreating(false); toast(`${name} added as ${r === "admin" ? "an" : "a"} ${r}`); reload(); }} />
      </Dialog>
      <Dialog open={importing} onClose={() => setImporting(false)} title="Import users">
        <ImportForm existing={new Set((data ?? []).map((u) => u.email.toLowerCase()))} onClose={() => setImporting(false)} onAdded={(n) => { toast(`${n} ${n === 1 ? "user" : "users"} added`); reload(); }} />
      </Dialog>
      <Dialog open={!!resetting} onClose={() => setResetting(null)} title={resetting ? `Reset password for ${resetting.full_name}` : "Reset password"}>
        {resetting && <ResetForm user={resetting} onCancel={() => setResetting(null)} onDone={() => { toast(`Password reset for ${resetting.full_name}`); setResetting(null); }} />}
      </Dialog>
      <Confirm
        open={!!deactivating}
        title={deactivating ? `Deactivate ${deactivating.full_name}?` : "Deactivate user?"}
        confirmLabel="Deactivate"
        busy={busy}
        onCancel={() => setDeactivating(null)}
        onConfirm={() => deactivating && setDeactivated(deactivating, true)}
      >
        They will not be able to sign in. Their work is kept and you can reactivate the account later.
      </Confirm>
    </div>
  );
}

function NewUserForm({ onCancel, onDone }: { onCancel: () => void; onDone: (name: string, role: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Enter a name";
    if (!emailOk(email.trim())) errs.email = "Enter a valid email address";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return focusField(errs.name ? "nu-name" : errs.email ? "nu-email" : "nu-password");
    setBusy(true);
    const r = await api("/api/admin/users", "POST", { email: email.trim(), password, full_name: name.trim(), role });
    setBusy(false);
    if (r.status === 409) {
      setErrors({ email: "An account with this email already exists" });
      return focusField("nu-email");
    }
    if (!r.ok) return setFormError(r.error ?? "Could not create the account. Check your connection and try again.");
    onDone(name.trim(), role);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={formError} />
      <ErrorSummary errors={[errors.name && { id: "nu-name", message: errors.name }, errors.email && { id: "nu-email", message: errors.email }, errors.password && { id: "nu-password", message: errors.password }]} />
      <Field id="nu-name" label="Name" required value={name} error={errors.name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      <Field id="nu-email" label="Email" required type="email" value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      <Select label="Role" required value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </Select>
      <PasswordField id="nu-password" label="Password" required hint="At least 8 characters. Give it to the person so they can sign in." value={password} error={errors.password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
      <div className="actions">
        <Button type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function ResetForm({ user, onCancel, onDone }: { user: Row; onCancel: () => void; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return focusField("rp-password");
    }
    setError(undefined);
    setBusy(true);
    const r = await api(`/api/admin/users/${user.id}`, "PATCH", { password });
    setBusy(false);
    if (!r.ok) return setFormError(r.error ?? "Could not reset the password. Check your connection and try again.");
    onDone();
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={formError} />
      <PasswordField id="rp-password" label="New password" required hint="At least 8 characters." value={password} error={error} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
      <div className="actions">
        <Button type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

type ImportRow = { row: number; full_name: string; email: string; role: string; password: string; problem?: string };

/** Splits CSV text into rows of cells. The separator is a comma, semicolon or tab, whichever the first row uses most. */
function parseCsv(text: string) {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split("\n", 1)[0];
  const sep = [";", "\t"].find((s) => first.split(s).length > first.split(",").length) ?? ",";
  const rows: string[][] = [[]];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') cell += text[++i];
      else quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === sep || c === "\n") {
      rows.at(-1)!.push(cell);
      cell = "";
      if (c === "\n") rows.push([]);
    } else if (c !== "\r") cell += c;
  }
  rows.at(-1)!.push(cell);
  return rows.map((r) => r.map((c) => c.trim()));
}

/** Reads the import file; returns the rows, each with the first problem found, or a message about the whole file. */
function readUsers(text: string, existing: Set<string>): ImportRow[] | string {
  const [head = [], ...rest] = parseCsv(text);
  const col = Object.fromEntries(["name", "email", "role", "password"].map((h) => [h, head.findIndex((c) => c.toLowerCase() === h)]));
  if (col.name < 0 || col.email < 0 || col.password < 0) return "The first row must name the columns name, email and password. A role column is optional.";
  const firstRow = new Map<string, number>();
  const rows = rest.flatMap((cells, i): ImportRow[] => {
    if (!cells.some(Boolean)) return [];
    const r = { row: i + 2, full_name: cells[col.name] ?? "", email: (cells[col.email] ?? "").toLowerCase(), role: (cells[col.role] ?? "").toLowerCase() || "student", password: cells[col.password] ?? "" };
    const twin = firstRow.get(r.email);
    if (twin === undefined) firstRow.set(r.email, r.row);
    const problem =
      (!r.full_name && "Enter a name") ||
      (!emailOk(r.email) && "Enter a valid email address") ||
      (existing.has(r.email) && "An account with this email already exists") ||
      (twin !== undefined && `Same email as row ${twin}`) ||
      (!roleNames.includes(r.role) && "Role must be student, teacher or admin") ||
      (r.password.length < 8 && "Password must be at least 8 characters") ||
      undefined;
    return [{ ...r, problem }];
  });
  return rows.length ? rows : "The file has no people under its first row.";
}

/** Bulk account creation: preview every row, then create the ready ones one by one through the same endpoint as New user. */
function ImportForm({ existing, onClose, onAdded }: { existing: Set<string>; onClose: () => void; onAdded: (n: number) => void }) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileError, setFileError] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [added, setAdded] = useState<number | null>(null);
  const ready = rows?.filter((r) => !r.problem) ?? [];
  const problems = rows?.filter((r) => r.problem) ?? [];

  async function choose(file: File | undefined) {
    setRows(null);
    setFileError(undefined);
    if (!file) return;
    const read = readUsers(await file.text(), existing);
    if (typeof read === "string") setFileError(read);
    else setRows(read);
  }

  async function add() {
    const failed: ImportRow[] = [];
    for (const [i, r] of ready.entries()) {
      setProgress(i + 1);
      const res = await api("/api/admin/users", "POST", { email: r.email, password: r.password, full_name: r.full_name, role: r.role });
      if (!res.ok) failed.push({ ...r, problem: res.error ?? "Could not create the account" });
    }
    setProgress(0);
    const n = ready.length - failed.length;
    if (n) onAdded(n);
    if (!failed.length && !problems.length) return onClose();
    setAdded(n);
    setRows([...problems, ...failed].sort((a, b) => a.row - b.row));
  }

  return (
    <div className="form">
      {added === null && (
        <FileField id="import-file" accept=".csv,text/csv" label="CSV file" required error={fileError} onChange={(e) => choose(e.target.files?.[0])}
          hint="The first row names the columns: name, email, password and, if you need it, role (student, teacher or admin; student when empty). Passwords need at least 8 characters." />
      )}
      {rows && (
        <>
          <div>
            <Paragraph>{added !== null ? `${added} added. These rows were not added:` : `${ready.length} ready to add.${problems.length ? ` ${problems.length} with problems will be skipped:` : ""}`}</Paragraph>
            {problems.length > 0 && <ListUnordered>{problems.map((r) => <ListItem key={r.row}>Row {r.row}{r.email && `, ${r.email}`}: {r.problem}</ListItem>)}</ListUnordered>}
          </div>
          {added === null && ready.length > 0 && (
            <div className="table-wrap">
              <Table data-color="neutral" data-size="sm">
                <caption className="ds-sr-only">Ready to add</caption>
                <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th></tr></thead>
                <tbody data-color="accent">{ready.map((r) => <tr key={r.row}><th scope="row">{r.full_name}</th><td>{r.email}</td><td className="cap">{r.role}</td></tr>)}</tbody>
              </Table>
            </div>
          )}
        </>
      )}
      <div className="actions">
        {added === null && ready.length > 0 && (
          <Button variant="primary" disabled={progress > 0} onClick={add}>{progress ? `Adding ${progress} of ${ready.length}…` : `Add ${ready.length} ${ready.length === 1 ? "user" : "users"}`}</Button>
        )}
        <Button onClick={onClose} disabled={progress > 0}>{added === null ? "Cancel" : "Close"}</Button>
      </div>
    </div>
  );
}
