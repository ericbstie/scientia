import { useState, type FormEvent } from "react";
import { useAuth } from "../../lib/auth";
import { db } from "../../lib/supabase";
import { Button, ErrorNote, Field, PageHeader, Section, useToast } from "../../ui";
import { SettingsNav } from "../personal/ui";

export function Profile() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(profile!.full_name);
  const [nameError, setNameError] = useState<string>();
  const [nameFail, setNameFail] = useState<Error | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [curError, setCurError] = useState<string>();
  const [nextError, setNextError] = useState<string>();
  const [pwFail, setPwFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setNameFail(null);
    const trimmed = name.trim();
    if (!trimmed) return setNameError("Enter a display name.");
    setNameError(undefined);
    const { error } = await db().from("profiles").update({ full_name: trimmed }).eq("id", profile!.id);
    if (error) return setNameFail(new Error("Could not save. Check your connection and try again."));
    await refreshProfile();
    setName(trimmed);
    toast("Saved");
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwFail(null);
    const curErr = current ? undefined : "Enter your current password.";
    const nextErr = next.length >= 8 ? undefined : "Password must be at least 8 characters";
    setCurError(curErr);
    setNextError(nextErr);
    if (curErr || nextErr) return;
    setBusy(true);
    try {
      const check = await db().auth.signInWithPassword({ email: profile!.email, password: current });
      if (check.error) return setCurError("Current password is incorrect");
      const { error } = await db().auth.updateUser({ password: next });
      if (error) {
        if (/different from the old/i.test(error.message)) return setNextError("The new password must be different from the current one.");
        if (/at least|weak|short/i.test(error.message)) return setNextError("Password must be at least 8 characters");
        return setPwFail(new Error("Could not change the password. Check your connection and try again."));
      }
      setCurrent("");
      setNext("");
      toast("Password changed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="content">
      <PageHeader title="Settings" />
      <SettingsNav />
      <Section title="Profile">
        <form className="form card" onSubmit={saveName} noValidate>
          <ErrorNote error={nameFail} />
          <Field label="Email" type="email" value={profile!.email} readOnly />
          <Field label="Display name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} autoComplete="name" />
          <div className="actions"><Button type="submit" variant="primary">Save name</Button></div>
        </form>
      </Section>
      <Section title="Password">
        <form className="form card" onSubmit={changePassword} noValidate>
          <ErrorNote error={pwFail} />
          <Field label="Current password" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={curError} />
          <Field label="New password" type="password" autoComplete="new-password" hint="At least 8 characters" value={next} onChange={(e) => setNext(e.target.value)} error={nextError} />
          <div className="actions"><Button type="submit" disabled={busy}>Change password</Button></div>
        </form>
      </Section>
    </div>
  );
}
