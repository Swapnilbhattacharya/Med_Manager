import React from "react";
import "./Dashboard.css";
import { logoutUser } from "../services/authService";

// 👇 PATH FIX: Going up out of 'pages' and into 'Components'
import TopNav from "../Components/TopNav";
import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";

export default function Dashboard({ user }) {
  return (
    <div className="dashboard-container">
      <TopNav />
      
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div>
          {/* Grabs the name from the email (e.g., buddy@gmail.com -> buddy) */}
          <h2>Welcome, {user.email.split('@')[0]} 👋</h2>
          <p>You have meds to take today.</p>
        </div>
        <button onClick={logoutUser} style={{ padding: '8px 16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', height: 'fit-content' }}>
          Logout
        </button>
      </div>

      <div className="dashboard-section">
        <h3>Daily Progress</h3>
        <ProgressRing taken={3} total={5} />
      </div>

      <div className="dashboard-section">
        <h4>My Medications</h4>
        <div className="medicine-grid">
          <MedicineCard name="Atorvastatin" dose="20mg | 1 Tablet" status="Active" />
          <MedicineCard name="Metformin" dose="500mg | With food" status="Active" />
        </div>
      </div>

      <Schedule />
    </div>
  );
}