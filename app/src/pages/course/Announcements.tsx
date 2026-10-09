import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDate } from "../../lib/format";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, ButtonLink, Confirm, Empty, ErrorNote, focusHeading, Loading, PageHeader, useToast } from "../../ui";

export type AnnouncementRow = { id: string; title: string; body: string; pinned: boolean; created_at: string; edited_at: string | null; author: { full_name: string } | null };

export function Announcements() {
  const { course, role } = useCourse();
  const { profile } = useAuth();
  const teacher = role === "teacher";
  const toast = useToast();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const base = `/courses/${course.id}`;
  useDocTitle("Announcements");
  const [removing, setRemoving] = useState<AnnouncementRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  const q = useQuery(async () => {
    const [anns, reads] = await Promise.all([
      db()
        .from("announcements")
        .select("id, title, body, pinned, created_at, edited_at, author:profiles!author_id(full_name)")
        .eq("course_id", course.id)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false }),
      db().from("announcement_reads").select("announcement_id").eq("user_id", profile!.id),
    ]);
    return {
      list: must(anns) as unknown as AnnouncementRow[],
      reads: new Set((must(reads) as { announcement_id: string }[]).map((r) => r.announcement_id)),
    };
  }, [course.id]);

  // Notifications link to /announcements#<id>: open that announcement.
  useEffect(() => {
    const id = hash.replace(/^#/, "");
    if (id && q.data?.list.some((a) => a.id === id)) navigate(`${base}/announcements/${id}`, { replace: true });
  }, [hash, q.data, base, navigate]);

  async function togglePin(a: AnnouncementRow) {
    setActionError(null);
    try {
      must(await db().from("announcements").update({ pinned: !a.pinned }).eq("id", a.id).select("id"));
      await q.reload();
      toast(a.pinned ? "Announcement unpinned" : "Announcement pinned");
    } catch { setActionError("Could not save. Check your connection and try again."); }
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setActionError(null);
    try {
      must(await db().from("announcements").delete().eq("id", removing.id).select("id"));
      setRemoving(null);
      toast("Announcement deleted");
      await q.reload();
      focusHeading();
    } catch { setActionError("Could not delete the announcement. Check your connection and try again."); setRemoving(null); }
    setBusy(false);
  }

  const list = q.data?.list ?? [];
  const reads = q.data?.reads ?? new Set<string>();
  return (
    <div className="content">
      <PageHeader title="Announcements" actions={teacher && <ButtonLink variant="primary" to={`${base}/announcements/new`}>New announcement</ButtonLink>} />
      <ErrorNote error={q.error ?? actionError} />
      {q.loading && !q.data ? <Loading /> : list.length === 0 ? (
        <Empty title="No announcements yet." action={teacher && <ButtonLink to={`${base}/announcements/new`}>New announcement</ButtonLink>} />
      ) : (
        <ul className="list">
          {list.map((a) => {
            return (
              <li key={a.id}>
                <div className="row">
                  <div className="row-main">
                    <Link className="row-title" to={`${base}/announcements/${a.id}`}>{a.title}</Link>
                    <div className="row-meta">
                      {a.author?.full_name} · <time dateTime={a.created_at}>{fmtDate(a.created_at)}</time>
                      {a.pinned && <> <Badge>Pinned</Badge></>}
                      {!teacher && !reads.has(a.id) && <> <Badge tone="accent">Unread</Badge></>}
                      {a.edited_at && <> <Badge>Edited</Badge></>}
                    </div>
                  </div>
                  {teacher && (
                    <div className="row-side actions">
                      <Button size="small" variant="ghost" aria-label={`${a.pinned ? "Unpin" : "Pin"} announcement ${a.title}`} onClick={() => togglePin(a)}>{a.pinned ? "Unpin" : "Pin"}</Button>
                      <ButtonLink size="small" variant="ghost" aria-label={`Edit announcement ${a.title}`} to={`${base}/announcements/${a.id}/edit`}>Edit</ButtonLink>
                      <Button size="small" variant="danger" className="ghost" aria-label={`Delete announcement ${a.title}`} onClick={() => setRemoving(a)}>Delete</Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Confirm
        open={!!removing}
        title={`Delete the announcement "${removing?.title ?? ""}"?`}
        confirmLabel="Delete"
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
        busy={busy}
      >
        Students will no longer see it. This cannot be undone.
      </Confirm>
    </div>
  );
}
