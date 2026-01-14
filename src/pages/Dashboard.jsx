import { useEffect, useState } from "react";
import { getUserMeds } from "../services/medService";

// 👇 FIX: Capital 'C' to match your project folder
import TopNav from "../Components/TopNav";
import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";

import "./Dashboard.css";

export default function Dashboard({ user }) { // 👈 Use 'user' from props
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeds = async () => {
      if (!user) return;
      try {
        const data = await getUserMeds(user.uid);
        setMeds(data || []);
      } catch (err) {
        console.error("Failed to load medicines", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, [user]);

  if (loading) {
    return <div className="dashboard-page" style={{textAlign: 'center', padding: '50px'}}><h2>Loading your cabinet...</h2></div>;
  }

  const takenCount = meds.filter((m) => m.taken === true).length;
  const userName = user.displayName || user.email?.split("@")[0] || "User";

  return (
    <div className="dashboard-page">
      {/* 🧭 NAVIGATION */}
      <TopNav />

      <div style={{ padding: '0 20px' }}>
        {/* 👋 HEADER */}
        <div className="dashboard-header">
          <div>
            <h2>Welcome, {userName} 👋</h2>
            <p className="subtitle">
              {meds.length > 0
                ? "Here’s your medication overview for today"
                : "Start by adding your medicines"}
            </p>
          </div>
        </div>

        {/* 📊 PROGRESS CARD */}
        <div className="card">
          <h3>Daily Progress</h3>
          <ProgressRing
            taken={takenCount}
            total={meds.length}
          />
        </div>

        {/* 💊 MEDICATIONS */}
        <div className="card">
          <h3>My Medications</h3>
          {meds.length === 0 ? (
            <div className="empty-state">
              <p>No medicines added yet. Your cabinet is empty!</p>
            </div>
          ) : (
            <div className="med-grid">
              {meds.map((med) => (
                <MedicineCard
                  key={med.id}
                  name={med.name}
                  dose={med.dose}
                  status={med.taken ? "Taken" : "Upcoming"}
                />
              ))}
            </div>
          )}
        </div>

        {/* 📅 SCHEDULE */}
        <div className="card">
          <h3>Today’s Schedule</h3>
          <Schedule meds={meds} />
        </div>
      </div>
    </div>
  );
}