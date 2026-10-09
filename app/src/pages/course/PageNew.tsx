import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { db, isUuid, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Button, ButtonLink, ErrorNote, Field, focusField, Loading, NotFound, PageHeader, TextArea, useToast } from "../../ui";

export function PageNew() {
  const { course } = useCourse();
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const base = `/courses/${course.id}`;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState<string>();
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocTitle("Add page");

  const q = useQuery(async () => {
    if (!isUuid(moduleId)) return null;
    return must(await db().from("modules").select("id, title, materials(position)").eq("id", moduleId).eq("course_id", course.id).maybeSingle()) as
      { id: string; title: string; materials: { position: number }[] } | null;
  }, [moduleId, course.id]);

  function edit(fn: (value: string, start: number, end: number) => { value: string; start: number; end: number }) {
    const el = document.getElementById("page-body") as HTMLTextAreaElement | null;
    if (!el) return;
    const out = fn(el.value, el.selectionStart, el.selectionEnd);
    setBody(out.value);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(out.start, out.end); });
  }
  const bold = () => edit((v, s, e) => ({ value: v.slice(0, s) + "**" + v.slice(s, e) + "**" + v.slice(e), start: s + 2, end: e + 2 }));
  const bullets = () => edit((v, s, e) => {
    const from = v.lastIndexOf("\n", s - 1) + 1;
    const to = e;
    const block = v.slice(from, to).split("\n").map((l) => (l.startsWith("- ") ? l : `- ${l}`)).join("\n");
    return { value: v.slice(0, from) + block + v.slice(to), start: from, end: from + block.length };
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!title.trim()) { setTitleError("Enter a title"); focusField("page-title"); return; }
    setTitleError(undefined);
    setBusy(true);
    try {
      const position = Math.max(-1, ...(q.data?.materials ?? []).map((m) => m.position)) + 1;
      must(await db().from("materials").insert({ course_id: course.id, module_id: moduleId, kind: "page", title: title.trim(), body, position, published: true }).select("id"));
      toast("Page saved");
      navigate(`${base}/modules`);
    } catch (err) { setFail("Could not save. Check your connection and try again."); console.error(err); }
    setBusy(false);
  }

  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;
  return (
    <div className="content">
      <PageHeader eyebrow={<Link to={`${base}/modules`}>‹ Modules</Link>} title="Add page" />
      <form className="form" onSubmit={submit} noValidate>
        <ErrorNote error={fail} />
        <Field id="page-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={titleError} />
        <div className="field">
          <span className="label" id="body-tools">Formatting</span>
          <div className="actions" role="group" aria-labelledby="body-tools">
            <Button size="small" onClick={bold}>Bold</Button>
            <Button size="small" onClick={bullets}>Bulleted list</Button>
          </div>
        </div>
        <TextArea id="page-body" label="Body" optional value={body} onChange={(e) => setBody(e.target.value)} hint="Bold text goes between ** **. Start a line with - for a bulleted list." rows={10} />
        <div className="actions">
          <Button variant="primary" type="submit" disabled={busy}>Save page</Button>
          <ButtonLink to={`${base}/modules`}>Cancel</ButtonLink>
        </div>
      </form>
    </div>
  );
}
