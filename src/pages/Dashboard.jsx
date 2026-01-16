import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getUserMeds } from "../services/medService";
import MedicineCard from "../Components/MedicineCard";
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

export default function Dashboard({ user, householdId, setView }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const userName = user?.email?.split('@')[0] || "User";

  // Get current day name (e.g., "Saturday")
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const data = await getUserMeds(householdId);
        // Ensure we only store medications meant for TODAY
        const filteredData = (data || []).filter(m => m.day === todayName);
        setMeds(filteredData);
      } catch (err) { 
        console.error("Error loading meds:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [householdId, todayName]); // Added todayName as dependency

  const toggleMedStatus = async (medId, currentStatus) => {
    if (currentStatus) return; 

    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);

    try {
      // Corrected collection path to "medicines" to match your medService logic
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { 
        taken: true,
        status: "taken" 
      });
    } catch (err) {
      console.error("Firebase update failed:", err);
    }
  };

  if (loading) return <div className="loading-screen">Loading Medical Suite...</div>;

  const takenCount = meds.filter(m => m.taken || m.status === "taken").length;
  const totalCount = meds.length;
  const pendingCount = totalCount - takenCount;

  return (
    <div className="dashboard-wrapper">
      <header className="dash-header">
        <div className="welcome-area">
          <h1>Good Morning, <span className="highlight-name">{userName}</span> ✨</h1>
          <p>You've completed <span className="count-tag">{takenCount}/{totalCount}</span> doses today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-cancel" onClick={() => setView("calendar")}>🗓️ Calendar</button>
          <button className="btn-add-main" onClick={() => setView("addMed")}>+ Add Medicine</button>
        </div>
      </header>

      <div className="main-grid">
        <aside className="adherence-panel">
          <div className="glass-inner">
            <h3 className="panel-title">Daily Adherence</h3>
            <ProgressRing taken={takenCount} total={totalCount} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
            <p className="motivational-text">
              {takenCount === totalCount && totalCount > 0 ? "Perfect Streak! 🌟" : "Keep up the routine!"}
            </p>
          </div>
        </aside>

        <main className="schedule-panel">
          <div className="panel-header">
            <h3>Today's Schedule ({todayName})</h3>
            <span className="today-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => (
                <MedicineCard 
                  key={med.id} 
                  name={med.name} 
                  dose={med.dosage || med.dose} 
                  status={med.taken || med.status === "taken" ? "Taken" : "Pending"} 
                  onToggle={() => toggleMedStatus(med.id, med.taken)} 
                />
              ))
            ) : (
              <div className="empty-state-box">
                <p>No medications scheduled for {todayName}.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}