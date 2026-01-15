import React, { useEffect, useState } from "react";
import { getUserMeds } from "../services/medService";
import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";
import "./Dashboard.css";

export default function Dashboard({ user, setView }) {
  const [meds, setMeds] = useState([]);

  useEffect(() => {
    if (user) getUserMeds(user.uid).then(setMeds);
  }, [user]);

  const takenCount = meds.filter(m => m.taken).length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user.email.split('@')[0]} 👋</h2>
          <p className="subtitle">You have {meds.length - takenCount} meds left today.</p>
        </div>
        <button className="primary-btn" onClick={() => setView("scan")}>+ Scan New</button>
      </div>

      <div className="card">
        <h3>Daily Progress</h3>
        <ProgressRing taken={takenCount} total={meds.length || 0} />
      </div>

      <div className="card">
        <h3>My Medications</h3>
        <div className="med-grid">
          {meds.map(med => (
            <MedicineCard key={med.id} name={med.name} dose={med.dose} status={med.taken ? "Taken" : "Active"} />
          ))}
        </div>
      </div>
      <Schedule meds={meds} />
    </div>
  );
}