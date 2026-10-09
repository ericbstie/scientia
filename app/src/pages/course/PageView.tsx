import { Link, useParams } from "react-router";
import { useCourse } from "../../App";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { ErrorNote, Loading, NotFound, PageHeader } from "../../ui";
import { Prose } from "./content/Prose";
import { useDocTitle } from "./content/util";

export function PageView() {
  const { course } = useCourse();
  const { pageId } = useParams();
  const q = useQuery(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(pageId ?? "")) return null;
    // The inner join drops pages of modules the viewer cannot see (draft modules for students).
    return must(
      await db().from("materials").select("id, title, body, kind, modules!inner(id, title)").eq("id", pageId!).eq("course_id", course.id).eq("kind", "page").maybeSingle(),
    ) as { id: string; title: string; body: string } | null;
  }, [pageId, course.id]);
  useDocTitle(q.data?.title);

  if (q.error) return <div className="content"><ErrorNote error={q.error} /></div>;
  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;
  return (
    <div className="content">
      <PageHeader eyebrow={<Link to={`/courses/${course.id}/modules`}>‹ Modules</Link>} title={q.data.title} />
      <Prose text={q.data.body} />
    </div>
  );
}
