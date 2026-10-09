import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useCourse, useDocTitle, useUnread } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDate } from "../../lib/format";
import { db, isUuid, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, ErrorNote, Loading, NotFound, PageHeader } from "../../ui";
import { Prose } from "../../ui/Prose";
import type { AnnouncementRow } from "./Announcements";

export function AnnouncementView() {
  const { course } = useCourse();
  const { profile } = useAuth();
  const { refreshUnread } = useUnread();
  const { announcementId } = useParams();
  const q = useQuery(async () => {
    if (!isUuid(announcementId)) return null;
    return must(
      await db().from("announcements").select("id, title, body, pinned, created_at, edited_at, author:profiles!author_id(full_name)").eq("id", announcementId!).eq("course_id", course.id).maybeSingle(),
    ) as unknown as AnnouncementRow | null;
  }, [announcementId, course.id]);
  useDocTitle(q.data?.title);

  const id = q.data?.id;
  useEffect(() => {
    if (!id) return;
    // Opening an announcement also reads its notification, if there is one.
    (async () => {
      await db().from("announcement_reads").upsert({ announcement_id: id, user_id: profile!.id }, { onConflict: "announcement_id,user_id", ignoreDuplicates: true });
      await db().from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).like("link", `%/announcements#${id}`);
      refreshUnread();
    })();
  }, [id, profile, refreshUnread]);

  if (q.error) return <div className="content"><ErrorNote error={q.error} /></div>;
  if (q.loading && q.data === undefined) return <div className="content"><Loading /></div>;
  if (!q.data) return <NotFound />;
    return (
    <div className="content">
      <PageHeader eyebrow={<Link to={`/courses/${course.id}/announcements`}>‹ Announcements</Link>} title={q.data.title} />
      <p className="muted">
        {q.data.author?.full_name} · <time dateTime={q.data.created_at}>{fmtDate(q.data.created_at)}</time>
        {q.data.pinned && <> <Badge>Pinned</Badge></>}
        {q.data.edited_at && <> <Badge>Edited</Badge></>}
      </p>
      <Prose text={q.data.body} />
    </div>
  );
}
