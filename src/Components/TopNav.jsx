import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./TopNav.css";

export default function TopNav({ 
  setView, currentView, user, userName, familyName, householdId, 
  setMonitoringTarget, monitoringTarget 
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFamilyOpen, setIsFamilyOpen] = useState(false); 
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const profileRef = useRef(null);
  const familyRef = useRef(null);

  useEffect(() => {
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
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (familyRef.current && !familyRef.current.contains(event.target)) setIsFamilyOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [householdId, user.uid]);

  const handleMonitorSelect = (member) => {
    setMonitoringTarget(member);
    setView("dashboard");
    setIsFamilyOpen(false);
  };

  const handleStopMonitoring = () => {
    setMonitoringTarget(null);
    setIsFamilyOpen(false);
    setView("dashboard");
  };

  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  return (
    <nav className={`top-nav ${monitoringTarget ? 'monitoring-mode' : ''}`}>
      
      <div className="brand" onClick={() => setView("dashboard")}>
        💊 <span>Med Manager</span>
      </div>

      <div className="nav-links">
        
        {/* --- FAMILY MONITOR BUTTON (Always visible to allow exiting mode) --- */}
        <div className="nav-dropdown-container" ref={familyRef}>
          <button 
            className={`nav-btn family-btn ${monitoringTarget ? 'active-monitor' : ''} ${isFamilyOpen ? 'open' : ''}`} 
            onClick={() => setIsFamilyOpen(!isFamilyOpen)}
          >
            {monitoringTarget ? (
              <>👁️ Viewing: {monitoringTarget.name}</>
            ) : (
              <>👨‍👩‍👧 Family</>
            )}
          </button>

          {isFamilyOpen && (
            <div className="dropdown-menu family-menu">
              <h4 className="menu-title">Select Member to Monitor</h4>
              
              <div className="family-list">
                <button 
                  className={`family-item ${!monitoringTarget ? 'current' : ''}`}
                  onClick={handleStopMonitoring}
                >
                  <span className="avatar-small">👤</span>
                  <div>
                    <span className="name">My Dashboard</span>
                    <span className="role">Admin (You)</span>
                  </div>
                  {!monitoringTarget && <span className="check">✓</span>}
                </button>

                <div className="divider"></div>

                {familyMembers.length > 0 ? familyMembers.map(member => (
                  <button 
                    key={member.uid}
                    className={`family-item ${monitoringTarget?.uid === member.uid ? 'current' : ''}`}
                    onClick={() => handleMonitorSelect(member)}
                  >
                    <span className="avatar-small">👴</span>
                    <div>
                      <span className="name">{member.name}</span>
                      <span className="role">Dependent</span>
                    </div>
                    {monitoringTarget?.uid === member.uid && <span className="check">✓</span>}
                  </button>
                )) : (
                  <div style={{padding:'10px', color:'#94a3b8', fontStyle:'italic'}}>No other members.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="divider-vertical"></div>

        <button className={`nav-btn ${currentView === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
        <button className={`nav-btn ${currentView === "inventory" ? "active" : ""}`} onClick={() => setView("inventory")}>📦 Stock</button>
        <button className={`nav-btn ${currentView === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>📅 Calendar</button>
        <button className={`nav-btn ${currentView === "addMed" ? "active" : ""}`} onClick={() => setView("addMed")}>➕ Add Med</button>

        {/* --- PROFILE DROPDOWN (HIDDEN WHEN MONITORING) --- */}
        {!monitoringTarget && (
          <div className="profile-container" ref={profileRef}>
            <div className="profile-btn" onClick={() => setIsProfileOpen(!isProfileOpen)}>
              {initial}
            </div>

            {isProfileOpen && (
              <div className="dropdown-menu profile-menu">
                <div className="user-info">
                  <h4 className="user-name">{userName}</h4>
                  <span className="household-label">{familyName}</span>
                  <div className="id-box">
                    <span className="id-text">{householdId?.substring(0, 8)}...</span>
                    <button className="copy-icon" onClick={() => navigator.clipboard.writeText(householdId)}>📋</button>
                  </div>
                </div>

                <div className="menu-actions">
                  <button className="menu-item" onClick={() => { setIsProfileOpen(false); setView("switchUser"); }}>
                    🔄 Switch User
                  </button>
                  
                  <button className="menu-item" onClick={() => { setIsProfileOpen(false); setView("settings"); }}>
                    ⚙️ Settings
                  </button>
                  
                  <button className="menu-item logout" onClick={() => auth.signOut()}>
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </nav>
  );
}