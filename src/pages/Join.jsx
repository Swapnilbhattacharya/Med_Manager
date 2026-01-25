import React, { useState } from "react";
import { db } from "../services/firebase";
import { doc, setDoc, updateDoc, getDoc, addDoc, collection } from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css"; // Uses shared glass styles

export default function Join({ user, setView }) {
  const [activeTab, setActiveTab] = useState("create");
  const [familyName, setFamilyName] = useState("");
  const [householdIdInput, setHouseholdIdInput] = useState("");
  const [userName, setUserName] = useState(""); // NEW: Capture Name
  const [loading, setLoading] = useState(false);

  const createHousehold = async () => {
    if (!familyName.trim() || !userName.trim()) return alert("Please enter family name AND your name.");
    setLoading(true);
    try {
      // 1. Create Household using addDoc (auto-ID)
      const houseRef = await addDoc(collection(db, "households"), {
        name: familyName,
        admin: user.uid,
        members: [user.uid],
        createdAt: new Date()
      });

      // 2. Link User & Save Name
      await updateDoc(doc(db, "users", user.uid), {
        householdId: houseRef.id,
        name: userName.trim() // Saving the name here
      });

    } catch (error) {
      console.error(error);
      alert("Error creating household.");
    } finally {
      setLoading(false);
    }
  };

  const joinHousehold = async () => {
    if (!householdIdInput.trim() || !userName.trim()) return alert("Please enter ID AND your name.");
    setLoading(true);
    try {
      const houseRef = doc(db, "households", householdIdInput.trim());
      const houseSnap = await getDoc(houseRef);

      if (!houseSnap.exists()) {
        alert("Household ID not found!");
        setLoading(false);
        return;
      }

      // 1. Add user to members list
      const currentMembers = houseSnap.data().members || [];
      // Avoid duplicates
      if (!currentMembers.includes(user.uid)) {
        await updateDoc(houseRef, {
          members: [...currentMembers, user.uid]
        });
      }

      // 2. Update User Profile
      await updateDoc(doc(db, "users", user.uid), {
        householdId: householdIdInput.trim(),
        name: userName.trim()
      });

    } catch (error) {
      console.error(error);
      alert("Error joining household.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="professional-form-card" style={{ width: '100%', maxWidth: '500px' }}>
        
        <h2 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '10px' }}>Welcome! 👋</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>
          Let's set up your profile and family group.
        </p>

        {/* STEP 1: ASK FOR NAME (Global for both tabs) */}
        <div style={{ marginBottom: '25px' }}>
          <label className="input-label">What should we call you?</label>
          <input 
            className="pro-input" 
            placeholder="e.g. John, Mom, Dr. Smith"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        {/* TABS */}
        <div className="days-row-container" style={{ marginBottom: '25px' }}>
          <button 
            className={`day-btn ${activeTab === "create" ? "active" : ""}`} 
            onClick={() => setActiveTab("create")}
          >
            Create New Family
          </button>
          <button 
            className={`day-btn ${activeTab === "join" ? "active" : ""}`} 
            onClick={() => setActiveTab("join")}
          >
            Join Existing
          </button>
        </div>

        {activeTab === "create" ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="input-label">Family Name</label>
            <input 
              className="pro-input" 
              placeholder="e.g. The Smith Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
            {/* BUTTON FIXED */}
            <button 
              className="btn-add-main" 
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }} 
              onClick={createHousehold}
              disabled={loading}
            >
              {loading ? "Creating..." : "✨ Create Household"}
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="input-label">Household ID</label>
            <input 
              className="pro-input" 
              placeholder="Paste ID here..."
              value={householdIdInput}
              onChange={(e) => setHouseholdIdInput(e.target.value)}
            />
            {/* BUTTON FIXED */}
            <button 
              className="btn-add-main" 
              style={{ width: '100%', marginTop: '20px', justifyContent: 'center', background: '#10b981' }} 
              onClick={joinHousehold}
              disabled={loading}
            >
              {loading ? "Joining..." : "🚀 Join Household"}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}