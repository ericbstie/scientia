import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useCourse, useUnread } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDate } from "../../lib/format";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, ErrorNote, Loading, NotFound, PageHeader } from "../../ui";
import { splitBody } from "./content/meta";
import { Prose } from "./content/Prose";
import { markAnnouncementRead, useDocTitle } from "./content/util";
import type { AnnouncementRow } from "./Announcements";

export function AnnouncementView() {
  const { course } = useCourse();
  const { profile } = useAuth();
  const { refreshUnread } = useUnread();
  const { announcementId } = useParams();
  const q = useQuery(async () => {
    if (!/^[0-9a-f-]{36}$/i.test(announcementId ?? "")) return null;
    return must(
      await db().from("announcements").select("id, title, body, pinned, created_at, author:profiles!author_id(full_name)").eq("id", announcementId!).eq("course_id", course.id).maybeSingle(),
    ) as unknown as AnnouncementRow | null;
  }, [announcementId, course.id]);
  useDocTitle(q.data?.title);

  const id = q.data?.id;
  useEffect(() => {
    if (!id) return;
    markAnnouncementRead(profile!.id, id);
    // Opening an announcement also reads its notification, if there is one.
    (async () => {
      await db().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).like("link", `%/announcements#${id}`);
      refreshUnread();
    })();
  }, [id, profile, refreshUnread]);

  if (q.error) return <div className="content"><ErrorNote error={q.error} /></div>;
  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;
  const { text, meta } = splitBody(q.data.body);
  return (
    <div className="content">
      <PageHeader eyebrow={<Link to={`/courses/${course.id}/announcements`}>‹ Announcements</Link>} title={q.data.title} />
      <p className="muted">
        {q.data.author?.full_name} · <time dateTime={q.data.created_at}>{fmtDate(q.data.created_at)}</time>
        {q.data.pinned && <> <Badge tone="accent">Pinned</Badge></>}
        {meta.edited && <> <Badge>Edited</Badge></>}
      </p>
      <Prose text={text} />
    </div>
  );
}
