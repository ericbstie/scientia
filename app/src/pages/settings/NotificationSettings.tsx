import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Checkbox, ErrorNote, Loading, PageHeader, Section, useTitle, useToast } from "../../ui";
import { SettingsNav } from "../personal/ui";

const KINDS: [string, string][] = [
  ["announcement", "New announcement"],
  ["assignment", "New assignment"],
  ["due_changed", "Due date changed"],
  ["grade", "Grade released"],
  ["reply", "Replies to me"],
];

export function NotificationSettings() {
  const { profile } = useAuth();
  const toast = useToast();
  useTitle("Notification settings");
  const [failure, setFailure] = useState<Error | null>(null);
  const { data, error, loading, setData } = useQuery(async () => {
    const rows = must(await db().from("notification_prefs").select("kind, enabled").eq("user_id", profile!.id)) as { kind: string; enabled: boolean }[];
    const off = new Set(rows.filter((r) => !r.enabled).map((r) => r.kind));
    return Object.fromEntries(KINDS.map(([k]) => [k, !off.has(k)])) as Record<string, boolean>;
  }, [profile!.id]);

  async function change(kind: string, enabled: boolean) {
    const before = data;
    setData({ ...data!, [kind]: enabled });
    setFailure(null);
    const { error } = await db().from("notification_prefs").upsert({ user_id: profile!.id, kind, enabled }, { onConflict: "user_id,kind" });
    if (error) {
      setData(before);
      setFailure(new Error("Could not save. Check your connection and try again."));
    } else toast("Saved");
  }

  return (
    <div className="content">
      <PageHeader title="Settings" />
      <SettingsNav />
      <Section title="Notifications">
        <p>Notifications appear in Scientia only. No email is sent.</p>
        <ErrorNote error={error ?? failure} />
        {loading && !data ? <Loading /> : data && (
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--s3)" }}>
            <legend className="visually-hidden">Notify me about</legend>
            {KINDS.map(([k, label]) => (
              <Checkbox key={k} label={label} checked={data[k]} onChange={(e) => change(k, e.target.checked)} />
            ))}
          </fieldset>
        )}
      </Section>
    </div>
  );
}
