import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCourse } from "../../App";
import { fmtDateTime } from "../../lib/format";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, Confirm, ErrorNote, Loading, NotFound, PageHeader, Section, TextArea, useToast } from "../../ui";
import { joinBody, splitBody } from "./content/meta";
import { Prose } from "./content/Prose";
import { focusField, focusHeading, useDocTitle } from "./content/util";

type Post = { key: string; kind: "first" | "reply" | "removed"; replyId?: string; authorId?: string; author?: string; at: string; text: string };

export function ThreadView() {
  const { course, role } = useCourse();
  const { threadId } = useParams();
  const teacher = role === "teacher";
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/courses/${course.id}`;
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string>();
  const [fail, setFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const [removingPost, setRemovingPost] = useState<Post | null>(null);
  const [removingThread, setRemovingThread] = useState(false);

  const q = useQuery(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(threadId ?? "")) return null;
    const [thread, replies, people] = await Promise.all([
      db().from("threads").select("id, title, body, created_at, author_id, author:profiles!author_id(full_name)").eq("id", threadId!).eq("course_id", course.id).maybeSingle(),
      db().from("replies").select("id, body, created_at, author_id, author:profiles!author_id(full_name)").eq("thread_id", threadId!).order("created_at"),
      db().rpc("course_people", { c: course.id }),
    ]);
    const t = must(thread) as unknown as { id: string; title: string; body: string; created_at: string; author_id: string; author: { full_name: string } | null } | null;
    if (!t) return null;
    const teachers = new Set((must(people) as { user_id: string; role: string }[]).filter((p) => p.role === "teacher").map((p) => p.user_id));
    return { thread: t, replies: must(replies) as unknown as { id: string; body: string; created_at: string; author_id: string; author: { full_name: string } | null }[], teachers };
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
    } catch (err) { setFail(new Error("Could not post. Check your connection and try again.")); console.error(err); }
    setBusy(false);
  }

  async function removePost() {
    if (!removingPost?.replyId || !q.data) return;
    setBusy(true);
    setFail(null);
    try {
      const { text, meta } = splitBody(q.data.thread.body);
      must(await db().from("replies").delete().eq("id", removingPost.replyId).select("id"));
      // Keep a marker so the removed post stays visible as removed to everyone.
      must(await db().from("threads").update({ body: joinBody(text, { ...meta, removed: [...(meta.removed ?? []), removingPost.at] }) }).eq("id", threadId!).select("id"));
      setRemovingPost(null);
      toast("Post removed");
      await q.reload();
      focusHeading();
    } catch (err) { setFail(new Error("Could not remove the post. Check your connection and try again.")); setRemovingPost(null); console.error(err); }
    setBusy(false);
  }

  async function removeThread() {
    setBusy(true);
    setFail(null);
    try {
      must(await db().from("threads").delete().eq("id", threadId!).select("id"));
      toast("Thread deleted");
      navigate(`${base}/discussions`);
    } catch (err) { setFail(new Error("Could not delete the thread. Check your connection and try again.")); setRemovingThread(false); console.error(err); }
    setBusy(false);
  }

  if (q.error) return <div className="content"><ErrorNote error={q.error} /></div>;
  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;

  const { thread, replies, teachers } = q.data;
  const { text: firstText, meta } = splitBody(thread.body);
  const posts: Post[] = ([
    { key: "first", kind: "first", authorId: thread.author_id, author: thread.author?.full_name, at: thread.created_at, text: firstText },
    ...replies.map((r): Post => ({ key: r.id, kind: "reply", replyId: r.id, authorId: r.author_id, author: r.author?.full_name, at: r.created_at, text: r.body })),
    ...(meta.removed ?? []).map((at, i): Post => ({ key: `removed-${i}`, kind: "removed", at, text: "" })),
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
                  {p.kind === "removed" ? (
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
                {teacher && p.kind === "reply" && (
                  <div className="row-side"><Button size="small" variant="danger" className="ghost" onClick={() => setRemovingPost(p)}>Delete</Button></div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <form className="form" onSubmit={sendReply} noValidate>
        <TextArea id="thread-reply" label="Reply" value={reply} onChange={(e) => setReply(e.target.value)} error={replyError} rows={4} />
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
