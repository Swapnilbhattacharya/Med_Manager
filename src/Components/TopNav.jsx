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
        {/* Dashboard Button */}
        <button 
          className={currentView === "dashboard" ? "active" : ""} 
          onClick={() => setView("dashboard")}
        >
          🏠 Dashboard
        </button>

        {/* NEW: Stock Manager Button (Placed here as requested) */}
        <button 
          className={currentView === "inventory" ? "active" : ""} 
          onClick={() => setView("inventory")}
        >
          📦 Stock Manager
        </button>

        {/* Calendar Button */}
        <button 
          className={currentView === "calendar" ? "active" : ""} 
          onClick={() => setView("calendar")}
        >
          📅 Calendar
        </button>

        {/* Add Med Button */}
        <button 
          className={currentView === "addMed" ? "active" : ""} 
          onClick={() => setView("addMed")}
        >
          ➕ Add Med
        </button>

        {/* Logout Button */}
        <button className="logout" onClick={() => auth.signOut()}>
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}