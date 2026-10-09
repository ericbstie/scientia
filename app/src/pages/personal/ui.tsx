import { NavLink } from "react-router";

/** Sub-navigation shared by the two settings pages. */
export function SettingsNav() {
  return (
    <nav aria-label="Settings" className="tabs">
      <NavLink to="/settings/profile" className="tab">Profile</NavLink>
      <NavLink to="/settings/notifications" className="tab">Notifications</NavLink>
    </nav>
  );
}
