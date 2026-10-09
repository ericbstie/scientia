import { useState, type FormEvent } from "react";
import { AdminNav } from "./AdminNav";
import { Badge, Button, Confirm, Dialog, Empty, ErrorNote, ErrorSummary, Field, focusField, Loading, PageHeader, PasswordField, Select, Status, useTitle, useToast } from "../../ui";
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

export function AdminUsers() {
  const { profile } = useAuth();
  useTitle("Users");
  const toast = useToast();
  const { data, error, loading, reload } = useQuery(async () => must(await db().rpc("admin_users")) as Row[]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [creating, setCreating] = useState(false);
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
      <PageHeader title="Users" actions={<Button variant="primary" onClick={() => setCreating(true)}>New user</Button>} />
      <AdminNav />
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
          <table>
            <caption className="visually-hidden">Users</caption>
            <thead><tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <th scope="row">{u.full_name}</th>
                  <td>{u.email}</td>
                  <td>
                    {u.id === profile?.id ? <span className="cap">{u.role}</span> : (
                      <select className="select" aria-label={`Role for ${u.full_name}`} value={u.role} disabled={busy} onChange={(e) => setUserRole(u, e.target.value)}>
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td><Badge tone={u.deactivated ? undefined : "success"}>{u.deactivated ? "Deactivated" : "Active"}</Badge></td>
                  <td>
                    <div className="actions">
                      <Button size="small" variant="ghost" aria-label={`Reset password for ${u.full_name}`} onClick={() => setResetting(u)}>Reset password</Button>
                      {u.deactivated ? (
                        <Button size="small" variant="ghost" aria-label={`Reactivate ${u.full_name}`} disabled={busy} onClick={() => setDeactivated(u, false)}>Reactivate</Button>
                      ) : u.id === profile?.id ? (
                        <>
                          <Button size="small" variant="ghost" aria-label={`Deactivate ${u.full_name}`} disabled>Deactivate</Button>
                          <span className="muted">You can't deactivate your own account</span>
                        </>
                      ) : (
                        <Button size="small" variant="ghost" aria-label={`Deactivate ${u.full_name}`} onClick={() => setDeactivating(u)}>Deactivate</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)} title="New user">
        <NewUserForm onCancel={() => setCreating(false)} onDone={(name, r) => { setCreating(false); toast(`${name} added as ${r === "admin" ? "an" : "a"} ${r}`); reload(); }} />
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
