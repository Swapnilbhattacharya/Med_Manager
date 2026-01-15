import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase"; 
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getUserMeds } from "../services/medService";

// UI Components
import ProgressRing from "../Components/ProgressRing";
import MedicineCard from "../Components/MedicineCard";
import Schedule from "../Components/Schedule";

// Styling
import "./Dashboard.css";

export default function Dashboard({ user, setView }) {
  const [household, setHousehold] = useState(null);
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // 1. Fetch User Profile to check for Household ID
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          if (userData.householdId) {
            // 2. Fetch Household Details
            const houseDoc = await getDoc(doc(db, "households", userData.householdId));
            if (houseDoc.exists()) {
              setHousehold({ id: houseDoc.id, ...houseDoc.data() });
            }
          }
        }

        // 3. Fetch Medications (using your existing service)
        const userMeds = await getUserMeds(user.uid);
        setMeds(userMeds || []);

      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Handle Creating a New Household
  const handleCreateHousehold = async () => {
    try {
      const houseRef = doc(db, "households", user.uid);
      await setDoc(houseRef, {
        name: `${user.email.split('@')[0]}'s Household`,
        ownerId: user.uid,
        memberIds: [user.uid],
        created_at: new Date()
      });

      // Update user profile with the new Household ID
      await updateDoc(doc(db, "users", user.uid), {
        householdId: user.uid
      });

      // Refresh data locally
      window.location.reload(); 
    } catch (err) {
      console.error("Error creating household:", err);
    }
  };

  if (loading) return <div className="dashboard-page" style={{textAlign: 'center', padding: '50px'}}><h2>Loading Dashboard...</h2></div>;

  // --- CHOICE SCREEN (If no household exists) ---
  if (!household) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="card" style={{ textAlign: "center", maxWidth: '400px' }}>
          <h1>Welcome! 👋</h1>
          <p className="subtitle">You haven't joined a household yet. Start by creating one or joining an existing one.</p>
          
          <div style={{ display: "flex", flexDirection: 'column', gap: "12px", marginTop: "20px" }}>
            <button className="primary-btn" onClick={handleCreateHousehold}>
              🏠 Create New Household
            </button>
            <button 
              className="primary-btn" 
              style={{ background: '#4caf50' }} 
              onClick={() => setView("join")} // Changed from window.location
            >
              🤝 Join Existing Household
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD (If household exists) ---
  const takenCount = meds.filter(m => m.taken).length;

  return (
    <div className="dashboard-page">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user.email.split('@')[0]} 👋</h2>
          <p className="subtitle">
            <strong>Household:</strong> {household.name} • {meds.length - takenCount} meds left today
          </p>
        </div>
        <button className="primary-btn" onClick={() => setView("scan")}>
          + Scan New
        </button>
      </div>

      {/* DAILY PROGRESS */}
      <div className="card">
        <h3>Daily Progress</h3>
        <ProgressRing taken={takenCount} total={meds.length || 0} />
      </div>

      {/* MY MEDICATIONS */}
      <div className="card">
        <h3>My Medications</h3>
        {meds.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No medications added to this household yet.</p>
        ) : (
          <div className="med-grid">
            {meds.map(med => (
              <MedicineCard 
                key={med.id} 
                name={med.name} 
                dose={med.dose || med.dosage} 
                status={med.taken ? "Taken" : "Active"} 
              />
            ))}
          </div>
        )}
      </div>

      {/* TODAY'S SCHEDULE */}
      <Schedule meds={meds} />
    </div>
  );
}