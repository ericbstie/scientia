// Router and app shell. Owned by the orchestrator: feature pages live in pages/.
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth";
import { clearDrafts } from "./lib/draft";
import { db, isUuid } from "./lib/supabase";
import { Button, Dropdown, SkipLink, Tag } from "@digdir/designsystemet-react";
import { BellIcon, ChevronDownIcon } from "@navikt/aksel-icons";
import { BrandMark, Loading, NoAccess, NotFound, ToastProvider, useTitle } from "./ui";
import { SignIn } from "./pages/SignIn";

const page = <T extends Record<string, React.ComponentType>>(load: () => Promise<T>, name: keyof T) =>
  lazy(async () => ({ default: (await load())[name] as React.ComponentType }));

const Dashboard = page(() => import("./pages/Dashboard"), "Dashboard");
const Calendar = page(() => import("./pages/Calendar"), "Calendar");
const Notifications = page(() => import("./pages/Notifications"), "Notifications");
const Profile = page(() => import("./pages/settings/Profile"), "Profile");
const NotificationSettings = page(() => import("./pages/settings/NotificationSettings"), "NotificationSettings");
const CourseHome = page(() => import("./pages/course/Home"), "CourseHome");
const Modules = page(() => import("./pages/course/Modules"), "Modules");
const PageNew = page(() => import("./pages/course/PageNew"), "PageNew");
const PageView = page(() => import("./pages/course/PageView"), "PageView");
const Announcements = page(() => import("./pages/course/Announcements"), "Announcements");
const AnnouncementForm = page(() => import("./pages/course/AnnouncementForm"), "AnnouncementForm");
const AnnouncementView = page(() => import("./pages/course/AnnouncementView"), "AnnouncementView");
const Discussions = page(() => import("./pages/course/Discussions"), "Discussions");
const ThreadNew = page(() => import("./pages/course/ThreadNew"), "ThreadNew");
const ThreadView = page(() => import("./pages/course/ThreadView"), "ThreadView");
const People = page(() => import("./pages/course/People"), "People");
const Assignments = page(() => import("./pages/course/Assignments"), "Assignments");
const AssignmentForm = page(() => import("./pages/course/AssignmentForm"), "AssignmentForm");
const AssignmentView = page(() => import("./pages/course/AssignmentView"), "AssignmentView");
const Grades = page(() => import("./pages/course/Grades"), "Grades");
const Grading = page(() => import("./pages/course/Grading"), "Grading");
const GradingSubmission = page(() => import("./pages/course/GradingSubmission"), "GradingSubmission");
const Gradebook = page(() => import("./pages/course/Gradebook"), "Gradebook");
const AdminUsers = page(() => import("./pages/admin/Users"), "AdminUsers");
const AdminCourses = page(() => import("./pages/admin/Courses"), "AdminCourses");

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/sign-in" element={<SignedOutOnly><SignIn /></SignedOutOnly>} />
            <Route element={<RequireAuth><Shell /></RequireAuth>}>
              <Route index element={<HomeRoute />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="settings" element={<Navigate to="/settings/profile" replace />} />
              <Route path="settings/profile" element={<Profile />} />
              <Route path="settings/notifications" element={<NotificationSettings />} />
              <Route path="courses/:courseId" element={<CourseLayout />}>
                <Route index element={<CourseHome />} />
                <Route path="modules" element={<Modules />} />
                <Route path="modules/:moduleId/pages/new" element={<TeacherOnly><PageNew /></TeacherOnly>} />
                <Route path="pages/:pageId" element={<PageView />} />
                <Route path="announcements" element={<Announcements />} />
                <Route path="announcements/new" element={<TeacherOnly><AnnouncementForm /></TeacherOnly>} />
                <Route path="announcements/:announcementId" element={<AnnouncementView />} />
                <Route path="announcements/:announcementId/edit" element={<TeacherOnly><AnnouncementForm /></TeacherOnly>} />
                <Route path="discussions" element={<Discussions />} />
                <Route path="discussions/new" element={<ThreadNew />} />
                <Route path="discussions/:threadId" element={<ThreadView />} />
                <Route path="assignments" element={<Assignments />} />
                <Route path="assignments/new" element={<TeacherOnly><AssignmentForm /></TeacherOnly>} />
                <Route path="assignments/:assignmentId" element={<AssignmentView />} />
                <Route path="assignments/:assignmentId/edit" element={<TeacherOnly><AssignmentForm /></TeacherOnly>} />
                <Route path="grades" element={<StudentOnly><Grades /></StudentOnly>} />
                <Route path="grading" element={<TeacherOnly><Grading /></TeacherOnly>} />
                <Route path="grading/:submissionId" element={<TeacherOnly notFound><GradingSubmission /></TeacherOnly>} />
                <Route path="gradebook" element={<TeacherOnly><Gradebook /></TeacherOnly>} />
                <Route path="people" element={<People />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="admin" element={<Navigate to="/admin/users" replace />} />
              <Route path="admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
              <Route path="admin/courses" element={<AdminOnly><AdminCourses /></AdminOnly>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const { pathname, search } = useLocation();
  if (loading || (session && !profile)) return <main id="main" className="main"><Loading /></main>;
  if (!session) return <Navigate to={`/sign-in?next=${encodeURIComponent(pathname + search)}`} replace />;
  return <>{children}</>;
}

function SignedOutOnly({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (session && profile) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { profile } = useAuth();
  if (profile?.is_admin) return <Navigate to="/admin/users" replace />;
  return <Dashboard />;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  return profile?.is_admin ? <>{children}</> : <NoAccess />;
}

// ---------------------------------------------------------------------------
// Unread notifications count, shared by the top bar and the notifications page.

const UnreadContext = createContext<{ unread: number; refreshUnread: () => void }>({ unread: 0, refreshUnread: () => {} });
export const useUnread = () => useContext(UnreadContext);

function Shell() {
  const { profile } = useAuth();
  const admin = !!profile?.is_admin;
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();
  const refreshUnread = useCallback(async () => {
    const { count } = await db().from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    setUnread(count ?? 0);
  }, []);
  // Admins are never enrolled, so nothing notifies them.
  useEffect(() => { if (!admin) refreshUnread(); }, [refreshUnread, pathname, admin]);

  return (
    <UnreadContext.Provider value={{ unread, refreshUnread }}>
      <SkipLink href="#main">Skip to main content</SkipLink>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Scientia, go to dashboard"><BrandMark /><span className="brand-name">Scientia</span></Link>
          <nav aria-label="Main" className="topnav">
            {admin ? (
              <>
                <NavLink to="/admin/users" className="nav-link">Users</NavLink>
                <NavLink to="/admin/courses" className="nav-link">Courses</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" end className="nav-link">Dashboard</NavLink>
                <NavLink to="/calendar" className="nav-link">Calendar</NavLink>
                <NavLink to="/notifications" className="nav-link bell" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
                  <BellIcon aria-hidden /><span className="bell-label">Notifications</span>
                  {unread > 0 && <span className="count" aria-hidden="true" data-testid="unread-count">{unread}</span>}
                </NavLink>
              </>
            )}
          </nav>
          <AccountMenu name={profile?.full_name ?? ""} />
        </div>
      </header>
      <main id="main" className="main" tabIndex={-1}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </UnreadContext.Provider>
  );
}

function AccountMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { if (open) requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()); }, [open]);

  async function signOut() {
    clearDrafts();
    await db().auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <>
      {/* The trigger is part of our top bar; the menu is Designsystemet's dropdown, opened through popovertarget. */}
      <button type="button" className="nav-link account" popoverTarget="account-menu" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${name}`}><span>{name}</span><ChevronDownIcon aria-hidden /></button>
      <Dropdown id="account-menu" placement="bottom-end" open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}>
        <Dropdown.List role="menu" aria-label="Account" ref={list}>
          <Dropdown.Item role="none"><Dropdown.Button asChild role="menuitem"><Link to="/settings/profile">Settings</Link></Dropdown.Button></Dropdown.Item>
          <Dropdown.Item role="none"><Dropdown.Button role="menuitem" onClick={signOut}>Sign out</Dropdown.Button></Dropdown.Item>
        </Dropdown.List>
      </Dropdown>
    </>
  );
}

// ---------------------------------------------------------------------------
// Course layout: fixed course navigation, identical in every course for a role.

type Course = { id: string; code: string; title: string; description: string; term: string };
type CourseRole = "teacher" | "student";
const CourseContext = createContext<{ course: Course; role: CourseRole }>(null!);
/** Current course and the viewer's role in it (admins act as teachers). */
export const useCourse = () => useContext(CourseContext);
/** Document title inside a course: "<page> · <course code> · Scientia". */
export const useDocTitle = (page: string | undefined) => useTitle(page, useCourse().course.code);

function CourseLayout() {
  const { courseId } = useParams();
  const { profile } = useAuth();
  const [state, setState] = useState<{ course: Course; role: CourseRole } | "none" | "missing" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);
  // Escape closes the open course menu and returns focus to the Course pages button.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    let live = true;
    setState(null);
    (async () => {
      const uuid = isUuid(courseId);
      const [{ data: course }, { data: enrol }] = uuid
        ? await Promise.all([
            db().from("courses").select("id, code, title, description, term").eq("id", courseId!).maybeSingle(),
            db().from("enrollments").select("role").eq("course_id", courseId!).eq("user_id", profile!.id).maybeSingle(),
          ])
        : [{ data: null }, { data: null }];
      if (!live) return;
      if (!course) return setState(uuid ? "none" : "missing");
      const role: CourseRole | null = profile?.is_admin ? "teacher" : (enrol?.role as CourseRole | undefined) ?? null;
      setState(role ? { course: course as Course, role } : "none");
    })();
    return () => { live = false; };
  }, [courseId, profile]);

  if (state === null) return <Loading />;
  // RLS hides courses you're not in, so an unknown id and a non-member look the same: say "no access".
  if (state === "none") return <NoAccess what="this course" />;
  if (state === "missing") return <NotFound />;

  const base = `/courses/${state.course.id}`;
  const items: [string, string][] = [
    ["Home", base],
    ["Modules", `${base}/modules`],
    ["Assignments", `${base}/assignments`],
    ["Announcements", `${base}/announcements`],
    ["Discussions", `${base}/discussions`],
    ...(state.role === "teacher"
      ? ([["Grading", `${base}/grading`], ["Gradebook", `${base}/gradebook`]] as [string, string][])
      : ([["Grades", `${base}/grades`]] as [string, string][])),
    ["People", `${base}/people`],
  ];

  return (
    <CourseContext.Provider value={state}>
      <div className="course-layout">
        <nav className={`course-nav ${menuOpen ? "open" : ""}`} aria-label="Course">
          <div className="course-nav-head">
            <Link to={base} className="course-nav-title">
              <Tag data-color="accent" data-size="sm">{state.course.code}</Tag>
              <span>{state.course.title}</span>
            </Link>
            <Button type="button" ref={menuButton} variant="secondary" className="course-menu" aria-expanded={menuOpen} aria-controls="course-nav-items" onClick={() => setMenuOpen(!menuOpen)}>
              Course pages
            </Button>
          </div>
          <ul id="course-nav-items">
            {items.map(([label, to]) => (
              <li key={label}><NavLink to={to} end={label === "Home"} className="nav-link">{label}</NavLink></li>
            ))}
          </ul>
        </nav>
        <div className="course-main">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </CourseContext.Provider>
  );
}

function TeacherOnly({ children, notFound }: { children: ReactNode; notFound?: boolean }) {
  const { role } = useCourse();
  if (role === "teacher") return <>{children}</>;
  return notFound ? <NotFound /> : <NoAccess />;
}

function StudentOnly({ children }: { children: ReactNode }) {
  const { role } = useCourse();
  return role === "student" ? <>{children}</> : <NoAccess />;
}
