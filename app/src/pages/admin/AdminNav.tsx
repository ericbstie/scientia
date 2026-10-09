import { NavLink } from "react-router";

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="tabs">
      <NavLink to="/admin/users" className="tab">Users</NavLink>
      <NavLink to="/admin/courses" className="tab">Courses</NavLink>
    </nav>
  );
}
