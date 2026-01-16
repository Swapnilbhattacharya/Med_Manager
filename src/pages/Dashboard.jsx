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
  const userName = user.email.split('@')[0];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const data = await getUserMeds(householdId);
        setMeds(data || []);
      } catch (err) { console.error("Error loading meds:", err); } 
      finally { setLoading(false); }
    };
    loadData();
  }, [householdId]);

  const toggleMedStatus = async (medId, currentStatus) => {
    // Permanent check logic: If already taken, do nothing
    if (currentStatus) return; 

    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);

    try {
      const medRef = doc(db, "households", householdId, "medications", medId);
      await updateDoc(medRef, { taken: true });
    } catch (err) {
      console.error("Firebase update failed:", err);
      // Optional: rollback UI if firebase fails
    }
  };

  if (loading) return <div className="loading-screen">Loading Medical Suite...</div>;

  const takenCount = meds.filter(m => m.taken).length;
  const pendingCount = meds.length - takenCount;

  return (
    <div className="dashboard-wrapper">
      <header className="dash-header">
        <div className="welcome-area">
          <h1>Good Morning, <span className="highlight-name">{userName}</span> ✨</h1>
          <p>You've completed <span className="count-tag">{takenCount}/{meds.length}</span> doses today.</p>
        </div>
        <button className="btn-add-main" onClick={() => setView("addMed")}>+ Add Medicine</button>
      </header>

      <div className="main-grid">
        {/* Sidebar for Progress */}
        <aside className="adherence-panel">
          <div className="glass-inner">
            <h3 className="panel-title">Daily Adherence</h3>
            <ProgressRing taken={takenCount} total={meds.length} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
            <p className="motivational-text">
              {takenCount === meds.length && meds.length > 0 ? "Perfect Streak! 🌟" : "Keep up the routine!"}
            </p>
          </div>
        </aside>

        {/* Main Schedule Box */}
        <main className="schedule-panel">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => (
                <MedicineCard 
                  key={med.id} 
                  name={med.name} 
                  dose={med.dosage || med.dose} 
                  status={med.taken ? "Taken" : "Pending"} 
                  onToggle={() => toggleMedStatus(med.id, med.taken)} 
                />
              ))
            ) : (
              <div className="empty-state-box">No medications found for today.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}