import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { db, must } from "../../lib/supabase";
import { Button, ButtonLink, ErrorNote, Field, focusField, PageHeader, Panel, TextArea, useToast } from "../../ui";

export function ThreadNew() {
  const { course } = useCourse();
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/courses/${course.id}`;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocTitle("New thread");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!title.trim()) { setTitleError("Enter a title"); focusField("thread-title"); return; }
    setTitleError(undefined);
    setBusy(true);
    try {
      must(await db().from("threads").insert({ course_id: course.id, title: title.trim(), body: message }).select("id"));
      toast("Thread posted");
      navigate(`${base}/discussions`);
    } catch (err) { setFail("Could not post. Check your connection and try again."); console.error(err); }
    setBusy(false);
  }

  return (
    <div className="content">
      <PageHeader back={{ to: `${base}/discussions`, label: "Discussions" }} title="New thread" />
      <Panel><form className="form" onSubmit={submit} noValidate>
        <ErrorNote error={fail} />
        <Field id="thread-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={titleError} />
        <TextArea label="Message" optional value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
        <div className="actions">
          <Button variant="primary" type="submit" disabled={busy}>Post</Button>
          <ButtonLink to={`${base}/discussions`}>Cancel</ButtonLink>
        </div>
      </form></Panel>
    </div>
  );
}
