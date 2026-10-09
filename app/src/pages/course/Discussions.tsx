import { useCourse, useDocTitle } from "../../App";
import { fmtDateTime } from "../../lib/format";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { ButtonLink, Empty, ErrorNote, List, Loading, PageHeader, Row, TextLink } from "../../ui";

type ThreadRow = { id: string; title: string; created_at: string; author: { full_name: string } | null; replies: { created_at: string }[] };

export function Discussions() {
  const { course } = useCourse();
  const base = `/courses/${course.id}`;
  useDocTitle("Discussions");
  const q = useQuery(async () =>
    must(
      await db()
        .from("threads")
        .select("id, title, created_at, author:profiles!author_id(full_name), replies(created_at)")
        .eq("course_id", course.id)
        .order("created_at", { ascending: false }),
    ) as unknown as ThreadRow[],
  [course.id]);

  const list = q.data ?? [];
  return (
    <div className="content">
      <PageHeader title="Discussions" actions={<ButtonLink variant="primary" to={`${base}/discussions/new`}>New thread</ButtonLink>} />
      <ErrorNote error={q.error} />
      {q.loading && !q.data ? <Loading /> : list.length === 0 ? (
        <Empty title="No threads yet">Start the first one.</Empty>
      ) : (
        <List>
          {list.map((t) => {
            const count = t.replies.length;
            const last = [t.created_at, ...t.replies.map((r) => r.created_at)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime()).at(-1)!;
            return (
              <Row key={t.id}>
                <div className="row-main">
                  <TextLink className="row-title" to={`${base}/discussions/${t.id}`}>{t.title}</TextLink>
                  <div className="row-meta">by {t.author?.full_name} · {count} {count === 1 ? "reply" : "replies"}</div>
                </div>
                <div className="row-side">Last activity <time dateTime={last}>{fmtDateTime(last)}</time></div>
              </Row>
            );
          })}
        </List>
      )}
    </div>
  );
}
