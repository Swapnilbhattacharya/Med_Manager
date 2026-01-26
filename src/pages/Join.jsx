import React, { useState } from "react";
import { db, auth } from "../services/firebase"; 
import { doc, updateDoc, getDoc, addDoc, collection, deleteDoc } from "firebase/firestore"; 
import { deleteUser } from "firebase/auth"; 
import { motion } from "framer-motion";
import { useModal } from "../context/ModalContext"; 
import "./Dashboard.css"; 

export default function Join({ user, setView }) {
  const modal = useModal(); 
  const [activeTab, setActiveTab] = useState("create");
  const [familyName, setFamilyName] = useState("");
  const [householdIdInput, setHouseholdIdInput] = useState("");
  const [userName, setUserName] = useState(""); 
  const [loading, setLoading] = useState(false);

  const createHousehold = async () => {
    if (!familyName.trim() || !userName.trim()) return modal.showAlert("Missing Info", "Please enter family name AND your name.");
    setLoading(true);
    try {
      const houseRef = await addDoc(collection(db, "households"), {
        name: familyName,
        admin: user.uid,
        members: [user.uid],
        createdAt: new Date()
      });
      await updateDoc(doc(db, "users", user.uid), {
        householdId: houseRef.id,
        name: userName.trim() 
      });
    } catch (error) { modal.showAlert("Error", "Failed to create household."); } 
    finally { setLoading(false); }
  };

  const joinHousehold = async () => {
    if (!householdIdInput.trim() || !userName.trim()) return modal.showAlert("Missing Info", "Please enter ID AND your name.");
    setLoading(true);
    try {
      const houseRef = doc(db, "households", householdIdInput.trim());
      const houseSnap = await getDoc(houseRef);
      if (!houseSnap.exists()) {
        modal.showAlert("Error", "Household ID not found!");
        setLoading(false);
        return;
      }
      const currentMembers = houseSnap.data().members || [];
      if (!currentMembers.includes(user.uid)) {
        await updateDoc(houseRef, { members: [...currentMembers, user.uid] });
      }
      await updateDoc(doc(db, "users", user.uid), {
        householdId: householdIdInput.trim(),
        name: userName.trim()
      });
    } catch (error) { modal.showAlert("Error", "Failed to join household."); } 
    finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await modal.showConfirm("Delete Account?", "Are you sure? This will permanently delete your account.");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);
      await modal.showAlert("Deleted", "Your account has been deleted.");
    } catch (err) {
      modal.showAlert("Error", "Could not delete account. Try logging in again.");
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '90vh' }}>
      <div className="professional-form-card" style={{ width: '100%', maxWidth: '500px' }}>
        
        <h2 style={{ textAlign: 'center', color: '#1e3a8a', marginBottom: '10px' }}>Welcome! 👋</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '30px' }}>
          Let's set up your profile and family group.
        </p>

        <div style={{ marginBottom: '25px' }}>
          <label className="input-label">What should we call you?</label>
          <input className="pro-input" placeholder="e.g. John, Mom" value={userName} onChange={(e) => setUserName(e.target.value)} />
        </div>

        <div className="days-row-container" style={{ marginBottom: '25px' }}>
          <button className={`day-btn ${activeTab === "create" ? "active" : ""}`} onClick={() => setActiveTab("create")}>Create New Family</button>
          <button className={`day-btn ${activeTab === "join" ? "active" : ""}`} onClick={() => setActiveTab("join")}>Join Existing</button>
        </div>

        {/* DYNAMIC CONTENT AREA */}
        <div style={{ minHeight: '180px' }}>
          {activeTab === "create" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="input-label">Family Name</label>
              <input className="pro-input" placeholder="e.g. The Smith Family" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
              <button className="btn-add-main" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }} onClick={createHousehold} disabled={loading}>
                {loading ? "Creating..." : "✨ Create Household"}
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <label className="input-label">Household ID</label>
              <input className="pro-input" placeholder="Paste ID here..." value={householdIdInput} onChange={(e) => setHouseholdIdInput(e.target.value)} />
              <button className="btn-add-main" style={{ width: '100%', marginTop: '20px', justifyContent: 'center', background: '#10b981' }} onClick={joinHousehold} disabled={loading}>
                {loading ? "Joining..." : "🚀 Join Household"}
              </button>
            </motion.div>
          )}
        </div>

        {/* --- LOGOUT & DELETE SECTION (Always Visible at Bottom) --- */}
        <div style={{ marginTop: '30px', borderTop: '2px solid #f1f5f9', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <button 
            onClick={() => auth.signOut()} 
            style={{ 
              width: '100%',
              padding: '12px', 
              borderRadius: '12px', 
              border: '2px solid #fee2e2', 
              background: '#fef2f2', 
              color: '#dc2626', 
              fontWeight: '700', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            🚪 Logout / Switch Account
          </button>

          <button 
            onClick={handleDeleteAccount} 
            disabled={loading} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#94a3b8', 
              fontSize: '0.85rem', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              textAlign: 'center'
            }}
          >
            Permanently delete my account
          </button>
        </div>

      </div>
    </div>
  );
}