import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCourse } from "../../App";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Button, ButtonLink, ErrorNote, Field, Loading, NotFound, PageHeader, TextArea, useToast } from "../../ui";
import { joinBody, splitBody, type Meta } from "./content/meta";
import { focusField, useDocTitle } from "./content/util";

export function AnnouncementForm() {
  const { course } = useCourse();
  const { announcementId } = useParams();
  const editing = !!announcementId;
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/courses/${course.id}`;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [meta, setMeta] = useState<Meta>({});
  const [original, setOriginal] = useState({ title: "", message: "" });
  const [titleError, setTitleError] = useState<string>();
  const [fail, setFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  useDocTitle(editing ? "Edit announcement" : "New announcement");

  const q = useQuery(async () => {
    if (!editing) return { found: true };
    if (!/^[0-9a-f-]{36}$/i.test(announcementId!)) return { found: false };
    const row = must(await db().from("announcements").select("id, title, body").eq("id", announcementId!).eq("course_id", course.id).maybeSingle()) as { id: string; title: string; body: string } | null;
    if (!row) return { found: false };
    const { text, meta } = splitBody(row.body);
    setTitle(row.title);
    setMessage(text);
    setMeta(meta);
    setOriginal({ title: row.title, message: text });
    return { found: true };
  }, [announcementId, course.id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!title.trim()) { setTitleError("Enter a title"); focusField("announcement-title"); return; }
    setTitleError(undefined);
    setBusy(true);
    try {
      if (editing) {
        const changed = title.trim() !== original.title || message !== original.message;
        // Edits never notify students: the notification trigger only fires on insert.
        must(await db().from("announcements").update({ title: title.trim(), body: joinBody(message, { ...meta, edited: meta.edited || changed }) }).eq("id", announcementId!).select("id"));
        toast("Saved");
      } else {
        must(await db().from("announcements").insert({ course_id: course.id, title: title.trim(), body: message }).select("id"));
        toast("Announcement posted");
      }
      navigate(`${base}/announcements`);
    } catch (err) { setFail(new Error("Could not save. Check your connection and try again.")); console.error(err); }
    setBusy(false);
  }

  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (q.data && !q.data.found) return <NotFound />;
  return (
    <div className="content">
      <PageHeader eyebrow={<Link to={`${base}/announcements`}>Announcements</Link>} title={editing ? "Edit announcement" : "New announcement"} />
      <form className="form" onSubmit={submit} noValidate>
        <ErrorNote error={fail ?? q.error} />
        <Field id="announcement-title" label="Title" value={title} onChange={(e) => setTitle(e.target.value)} error={titleError} />
        <TextArea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
        <div className="actions">
          <Button variant="primary" type="submit" disabled={busy}>{editing ? "Save" : "Post"}</Button>
          <ButtonLink to={`${base}/announcements`}>Cancel</ButtonLink>
        </div>
      </form>
    </div>
  );
}
