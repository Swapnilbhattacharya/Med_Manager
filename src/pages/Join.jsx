import React, { useState } from "react";
import { db, auth } from "../services/firebase"; // Added 'auth'
import { doc, setDoc, updateDoc, getDoc, addDoc, collection, deleteDoc } from "firebase/firestore"; // Added 'deleteDoc'
import { deleteUser } from "firebase/auth"; // Added for account deletion
import { motion } from "framer-motion";
import "./Dashboard.css"; 

export default function Join({ user, setView }) {
  const [activeTab, setActiveTab] = useState("create");
  const [familyName, setFamilyName] = useState("");
  const [householdIdInput, setHouseholdIdInput] = useState("");
  const [userName, setUserName] = useState(""); 
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
        name: userName.trim() 
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

  // --- NEW: DELETE ACCOUNT FUNCTION ---
  const handleDeleteAccount = async () => {
    const confirmMsg = "Are you sure? This will permanently delete your account. This action cannot be undone.";
    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      // 1. Delete Firestore User Doc
      await deleteDoc(doc(db, "users", user.uid));
      
      // 2. Delete Authentication User
      await deleteUser(auth.currentUser);
      
      alert("Account deleted.");
      // The App.jsx auth listener will handle the redirect to login
    } catch (err) {
      console.error(err);
      alert("Error deleting account. You may need to re-login first.");
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

        {/* --- DELETE ACCOUNT LINK (Added at bottom) --- */}
        <div style={{ marginTop: '30px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', textAlign: 'center' }}>
          <button 
            onClick={handleDeleteAccount}
            disabled={loading}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#ef4444', 
              fontSize: '0.85rem', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            I want to delete my account
          </button>
        </div>

      </div>
    </div>
  );
}