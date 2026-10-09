import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ListItem, ListUnordered, Paragraph } from "@digdir/designsystemet-react";
import { useCourse, useDocTitle } from "../../App";
import { fmtDateTime, lateBy } from "../../lib/format";
import { db } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, Confirm, Dialog, Empty, ErrorNote, List, Loading, PageHeader, Row, Status, StatusBadge, TextLink, useToast } from "../../ui";
import { buildQueue, loadTeacherData, type QueueRow } from "./work/shared";

import type { Filter } from "./work/shared";
const FILTERS: { id: Filter; label: string; empty: string }[] = [
  { id: "needs-grading", label: "Needs grading", empty: "Nothing needs grading" },
  { id: "graded", label: "Graded, not released", empty: "No unreleased grades" },
  { id: "released", label: "Released", empty: "No grades released yet" },
  { id: "missing", label: "Missing", empty: "No missing work" },
];

export function Grading() {
  const { course } = useCourse();
  const base = `/courses/${course.id}`;
  useDocTitle("Grading");
  const toast = useToast();
  const [params] = useSearchParams();
  const active = FILTERS.find((f) => f.id === params.get("status")) ?? FILTERS[0]!;
  const { data, error, loading, reload } = useQuery(() => loadTeacherData(course.id), [course.id]);
  const [withdraw, setWithdraw] = useState<QueueRow | null>(null);
  const [releaseAll, setReleaseAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = useMemo(() => (data ? buildQueue(data) : []), [data]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, rows.filter((r) => r.filter === f.id).length])) as Record<Filter, number>, [rows]);
  const shown = rows.filter((r) => r.filter === active.id);
  const drafted = rows.filter((r) => r.filter === "graded");

  async function setReleased(targets: QueueRow[], released: boolean) {
    setBusy(true);
    setActionError(null);
    let failed = false;
    for (const t of targets) {
      const { error } = await db().from("grades").update({ released }).eq("assignment_id", t.assignmentId).eq("student_id", t.studentId);
      if (error) { failed = true; break; }
    }
    setBusy(false);
    setWithdraw(null);
    setReleaseAll(false);
    if (failed) setActionError("Could not save. Check your connection and try again.");
    else toast(released ? (targets.length > 1 ? `${targets.length} grades released` : "Grade released") : "Grade withdrawn");
    reload();
  }

  return (
    <div className="content wide">
      <PageHeader
        title="Grading"
        actions={drafted.length > 0 ? <Button variant="primary" onClick={() => setReleaseAll(true)}>Release all graded to students ({drafted.length})</Button> : undefined}
      />
      <ErrorNote error={error} />
      <ErrorNote error={actionError} />
      <nav aria-label="Filter" className="tabs">
        {FILTERS.map((f) => (
          <Link key={f.id} className="tab" to={`${base}/grading?status=${f.id}`} aria-current={f.id === active.id ? "page" : undefined}>
            {f.label} ({counts[f.id]})
          </Link>
        ))}
      </nav>
      <Status>{data ? `Showing ${shown.length} ${shown.length === 1 ? "submission" : "submissions"}` : ""}</Status>
      {loading && !data ? <Loading /> : data && (
        shown.length === 0 ? (
          <Empty title={active.empty} />
        ) : (
          <List>
            {shown.map((r) => {
              const late = r.submittedAt && lateBy(r.due, r.submittedAt);
              return (
                <Row key={r.id}>
                  <div className="row-main">
                    {r.submissionId
                      ? <TextLink className="row-title" to={`${base}/grading/${r.submissionId}`}>{r.student}<span className="ds-sr-only">, {r.assignment}</span></TextLink>
                      : <span className="row-title">{r.student}</span>}
                    <div className="row-meta">
                      {r.assignment} ·{" "}
                      {r.submittedAt
                        ? <>Submitted <time dateTime={r.submittedAt}>{fmtDateTime(r.submittedAt)}</time></>
                        : <>Due <time dateTime={r.due}>{fmtDateTime(r.due)}</time></>}
                    </div>
                  </div>
                  <div className="actions">
                    {late && <Badge tone="warning">Late by {late}</Badge>}
                    {r.filter === "needs-grading" && <StatusBadge status="Needs grading" />}
                    {r.filter === "graded" && <StatusBadge status="Graded (not released)" />}
                    {r.filter === "released" && <StatusBadge status="Released" />}
                    {r.filter === "missing" && <Badge tone="danger">Missing</Badge>}
                    {r.filter === "graded" && <Button variant="tertiary" disabled={busy} aria-label={`Release grade for ${r.student} on ${r.assignment}`} onClick={() => setReleased([r], true)}>Release</Button>}
                    {r.filter === "released" && <Button variant="tertiary" aria-label={`Withdraw grade for ${r.student} on ${r.assignment}`} onClick={() => setWithdraw(r)}>Withdraw</Button>}
                  </div>
                </Row>
              );
            })}
          </List>
        )
      )}

      <Confirm
        open={withdraw !== null}
        title={withdraw ? `Withdraw the grade for ${withdraw.student} on ${withdraw.assignment}?` : ""}
        confirmLabel="Withdraw"
        busy={busy}
        onCancel={() => setWithdraw(null)}
        onConfirm={() => withdraw && setReleased([withdraw], false)}
      >
        The student will no longer see the score or feedback. You can release it again later.
      </Confirm>

      <Dialog open={releaseAll} onClose={() => setReleaseAll(false)} title={`Release ${drafted.length} ${drafted.length === 1 ? "grade" : "grades"}?`}>
        <Paragraph>These students will see their scores and feedback:</Paragraph>
        <ListUnordered>{drafted.map((r) => <ListItem key={r.id}>{r.student}, {r.assignment}</ListItem>)}</ListUnordered>
        <div className="actions">
          <Button onClick={() => setReleaseAll(false)}>Cancel</Button>
          <Button variant="primary" disabled={busy} onClick={() => setReleased(drafted, true)}>Release</Button>
        </div>
      </Dialog>
    </div>
  );
}
