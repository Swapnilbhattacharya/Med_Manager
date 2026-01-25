import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./TopNav.css";

export default function TopNav({ 
  setView, currentView, user, userName, familyName, householdId, 
  setMonitoringTarget, monitoringTarget 
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch family members for the monitoring list
    const fetchFamily = async () => {
      if (householdId) {
        try {
          const q = query(collection(db, "users"), where("householdId", "==", householdId));
          const snap = await getDocs(q);
          const members = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
          // Filter out myself
          setFamilyMembers(members.filter(m => m.uid !== user.uid));
        } catch(e) { console.error("Nav fetch error", e); }
      }
    };
    fetchFamily();

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [householdId, user.uid]);

  const handleCopyId = () => {
    if (householdId) {
      navigator.clipboard.writeText(householdId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSwitchUser = () => {
    setIsDropdownOpen(false); 
    setView("switchUser");   
  };

  const handleMonitorSelect = (member) => {
    setMonitoringTarget(member);
    setView("dashboard");
    setIsDropdownOpen(false);
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <nav className="top-nav" style={monitoringTarget ? { background: '#d97706' } : {}}>
      <div className="brand" onClick={() => setView("dashboard")}>
        💊 <span>{monitoringTarget ? `Viewing: ${monitoringTarget.name}` : "Med Manager"}</span>
      </div>

      <div className="nav-links">
        <button className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
        <button className={`nav-btn ${currentView === "inventory" ? "active" : ""}`} onClick={() => setView("inventory")}>📦 Stock</button>
        <button className={`nav-btn ${currentView === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>📅 Calendar</button>
        <button className={`nav-btn ${currentView === "addMed" ? "active" : ""}`} onClick={() => setView("addMed")}>➕ Add Med</button>

        <div className="profile-container" ref={dropdownRef}>
          <div className="profile-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            {monitoringTarget ? "👁️" : initial}
          </div>

          {isDropdownOpen && (
            <div className="dropdown-menu" style={{ width: '320px' }}>
              <div className="user-info">
                <h4 className="user-name">{userName || "User"}</h4>
                <span className="household-label">{familyName || "My Family"}</span>
                
                {householdId && (
                  <div className="id-box">
                    <span className="id-text">{householdId.substring(0, 8)}...</span>
                    <span className="copy-icon" onClick={handleCopyId}>{copySuccess ? "✅" : "📋"}</span>
                  </div>
                )}

                {monitoringTarget && (
                  <button 
                    onClick={() => { setMonitoringTarget(null); setIsDropdownOpen(false); }}
                    style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    🔙 Stop Monitoring
                  </button>
                )}
              </div>

              {/* INNOVATION: MONITORING SECTION */}
              <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Monitor Family Member
                </span>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {familyMembers.length > 0 ? familyMembers.map(member => (
                    <button 
                      key={member.uid}
                      onClick={() => handleMonitorSelect(member)}
                      style={{ 
                        textAlign: 'left', padding: '10px', background: 'white', border: '1px solid #e2e8f0', 
                        borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: '0.2s'
                      }}
                      className="menu-item"
                    >
                      <span style={{ fontSize: '1.2rem' }}>🧓</span> 
                      {member.name}
                    </button>
                  )) : <p style={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic' }}>No other members found.</p>}
                </div>
              </div>

              <div className="menu-actions">
                <button className="menu-item" onClick={handleSwitchUser}>🔄 Switch User</button>
                <button className="menu-item logout" onClick={() => auth.signOut()}>🚪 Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}