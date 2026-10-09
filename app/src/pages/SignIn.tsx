import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { db, isDemo } from "../lib/supabase";
import { Button, Field, useTitle } from "../ui";

export const DEMO_ACCOUNTS = [
  { label: "Student", email: "maya.okafor@scientia.test" },
  { label: "Teacher", email: "ingrid.solberg@scientia.test" },
  { label: "Admin", email: "admin@scientia.test" },
];
export const DEMO_PASSWORD = "Demo-pass-123";

export function SignIn() {
  useTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const from = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await db().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/banned/i.test(error.message)) return setError("This account is deactivated. Contact your administrator.");
      if (/invalid login credentials/i.test(error.message)) return setError("Email or password is incorrect.");
      return setError("Could not sign in. Check your connection and try again.");
    }
    navigate(from, { replace: true });
  }

  return (
    <main className="auth-page" id="main">
      <div className="auth-card card">
        <div className="brand" style={{ padding: 0, marginBottom: "var(--s5)" }}>
          <span className="brand-mark" aria-hidden="true">S</span> Scientia
        </div>
        <h1>Sign in to Scientia</h1>
        {error && <div className="alert danger" role="alert">{error}</div>}
        <form className="form" onSubmit={submit}>
          <Field label="Email" type="email" autoFocus autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        {isDemo() && <div className="demo-accounts muted">
          <p>Demo accounts (password <code>{DEMO_PASSWORD}</code>):</p>
          <ul>
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}>
                  {a.label}: {a.email}
                </button>
              </li>
            ))}
          </ul>
        </div>}
      </div>
    </main>
  );
}
