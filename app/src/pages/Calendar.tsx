import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import { fmtDate } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { Button, Empty, ErrorNote, Loading, PageHeader } from "../ui";
import { myCourses, publishedAssignments } from "./personal/data";

type Item = { id: string; label: string; href: string; day: string };

const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const css = `
.cal-grid td { vertical-align: top; white-space: normal; min-width: 110px; height: 96px; width: 14.28%; border-right: 1px solid var(--border); }
.cal-grid td:last-child { border-right: 0; }
.cal-grid td.cal-today { outline: 2px solid var(--accent); outline-offset: -2px; }
.cal-day { display: flex; gap: var(--s1); align-items: baseline; font-weight: 600; color: var(--text-2); margin-bottom: var(--s1); }
.cal-today-label { font-size: 0.78rem; color: var(--accent); font-weight: 600; }
.cal-items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--s1); }
.cal-items a { font-size: 0.85rem; overflow-wrap: anywhere; }
.cal-list { display: none; }
@media (max-width: 820px) {
  .cal-wrap { display: none; }
  .cal-list { display: block; }
}
`;

export function Calendar() {
  const { profile } = useAuth();
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
      <style>{css}</style>
      <PageHeader title="Calendar" />
      <ErrorNote error={error} />
      <div className="section-title">
        <h2>{monthName}</h2>
        <div className="actions">
          <Button onClick={() => go(-1)}>Previous month</Button>
          <Button onClick={() => setShown(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button>
          <Button onClick={() => go(1)}>Next month</Button>
        </div>
      </div>
      {loading && !data ? <Loading /> : (
        <>
          <div className="table-wrap cal-wrap">
            <table className="cal-grid">
              <caption className="visually-hidden">{monthName}</caption>
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
                          <div className="cal-day"><span>{d.getDate()}</span>{today && <span className="cal-today-label">Today</span>}</div>
                          {items.length > 0 && (
                            <ul className="cal-items">
                              {items.map((it) => <li key={it.id}><Link to={it.href}>{it.label}</Link></li>)}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cal-list">
            {data && count === 0 ? null : (
              <ul className="list">
                {listDays.map((d) => (
                  <li key={key(d)} className="row" style={{ alignItems: "flex-start" }}>
                    <div className="row-main">
                      <div className="row-meta"><time dateTime={key(d)}>{fmtDate(d)}</time>{key(d) === todayKey && " · Today"}</div>
                      <ul className="cal-items">
                        {byDay.get(key(d))!.map((it) => <li key={it.id}><Link className="row-title" to={it.href}>{it.label}</Link></li>)}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {data && count === 0 && <Empty title="Nothing due">Nothing is due this month.</Empty>}
        </>
      )}
    </div>
  );
}
