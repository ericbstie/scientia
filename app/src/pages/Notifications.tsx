import { useState } from "react";
import { useNavigate } from "react-router";
import { useUnread } from "../App";
import { useAuth } from "../lib/auth";
import { fmtDateTime } from "../lib/format";
import { db, must } from "../lib/supabase";
import { useQuery } from "../lib/useQuery";
import { Badge, Button, Empty, ErrorNote, focusHeading, List, Loading, PageHeader, Row, TextLink, useTitle, useToast } from "../ui";

type Note = { id: string; title: string; link: string; read_at: string | null; created_at: string };

export function Notifications() {
  const { profile } = useAuth();
  const { refreshUnread } = useUnread();
  const navigate = useNavigate();
  const toast = useToast();
  useTitle("Notifications");
  const [failure, setFailure] = useState<string | null>(null);
  const { data, error, loading, reload } = useQuery(
    async () => must(await db().from("notifications").select("id, title, link, read_at, created_at").eq("user_id", profile!.id).order("created_at", { ascending: false })) as Note[],
    [profile!.id],
  );
  const unread = data?.filter((n) => !n.read_at).length ?? 0;

  async function open(e: React.MouseEvent, n: Note) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (!n.read_at) {
      await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id);
      await refreshUnread();
    }
    navigate(n.link);
  }

  async function markAll() {
    setFailure(null);
    try {
      must(await db().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", profile!.id).is("read_at", null));
      await reload();
      await refreshUnread();
      toast("All notifications marked as read");
      focusHeading();
    } catch {
      setFailure("Could not mark notifications as read. Check your connection and try again.");
    }
  }

  return (
    <div className="content">
      <PageHeader title="Notifications" actions={unread > 0 ? <Button onClick={markAll}>Mark all as read</Button> : undefined} />
      <ErrorNote error={error ?? failure} />
      <div>
        {loading && !data ? <Loading /> : data && data.length === 0 ? (
          <Empty title="No notifications">New announcements, grades and replies appear here.</Empty>
        ) : (
          data && (
            <List>
              {data.map((n) => (
                <Row key={n.id} tint={!n.read_at}>
                  <div className="row-main">
                    <TextLink className="row-title" to={n.link} onClick={(e) => open(e, n)}>{n.title}</TextLink>
                    <div className="row-meta"><time dateTime={n.created_at}>{fmtDateTime(n.created_at)}</time></div>
                  </div>
                  {!n.read_at && <div className="row-side"><Badge tone="accent">Unread</Badge></div>}
                </Row>
              ))}
            </List>
          )
        )}
      </div>
    </div>
  );
}
