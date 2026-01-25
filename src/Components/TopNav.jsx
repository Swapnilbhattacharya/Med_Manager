import React, { useState, useRef, useEffect } from 'react';
import { auth } from "../services/firebase";
import "./TopNav.css";

export default function TopNav({ setView, currentView, user, userName, familyName, householdId }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyId = () => {
    if (householdId) {
      navigator.clipboard.writeText(householdId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // CHANGE: Redirect to the new Switch User page instead of logging out
  const handleSwitchUser = () => {
    setIsDropdownOpen(false); // Close menu
    setView("switchUser");    // Change view
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <nav className="top-nav">
      <div className="brand" onClick={() => setView("dashboard")}>
        💊 <span>Med Manager</span>
      </div>

      <div className="nav-links">
        <button className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
        <button className={`nav-btn ${currentView === "inventory" ? "active" : ""}`} onClick={() => setView("inventory")}>📦 Stock</button>
        <button className={`nav-btn ${currentView === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>📅 Calendar</button>
        <button className={`nav-btn ${currentView === "addMed" ? "active" : ""}`} onClick={() => setView("addMed")}>➕ Add Med</button>

        <div className="profile-container" ref={dropdownRef}>
          <div className="profile-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            {initial}
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu">
              <div className="user-info">
                <h4 className="user-name">{userName || "User"}</h4>
                <span className="household-label">{familyName || "My Family"}</span>
                
                {householdId && (
                  <div className="id-box">
                    <span className="id-text">{householdId.substring(0, 8)}...</span>
                    <span className="copy-icon" onClick={handleCopyId}>{copySuccess ? "✅" : "📋"}</span>
                  </div>
                )}
              </div>

              <div className="menu-actions">
                {/* Updated Button Action */}
                <button className="menu-item" onClick={handleSwitchUser}>
                  🔄 Switch User
                </button>
                <button className="menu-item logout" onClick={() => auth.signOut()}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}