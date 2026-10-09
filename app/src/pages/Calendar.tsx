import { useMemo, useState } from "react";
import { Table } from "@digdir/designsystemet-react";
import { useAuth } from "../lib/auth";
import { fmtDate } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { Button, Empty, ErrorNote, List, Loading, PageHeader, Row, Section, Status, TextLink, useTitle } from "../ui";
import { myCourses, publishedAssignments } from "./personal/data";

type Item = { id: string; label: string; href: string; day: string };

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Calendar() {
  const { profile } = useAuth();
  useTitle("Calendar");
  const uid = profile!.id;
  const [shown, setShown] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  const { data, error, loading } = useQuery(async () => {
    const courses = await myCourses(uid);
    const code = new Map(courses.map((c) => [c.id, c.code]));
    const assignments = await publishedAssignments(courses.map((c) => c.id));
    return assignments.map((a): Item => ({
      id: a.id,
      label: `${code.get(a.course_id) ?? ""} ${a.title}`,
      href: `/courses/${a.course_id}/assignments/${a.id}`,
      day: key(new Date(a.due_at)),
    }));
  }, [uid]);

  const todayKey = key(new Date());
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const monthName = shown.toLocaleString("en-GB", { month: "long", year: "numeric" });

  const { weeks, byDay, count } = useMemo(() => {
    const byDay = new Map<string, Item[]>();
    for (const i of data ?? []) byDay.set(i.day, [...(byDay.get(i.day) ?? []), i]);
    const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))];
    while (cells.length % 7) cells.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    const count = cells.reduce((n, d) => n + (d ? (byDay.get(key(d))?.length ?? 0) : 0), 0);
    return { weeks, byDay, count };
  }, [data, year, month]);

  const go = (delta: number) => setShown(new Date(year, month + delta, 1));
  const listDays = weeks.flat().filter((d): d is Date => !!d && !!byDay.get(key(d))?.length);

  return (
    <div className="content wide">
      <PageHeader title="Calendar" />
      <ErrorNote error={error} />
      <Status>Showing {monthName}</Status>
      <Section
        title={monthName}
        action={
          <div className="actions">
            <Button onClick={() => go(-1)}>Previous<span className="ds-sr-only"> month</span></Button>
            <Button onClick={() => setShown(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button>
            <Button onClick={() => go(1)}>Next<span className="ds-sr-only"> month</span></Button>
          </div>
        }
      >
        {loading && !data ? <Loading /> : (
          <>
            <div className="table-wrap cal-wrap">
              <Table className="cal-grid" data-color="neutral" data-size="sm">
                <caption className="ds-sr-only">{monthName}</caption>
                <thead>
                  <tr>{WEEKDAYS.map((d) => <th key={d} scope="col">{d}</th>)}</tr>
                </thead>
                <tbody>
                  {weeks.map((w, i) => (
                    <tr key={i}>
                      {w.map((d, j) => {
                        if (!d) return <td key={j} aria-hidden="true" />;
                        const k = key(d);
                        const items = byDay.get(k) ?? [];
                        const today = k === todayKey;
                        return (
                          <td key={j} data-date={k} aria-current={today ? "date" : undefined} className={today ? "cal-today" : undefined}>
                            <div className="cal-day"><span>{d.getDate()}</span>{today && <span>Today</span>}</div>
                            {items.length > 0 && (
                              <ul className="cal-items">
                                {items.map((it) => <li key={it.id}><TextLink to={it.href}>{it.label}</TextLink></li>)}
                              </ul>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            {data && count > 0 && (
              <div className="cal-list">
                <List>
                  {listDays.map((d) => (
                    <Row key={key(d)} className="top" tint={key(d) === todayKey}>
                      <div className="row-main">
                        <div className="row-meta"><time dateTime={key(d)}>{fmtDate(d)}</time>{key(d) === todayKey && " · Today"}</div>
                        <ul className="cal-items">
                          {byDay.get(key(d))!.map((it) => <li key={it.id}><TextLink className="row-title" to={it.href}>{it.label}</TextLink></li>)}
                        </ul>
                      </div>
                    </Row>
                  ))}
                </List>
              </div>
            )}
            {data && count === 0 && <Empty title="Nothing due this month" />}
          </>
        )}
      </Section>
    </div>
  );
}
