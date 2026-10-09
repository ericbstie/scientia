import { NavLink } from "react-router";

export function AdminNav() {
  return (
    <nav aria-label="Admin" style={{ display: "flex", gap: "var(--s4)", marginBottom: "var(--s5)" }}>
      <NavLink to="/admin/users" className="nav-link">Users</NavLink>
      <NavLink to="/admin/courses" className="nav-link">Courses</NavLink>
    </nav>
  );
}
