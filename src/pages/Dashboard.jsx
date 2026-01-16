import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { getUserMeds, resetDailyStatus } from "../services/medService";

import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";

export default function Dashboard({ user, householdId, setView }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncDashboard = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const houseRef = doc(db, "households", householdId);
        const houseSnap = await getDoc(houseRef);

        if (houseSnap.exists()) {
          const houseData = houseSnap.data();
          const today = new Date().toDateString();
          // Reset if it's a new day
          if (houseData.lastResetDate !== today) {
            await resetDailyStatus(householdId);
          }
        }
        const data = await getUserMeds(householdId);
        setMeds(data || []);
      } catch (err) { console.error("Dashboard Load Error:", err); }
      setLoading(false);
    };
    syncDashboard();
  }, [householdId]);

  if (loading) return <div style={{textAlign: 'center', padding: '50px'}}><h3>Syncing...</h3></div>;

  // Adherence calculations
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()];
  const todaysMeds = meds.filter(m => m.day === today);
  const takenCount = todaysMeds.filter(m => m.status === "taken").length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Hello, {user?.email?.split('@')[0]} 👋</h2>
          <p className="subtitle">Today is {today}</p>
        </div>
        <button className="primary-btn" onClick={() => setView("addMed")}>+ Add Medicine</button>
      </div>

      <div className="card">
        <h3>Daily Progress</h3>
        <ProgressRing taken={takenCount} total={todaysMeds.length} />
      </div>

      <div className="card">
        <h3>Today's Actions</h3>
        {/* THIS IS THE SCHEDULE COMPARTMENT */}
        <Schedule meds={meds} householdId={householdId} />
      </div>
      
      <div className="card">
        <h3>Inventory</h3>
        <div className="med-grid">
          {meds.map(med => (
            <MedicineCard key={med.id} name={med.name} dose={med.dosage} status={med.status} />
          ))}
        </div>
      </div>
    </div>
  );
}