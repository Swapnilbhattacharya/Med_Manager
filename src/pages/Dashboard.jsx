import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; 
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getUserMeds } from "../services/medService";

// UI Components
import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";

import "./Dashboard.css";

export default function Dashboard({ user, householdId, setView }) {
  const [household, setHousehold] = useState(null);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch Household details
        const houseDoc = await getDoc(doc(db, "households", householdId));
        if (houseDoc.exists()) {
          setHousehold({ id: houseDoc.id, ...houseDoc.data() });
        }

        // Fetch Meds
        const data = await getUserMeds(householdId);
        setMeds(data || []);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [householdId]);

  const handleCreateHousehold = async () => {
    try {
      const newHouseRef = doc(db, "households", user.uid);
      await setDoc(newHouseRef, {
        name: `${user.email.split('@')[0]}'s House`,
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: new Date()
      });

      await updateDoc(doc(db, "users", user.uid), {
        householdId: user.uid
      });

      window.location.reload(); 
    } catch (err) {
      alert("Failed to create household.");
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}><h3>Loading...</h3></div>;

  // --- VIEW A: New User Choice Screen ---
  if (!householdId) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ textAlign: "center", maxWidth: '450px', padding: '40px' }}>
          <div style={{fontSize: '50px'}}>🏡</div>
          <h2 style={{margin: '15px 0'}}>Setup Your Household</h2>
          <p className="subtitle">You need a household to start managing medications with your family.</p>
          
          <div style={{ display: "flex", flexDirection: 'column', gap: "12px", marginTop: "25px" }}>
            <button className="primary-btn" onClick={handleCreateHousehold}>
              🏠 Create New Household
            </button>
            <button className="primary-btn" style={{ background: '#4caf50' }} onClick={() => setView("join")}>
              🤝 Join Existing Household
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW B: Active Household Dashboard ---
  const takenCount = meds.filter(m => m.taken).length;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user.email.split('@')[0]} 👋</h2>
          <p className="subtitle">
            <strong>Household:</strong> {household?.name || "Active Session"}
          </p>
        </div>
        <button className="primary-btn" onClick={() => setView("addMed")}>
          + Add Medicine
        </button>
      </div>

      <div className="card">
        <h3>Daily Adherence</h3>
        <ProgressRing taken={takenCount} total={meds.length} />
      </div>

      <div className="card">
        <h3>Current Medications</h3>
        <div className="med-grid">
          {meds.length > 0 ? (
            meds.map(med => (
              <MedicineCard 
                key={med.id} 
                name={med.name} 
                dose={med.dosage || med.dose} 
                status={med.taken ? "Taken" : "Pending"} 
              />
            ))
          ) : (
            <p style={{color: '#94a3b8'}}>No meds added yet. Click "+ Add Medicine" to start.</p>
          )}
        </div>
      </div>

      {/* Pass meds to the schedule list */}
      <Schedule meds={meds} />
    </div>
  );
}