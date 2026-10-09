import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { db, isDemo } from "../lib/supabase";
import { BrandMark, Button, ErrorNote, Field, useTitle } from "../ui";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "maya.okafor@scientia.test" },
  { label: "Teacher", email: "ingrid.solberg@scientia.test" },
  { label: "Admin", email: "admin@scientia.test" },
];
const DEMO_PASSWORD = "Demo-pass-123";

export function SignIn() {
  useTitle("Sign in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const from = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const need = { email: email.trim() ? undefined : "Enter your email", password: password ? undefined : "Enter your password" };
    setMissing(need);
    if (need.email || need.password) return document.getElementById(need.email ? "si-email" : "si-password")?.focus();
    setBusy(true);
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
        <div className="brand"><BrandMark /> Scientia</div>
        <h1>Sign in</h1>
        <ErrorNote error={error} />
        <form className="form" onSubmit={submit} noValidate>
          <Field id="si-email" label="Email" type="email" autoFocus autoComplete="email" required value={email} error={missing.email} onChange={(e) => setEmail(e.target.value)} />
          <Field id="si-password" label="Password" type="password" autoComplete="current-password" required value={password} error={missing.password} onChange={(e) => setPassword(e.target.value)} />
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
