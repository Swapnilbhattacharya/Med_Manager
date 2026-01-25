import React, { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { deleteUser } from "firebase/auth";
import { 
  doc, getDoc, updateDoc, deleteDoc, arrayRemove, collection, getDocs, writeBatch 
} from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css"; 

// CRITICAL: MUST BE 'export default'
export default function Settings({ user, householdId, setView }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const houseRef = doc(db, "households", householdId);
        const houseSnap = await getDoc(houseRef);
        
        if (houseSnap.exists()) {
          const data = houseSnap.data();
          if (data.admin === user.uid) {
            setIsAdmin(true);
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            const houseMembers = snapshot.docs
                .map(d => ({ uid: d.id, ...d.data() }))
                .filter(m => m.householdId === householdId && m.uid !== user.uid);
            setMembers(houseMembers);
          }
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    checkAdminStatus();
  }, [householdId, user.uid]);

  const handleLeaveHousehold = async () => {
    if (!window.confirm("Are you sure you want to leave?")) return;
    try {
      const houseRef = doc(db, "households", householdId);
      await updateDoc(houseRef, { members: arrayRemove(user.uid) });
      await updateDoc(doc(db, "users", user.uid), { householdId: null });
      alert("You have left the household.");
      window.location.reload();
    } catch (err) { alert("Error leaving household."); }
  };

  const handleDeleteAccount = async () => {
    if (prompt("Type 'DELETE' to confirm account deletion.") === "DELETE") {
      try {
        if (householdId) {
            await updateDoc(doc(db, "households", householdId), { members: arrayRemove(user.uid) });
        }
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(auth.currentUser);
        alert("Account deleted.");
      } catch (err) { alert("Error deleting account."); }
    }
  };

  const handleKickMember = async (memberUid, memberName) => {
    if (!window.confirm(`Remove ${memberName}?`)) return;
    try {
      await updateDoc(doc(db, "households", householdId), { members: arrayRemove(memberUid) });
      await updateDoc(doc(db, "users", memberUid), { householdId: null });
      setMembers(prev => prev.filter(m => m.uid !== memberUid));
    } catch (err) { alert("Error removing member."); }
  };

  const handleDestroyHousehold = async () => {
    if (prompt("Type 'DESTROY' to delete household.") === "DESTROY") {
      try {
        const batch = writeBatch(db);
        const houseRef = doc(db, "households", householdId);
        
        // Unlink all members
        const allMemberIds = [...members.map(m => m.uid), user.uid];
        allMemberIds.forEach(uid => {
            batch.update(doc(db, "users", uid), { householdId: null });
        });
        
        batch.delete(houseRef);
        await batch.commit();
        alert("Household destroyed.");
        window.location.reload();
      } catch (err) { alert("System error."); }
    }
  };

  if (loading) return <div className="loading-screen">Loading Settings...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <div className="professional-form-card" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2 style={{ color: '#1e3a8a', marginBottom: '20px' }}>⚙️ Settings</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#475569' }}>My Account</h3>
          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
            <button className="btn-secondary" onClick={handleLeaveHousehold}>Leave Family</button>
            <button className="btn-secondary" style={{ color: '#ef4444', borderColor: '#fee2e2', background: '#fef2f2' }} onClick={handleDeleteAccount}>Delete Account</button>
          </div>
        </div>

        {isAdmin && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '25px' }}>
            <h3 style={{ color: '#9a3412', marginTop: 0 }}>👑 Admin Console</h3>
            
            <div style={{ margin: '20px 0' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#9a3412' }}>MEMBERS</h4>
              {members.map(m => (
                <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', marginTop: '5px', borderRadius: '8px' }}>
                  <span>{m.name}</span>
                  <button onClick={() => handleKickMember(m.uid, m.name)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                </div>
              ))}
            </div>

            <button onClick={handleDestroyHousehold} style={{ width: '100%', padding: '15px', borderRadius: '10px', background: '#7f1d1d', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer' }}>
              💣 DELETE HOUSEHOLD
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}