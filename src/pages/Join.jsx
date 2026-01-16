import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import "./Dashboard.css";

export default function Setup({ user, setView }) {
  const [houseName, setHouseName] = useState("");
  const [houseIdInput, setHouseIdInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!houseName) return alert("Please enter a family name");
    setLoading(true);
    try {
      const houseRef = await addDoc(collection(db, "households"), {
        name: houseName,
        admin: user.uid,
        createdAt: new Date()
      });
      await updateDoc(doc(db, "users", user.uid), { householdId: houseRef.id });
    } catch (err) { alert("Error creating household"); }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!houseIdInput) return alert("Please enter a Household ID");
    setLoading(true);
    try {
      // Basic update: In a real app, you might want to verify the ID exists first
      await updateDoc(doc(db, "users", user.uid), { householdId: houseIdInput });
    } catch (err) { alert("Invalid Household ID"); }
    setLoading(false);
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dash-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div>
          <h2 className="highlight-name">Welcome to Med Manager 🏠</h2>
          <p style={{ color: '#64748b' }}>How would you like to start today?</p>
        </div>
      </div>

      <div className="form-container-centered" style={{ gap: '30px', flexDirection: 'column' }}>
        {/* CREATE SECTION */}
        <div className="professional-form-card glass-inner">
          <h3 style={{ color: '#4f46e5', marginBottom: '15px' }}>Create New Household</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>Start a fresh schedule for your family.</p>
          <input 
            type="text" className="pro-input" placeholder="Family Name (e.g., Smith Family)" 
            value={houseName} onChange={(e) => setHouseName(e.target.value)}
          />
          <button onClick={handleCreate} disabled={loading} className="btn-save-main" style={{ marginTop: '20px' }}>
            {loading ? "Creating..." : "Create Household"}
          </button>
        </div>

        <div style={{ color: '#94a3b8', fontWeight: '800' }}>— OR —</div>

        {/* JOIN SECTION */}
        <div className="professional-form-card glass-inner">
          <h3 style={{ color: '#10b981', marginBottom: '15px' }}>Join Existing</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>Enter the ID shared by a family member.</p>
          <input 
            type="text" className="pro-input" placeholder="Paste Household ID here" 
            value={houseIdInput} onChange={(e) => setHouseIdInput(e.target.value)}
          />
          <button onClick={handleJoin} disabled={loading} className="btn-add-main" style={{ marginTop: '20px', background: '#10b981' }}>
            {loading ? "Joining..." : "Join Household"}
          </button>
        </div>
      </div>
    </div>
  );
}