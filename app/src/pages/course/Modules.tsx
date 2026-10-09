import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useCourse } from "../../App";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, ButtonLink, Confirm, Dialog, Empty, ErrorNote, ErrorSummary, Field, Loading, PageHeader, Section, useToast } from "../../ui";
import { focusField, focusHeading, useDocTitle } from "./content/util";

type Item = { id: string; kind: "page" | "file" | "link"; title: string; url: string | null; file_name: string | null; file_path: string | null; position: number };
type Mod = { id: string; title: string; position: number; published: boolean; materials: Item[] };
type Dlg = { kind: "module" } | { kind: "file" | "link"; module: Mod } | null;

const KIND_LABEL = { page: "Page", file: "File", link: "Link" } as const;
const MAX_BYTES = 10 * 1024 * 1024;
const isWebAddress = (s: string) => /^https?:\/\/\S+$/i.test(s.trim());

export function Modules() {
  const { course, role } = useCourse();
  const teacher = role === "teacher";
  const toast = useToast();
  useDocTitle("Modules");
  const base = `/courses/${course.id}`;
  const [dialog, setDialog] = useState<Dlg>(null);
  const [removing, setRemoving] = useState<{ mod: Mod; item: Item } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);

  const q = useQuery(async () => {
    const mods = must(
      await db()
        .from("modules")
        .select("id, title, position, published, materials(id, kind, title, url, file_name, file_path, position)")
        .eq("course_id", course.id)
        .order("position")
        .order("position", { referencedTable: "materials" }),
    ) as Mod[];
    const paths = mods.flatMap((m) => m.materials.filter((i) => i.kind === "file" && i.file_path).map((i) => i.file_path!));
    const signed: Record<string, string> = {};
    if (paths.length) {
      const { data } = await db().storage.from("materials").createSignedUrls(paths, 3600);
      for (const s of data ?? []) if (s.path && s.signedUrl) signed[s.path] = s.signedUrl;
    }
    return { mods, signed };
  }, [course.id]);

  async function setPublished(mod: Mod, published: boolean) {
    setActionError(null);
    try {
      must(await db().from("modules").update({ published }).eq("id", mod.id).select("id"));
      toast(published ? "Module published" : "Module unpublished");
      q.reload();
    } catch (e) { setActionError(e as Error); }
  }

  async function removeItem() {
    if (!removing) return;
    setBusy(true);
    setActionError(null);
    try {
      const { item } = removing;
      must(await db().from("materials").delete().eq("id", item.id).select("id"));
      if (item.file_path) await db().storage.from("materials").remove([item.file_path]);
      setRemoving(null);
      toast("Item deleted");
      await q.reload();
      focusHeading();
    } catch (e) { setActionError(e as Error); setRemoving(null); }
    setBusy(false);
  }

  const mods = q.data?.mods ?? [];
  return (
    <div className="content">
      <PageHeader title="Modules" actions={teacher && <Button variant="primary" onClick={() => setDialog({ kind: "module" })}>Add module</Button>} />
      <ErrorNote error={q.error ?? actionError} />
      {q.loading && !q.data ? <Loading /> : mods.length === 0 ? (
        teacher ? (
          <Empty title="No modules yet" action={<Button onClick={() => setDialog({ kind: "module" })}>Add module</Button>}>Modules group the pages, files and links students read. New modules start as drafts.</Empty>
        ) : (
          <Empty title="No material yet">Your teacher has not published any modules.</Empty>
        )
      ) : (
        mods.map((m) => (
          <Section
            key={m.id}
            title={m.title}
            action={teacher && (
              <div className="actions">
                {!m.published && <Badge>Draft</Badge>}
                <Button size="small" aria-label={`${m.published ? "Unpublish" : "Publish"} module ${m.title}`} onClick={() => setPublished(m, !m.published)}>{m.published ? "Unpublish" : "Publish"}</Button>
                <ButtonLink size="small" aria-label={`Add page to ${m.title}`} to={`${base}/modules/${m.id}/pages/new`}>Add page</ButtonLink>
                <Button size="small" aria-label={`Add file to ${m.title}`} onClick={() => setDialog({ kind: "file", module: m })}>Add file</Button>
                <Button size="small" aria-label={`Add link to ${m.title}`} onClick={() => setDialog({ kind: "link", module: m })}>Add link</Button>
              </div>
            )}
          >
            {m.materials.length === 0 ? (
              <p className="muted">This module is empty.{teacher && " Add a page, file or link."}</p>
            ) : (
              <ul className="list">
                {m.materials.map((i) => (
                  <li key={i.id}>
                    <div className="row">
                      <div className="row-main">
                        {i.kind === "page" ? (
                          <Link className="row-title" to={`${base}/pages/${i.id}`}>{i.title}</Link>
                        ) : i.kind === "link" ? (
                          <a className="row-title" href={i.url && /^https?:\/\//i.test(i.url) ? i.url : undefined} target="_blank" rel="noopener noreferrer">{i.title}</a>
                        ) : q.data!.signed[i.file_path ?? ""] ? (
                          <a className="row-title" href={q.data!.signed[i.file_path!]} download={i.file_name ?? i.title}>{i.title}</a>
                        ) : (
                          <span className="row-title">{i.title}</span>
                        )}
                        <div className="row-meta">{KIND_LABEL[i.kind]}{i.kind === "link" && " · Opens in a new tab"}{i.kind === "file" && i.file_name && <> · {i.file_name}</>}</div>
                      </div>
                      {teacher && <div className="row-side"><Button variant="danger" size="small" className="ghost" aria-label={`Delete ${KIND_LABEL[i.kind].toLowerCase()} ${i.title}`} onClick={() => setRemoving({ mod: m, item: i })}>Delete</Button></div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        ))
      )}

      <Dialog open={dialog?.kind === "module"} onClose={() => setDialog(null)} title="Add module">
        <ModuleForm
          position={Math.max(-1, ...mods.map((m) => m.position)) + 1}
          onCancel={() => setDialog(null)}
          onDone={() => { setDialog(null); toast("Module added"); q.reload(); }}
        />
      </Dialog>
      <Dialog open={dialog?.kind === "file"} onClose={() => setDialog(null)} title="Add file">
        {dialog?.kind === "file" && (
          <FileForm
            module={dialog.module}
            onCancel={() => setDialog(null)}
            onDone={() => { setDialog(null); toast("File added"); q.reload(); }}
          />
        )}
      </Dialog>
      <Dialog open={dialog?.kind === "link"} onClose={() => setDialog(null)} title="Add link">
        {dialog?.kind === "link" && (
          <LinkForm
            module={dialog.module}
            onCancel={() => setDialog(null)}
            onDone={() => { setDialog(null); toast("Link added"); q.reload(); }}
          />
        )}
      </Dialog>
      <Confirm
        open={!!removing}
        title={`Delete "${removing?.item.title ?? ""}"?`}
        confirmLabel="Delete"
        onConfirm={removeItem}
        onCancel={() => setRemoving(null)}
        busy={busy}
      >
        Students will no longer see it. This cannot be undone.
      </Confirm>
    </div>
  );
}

function FormActions({ busy, submit, onCancel }: { busy: boolean; submit: string; onCancel: () => void }) {
  return (
    <div className="actions">
      <Button variant="primary" type="submit" disabled={busy}>{submit}</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </div>
  );
}

function ModuleForm({ position, onCancel, onDone }: { position: number; onCancel: () => void; onDone: () => void }) {
  const { course } = useCourse();
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [fail, setFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!name.trim()) { setError("Enter a module name"); focusField("module-name"); return; }
    setError(undefined);
    setBusy(true);
    try {
      must(await db().from("modules").insert({ course_id: course.id, title: name.trim(), position, published: false }).select("id"));
      onDone();
    } catch (err) { setFail(new Error("Could not save. Check your connection and try again.")); console.error(err); }
    setBusy(false);
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={fail} />
      <Field id="module-name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={error} hint="New modules are drafts until you publish them." />
      <FormActions busy={busy} submit="Add module" onCancel={onCancel} />
    </form>
  );
}

const nextPosition = (m: Mod) => Math.max(-1, ...m.materials.map((i) => i.position)) + 1;

function FileForm({ module: mod, onCancel, onDone }: { module: Mod; onCancel: () => void; onDone: () => void }) {
  const { course } = useCourse();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();
  const [fail, setFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    if (!file) { setError("Choose a file"); focusField("file-input"); return; }
    if (file.size > MAX_BYTES) {
      setError(`The file is ${Math.ceil(file.size / 1048576)} MB. The limit is 10 MB. Choose a smaller file.`);
      focusField("file-input");
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const safe = file.name.replace(/[^\w.\-() ]+/g, "_");
      const path = `${course.id}/${crypto.randomUUID()}/${safe}`;
      const up = await db().storage.from("materials").upload(path, file, { contentType: file.type || "application/octet-stream" });
      if (up.error) throw up.error;
      try {
        must(await db().from("materials").insert({ course_id: course.id, module_id: mod.id, kind: "file", title: file.name, file_name: file.name, file_path: path, position: nextPosition(mod), published: true }).select("id"));
      } catch (err) {
        await db().storage.from("materials").remove([path]);
        throw err;
      }
      onDone();
    } catch (err) { setFail(new Error("Could not upload the file. Check your connection and try again.")); console.error(err); }
    setBusy(false);
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={fail} />
      <Field id="file-input" type="file" label="File" required hint="Up to 10 MB." error={error} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(undefined); }} />
      <FormActions busy={busy} submit="Add file" onCancel={onCancel} />
    </form>
  );
}

function LinkForm({ module: mod, onCancel, onDone }: { module: Mod; onCancel: () => void; onDone: () => void }) {
  const { course } = useCourse();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});
  const [fail, setFail] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    const next: { title?: string; url?: string } = {};
    if (!title.trim()) next.title = "Enter a title";
    if (!isWebAddress(url)) next.url = "Enter a web address starting with http:// or https://";
    setErrors(next);
    if (next.title) { focusField("link-title"); return; }
    if (next.url) { focusField("link-url"); return; }
    setBusy(true);
    try {
      must(await db().from("materials").insert({ course_id: course.id, module_id: mod.id, kind: "link", title: title.trim(), url: url.trim(), position: nextPosition(mod), published: true }).select("id"));
      onDone();
    } catch (err) { setFail(new Error("Could not save. Check your connection and try again.")); console.error(err); }
    setBusy(false);
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={fail} />
      <ErrorSummary errors={[errors.title && { id: "link-title", message: errors.title }, errors.url && { id: "link-url", message: errors.url }]} />
      <Field id="link-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} />
      <Field id="link-url" label="URL" required value={url} onChange={(e) => setUrl(e.target.value)} error={errors.url} hint="Starts with http:// or https://" />
      <FormActions busy={busy} submit="Add link" onCancel={onCancel} />
    </form>
  );
}
