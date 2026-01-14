import React from 'react';
import { logoutUser } from "../services/authService";
import "./TopNav.css";

export default function TopNav() {
  return (
    <nav className="top-nav">
      <div className="brand">
        💊 <span>Medication Manager</span>
      </div>

      <div className="nav-links">
        <button className="active">🏠 Dashboard</button>
        <button>📷 Scan</button>
        <button>📅 Calendar</button>
        {/* Uses the logout service which triggers the state change in app.jsx */}
        <button className="logout" onClick={logoutUser}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}