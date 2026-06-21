import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { initials } from "../utils";
import "./Layout.css";

const managerNav = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/meals", icon: "🍱", label: "Meal Records" },
  { to: "/deposits", icon: "💰", label: "Deposits" },
  { to: "/expenses", icon: "🧾", label: "Expenses" },
  { to: "/summary", icon: "📋", label: "Summary" },
  { to: "/members", icon: "👥", label: "Members" },
  { to: "/profile", icon: "👤", label: "My Profile" },
];

const memberNav = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/meals", icon: "🍱", label: "My Meals" },
  { to: "/deposits", icon: "💰", label: "My Deposits" },
  { to: "/expenses", icon: "🧾", label: "Expenses" },
  { to: "/summary", icon: "📋", label: "Summary" },
  { to: "/profile", icon: "👤", label: "My Profile" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = user?.role === "manager" ? managerNav : memberNav;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <nav className={`sidebar${open ? " open" : ""}`}>
        <div className="sidebar-header">
          <span className="brand">🍽️ MessManager</span>
          <span className="role-badge">{user?.role === "manager" ? "👔 Manager" : "👤 Member"}</span>
        </div>
        <div className="sidebar-nav">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{initials(user?.name)}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </nav>

      <div className="main">
        <div className="topbar">
          <button className="menu-toggle" onClick={() => setOpen(o => !o)}>☰</button>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
