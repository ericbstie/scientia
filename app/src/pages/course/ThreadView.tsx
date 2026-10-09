import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { fmtDateTime } from "../../lib/format";
import { db, isUuid, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, Confirm, ErrorNote, focusField, focusHeading, Loading, NotFound, PageHeader, Section, TextArea, useToast } from "../../ui";
import { Prose } from "../../ui/Prose";

type Post = { key: string; kind: "first" | "reply"; removed?: boolean; replyId?: string; authorId?: string; author?: string; at: string; text: string };

export function ThreadView() {
  const { course, role } = useCourse();
  const { threadId } = useParams();
  const teacher = role === "teacher";
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/courses/${course.id}`;
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string>();
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removingPost, setRemovingPost] = useState<Post | null>(null);
  const [removingThread, setRemovingThread] = useState(false);

  const q = useQuery(async () => {
    if (!isUuid(threadId)) return null;
    const [thread, replies, people] = await Promise.all([
      db().from("threads").select("id, title, body, created_at, author_id, author:profiles!author_id(full_name)").eq("id", threadId!).eq("course_id", course.id).maybeSingle(),
      db().from("replies").select("id, body, removed, created_at, author_id, author:profiles!author_id(full_name)").eq("thread_id", threadId!).order("created_at"),
      db().rpc("course_people", { c: course.id }),
    ]);
    const t = must(thread) as unknown as { id: string; title: string; body: string; created_at: string; author_id: string; author: { full_name: string } | null } | null;
    if (!t) return null;
    const teachers = new Set((must(people) as { user_id: string; role: string }[]).filter((p) => p.role === "teacher").map((p) => p.user_id));
    return { thread: t, replies: must(replies) as unknown as { id: string; body: string; removed: boolean; created_at: string; author_id: string; author: { full_name: string } | null }[], teachers };
  }, [threadId, course.id]);
  useDocTitle(q.data?.thread.title);

  async function sendReply(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!reply.trim()) { setReplyError("Enter a reply"); focusField("thread-reply"); return; }
    setReplyError(undefined);
    setBusy(true);
    try {
      must(await db().from("replies").insert({ thread_id: threadId, body: reply.trim() }).select("id"));
      setReply("");
      toast("Reply posted");
      await q.reload();
    } catch (err) { setFail("Could not post. Check your connection and try again."); console.error(err); }
    setBusy(false);
  }

  async function removePost() {
    if (!removingPost?.replyId || !q.data) return;
    setBusy(true);
    setFail(null);
    try {
      // Flag it and clear the text, so the post stays visible as removed but its content is gone.
      must(await db().from("replies").update({ removed: true, body: "" }).eq("id", removingPost.replyId).select("id"));
      setRemovingPost(null);
      toast("Post removed");
      await q.reload();
      focusHeading();
    } catch (err) { setFail("Could not remove the post. Check your connection and try again."); setRemovingPost(null); console.error(err); }
    setBusy(false);
  }

  async function removeThread() {
    setBusy(true);
    setFail(null);
    try {
      must(await db().from("threads").delete().eq("id", threadId!).select("id"));
      toast("Thread deleted");
      navigate(`${base}/discussions`);
    } catch (err) { setFail("Could not delete the thread. Check your connection and try again."); setRemovingThread(false); console.error(err); }
    setBusy(false);
  }

  if (q.error) return <div className="content"><ErrorNote error={q.error} /></div>;
  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;

  const { thread, replies, teachers } = q.data;
    const posts: Post[] = ([
    { key: "first", kind: "first", authorId: thread.author_id, author: thread.author?.full_name, at: thread.created_at, text: thread.body },
    ...replies.map((r): Post => ({ key: r.id, kind: "reply", replyId: r.id, authorId: r.author_id, author: r.author?.full_name, at: r.created_at, text: r.body, removed: r.removed })),
  ]  as Post[]).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <div className="content">
      <PageHeader
        eyebrow={<Link to={`${base}/discussions`}>‹ Discussions</Link>}
        title={thread.title}
        actions={teacher && <Button variant="danger" onClick={() => setRemovingThread(true)}>Delete thread</Button>}
      />
      <ErrorNote error={fail} />
      <Section title="Posts">
        <ul className="list">
          {posts.map((p) => (
            <li key={p.key}>
              <div className="row" style={{ alignItems: "flex-start" }}>
                <div className="row-main">
                  {p.removed ? (
                    <>
                      <p className="muted" style={{ margin: 0 }}>This post was removed by a teacher</p>
                      <div className="row-meta"><time dateTime={p.at}>{fmtDateTime(p.at)}</time></div>
                    </>
                  ) : (
                    <>
                      <div className="row-meta" style={{ marginBottom: "var(--s1)" }}>
                        <strong style={{ color: "var(--text)" }}>{p.author}</strong>
                        {p.authorId && teachers.has(p.authorId) && <> <Badge>Teacher</Badge></>}
                        {" · "}<time dateTime={p.at}>{fmtDateTime(p.at)}</time>
                      </div>
                      <Prose text={p.text} />
                    </>
                  )}
                </div>
                {teacher && p.kind === "reply" && !p.removed && (
                  <div className="row-side"><Button size="small" variant="danger" className="ghost" aria-label={`Delete reply by ${p.author ?? "unknown author"}, ${fmtDateTime(p.at)}`} onClick={() => setRemovingPost(p)}>Delete</Button></div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <form className="form" onSubmit={sendReply} noValidate>
        <TextArea id="thread-reply" label="Reply" required value={reply} onChange={(e) => setReply(e.target.value)} error={replyError} rows={4} />
        <div className="actions"><Button variant="primary" type="submit" disabled={busy}>Reply</Button></div>
      </form>
      <Confirm
        open={!!removingPost}
        title={`Delete ${removingPost?.author ?? "this"}'s reply?`}
        confirmLabel="Delete"
        onConfirm={removePost}
        onCancel={() => setRemovingPost(null)}
        busy={busy}
      >
        Everyone will see "This post was removed by a teacher" in its place. This cannot be undone.
      </Confirm>
      <Confirm
        open={removingThread}
        title={`Delete the thread "${thread.title}"?`}
        confirmLabel="Delete"
        onConfirm={removeThread}
        onCancel={() => setRemovingThread(false)}
        busy={busy}
      >
        The thread and all its replies will be removed for everyone. This cannot be undone.
      </Confirm>
    </div>
  );
}
