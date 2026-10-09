// Router and app shell. Owned by the orchestrator: feature pages live in pages/.
import { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { AuthProvider, useAuth } from "./lib/auth";
import { db } from "./lib/supabase";
import { Loading, NoAccess, NotFound, ToastProvider } from "./ui";
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
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();
  const refreshUnread = useCallback(async () => {
    const { count } = await db().from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    setUnread(count ?? 0);
  }, []);
  useEffect(() => { refreshUnread(); }, [refreshUnread, pathname]);

  return (
    <UnreadContext.Provider value={{ unread, refreshUnread }}>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" aria-label="Scientia, go to dashboard"><span className="brand-mark" aria-hidden="true">S</span><span className="brand-name">Scientia</span></Link>
          <nav aria-label="Main" className="topnav">
            {!profile?.is_admin && <NavLink to="/" end className="nav-link">Dashboard</NavLink>}
            <NavLink to="/calendar" className="nav-link">Calendar</NavLink>
            {profile?.is_admin && <NavLink to="/admin/users" className={({ isActive }) => `nav-link ${isActive || pathname.startsWith("/admin") ? "active" : ""}`}>Admin</NavLink>}
          </nav>
          <div className="topnav-end">
            <NavLink to="/notifications" className="nav-link" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg><span className="bell-label">Notifications</span>
              {unread > 0 && <span className="count" aria-hidden="true" data-testid="unread-count">{unread}</span>}
            </NavLink>
            <AccountMenu name={profile?.full_name ?? ""} />
          </div>
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
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) {
        setOpen(false);
        if (e instanceof KeyboardEvent) ref.current?.querySelector<HTMLElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  async function signOut() {
    await db().auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <div className="menu" ref={ref}>
      <button className="nav-link" aria-haspopup="menu" aria-expanded={open} aria-label={`Account menu for ${name}`} onClick={() => setOpen(!open)}>
        <span className="nav-label">{name}</span><span className="mobile-only initials" aria-hidden="true">{name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase()}</span> <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="menu-list" role="menu" aria-label="Account">
          <Link role="menuitem" to="/settings/profile">Settings</Link>
          <button role="menuitem" onClick={signOut}>Sign out</button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Course layout: fixed course navigation, identical in every course for a role.

export type Course = { id: string; code: string; title: string; description: string; term: string; archived: boolean };
export type CourseRole = "teacher" | "student";
const CourseContext = createContext<{ course: Course; role: CourseRole }>(null!);
/** Current course and the viewer's role in it (admins act as teachers). */
export const useCourse = () => useContext(CourseContext);

function CourseLayout() {
  const { courseId } = useParams();
  const { profile } = useAuth();
  const [state, setState] = useState<{ course: Course; role: CourseRole } | "none" | "missing" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);
  // Escape closes the open course menu and returns focus to the Menu button.
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
      const uuid = /^[0-9a-f-]{36}$/i.test(courseId ?? "");
      const [{ data: course }, { data: enrol }] = uuid
        ? await Promise.all([
            db().from("courses").select("id, code, title, description, term, archived").eq("id", courseId!).maybeSingle(),
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
              <span className="nav-course-code">{state.course.code}</span>
              <span>{state.course.title}</span>
            </Link>
            <button type="button" ref={menuButton} className="btn small course-menu-button" aria-expanded={menuOpen} aria-controls="course-nav-items" onClick={() => setMenuOpen(!menuOpen)}>
              Menu
            </button>
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
