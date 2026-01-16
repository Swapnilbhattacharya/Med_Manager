import React from 'react';
import { auth } from "../services/firebase";
import "./TopNav.css";

export default function TopNav({ setView, currentView }) {
  return (
    <nav className="top-nav">
      <div className="brand" onClick={() => setView("dashboard")} style={{ cursor: 'pointer' }}>
        💊 <span>Med Manager</span>
      </div>

      <div className="nav-links">
        <button className={currentView === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
        <button className={currentView === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>📅 Calendar</button>
        <button className={currentView === "addMed" ? "active" : ""} onClick={() => setView("addMed")}>➕ Add Med</button>
        <button className="logout" onClick={() => auth.signOut()}>🚪 Logout</button>
      </div>
    </nav>
  );
}