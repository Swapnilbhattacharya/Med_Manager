import React, { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { deleteUser } from "firebase/auth";
import { 
  doc, getDoc, updateDoc, deleteDoc, arrayRemove, collection, getDocs, writeBatch 
} from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css"; 

export default function Settings({ user, householdId, setView }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [canClaimAdmin, setCanClaimAdmin] = useState(false);
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
          
          // 1. Fetch ALL members
          const usersRef = collection(db, "users");
          const snapshot = await getDocs(usersRef);
          const houseMembers = snapshot.docs
              .map(d => ({ uid: d.id, ...d.data() }))
              .filter(m => m.householdId === householdId);
          
          // Filter out myself for the display list
          setMembers(houseMembers.filter(m => m.uid !== user.uid));

          // 2. CHECK ADMIN STATUS
          if (data.admin === user.uid) {
            setIsAdmin(true);
          } 
          // 3. SMART CHECK: Is the throne empty?
          // Condition: Admin field is null OR The current admin ID is not in the member list (Zombie Admin)
          else {
            const adminExistsInHouse = houseMembers.some(m => m.uid === data.admin);
            
            if (!data.admin || !adminExistsInHouse) {
              setCanClaimAdmin(true);
            }
          }
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    checkAdminStatus();
  }, [householdId, user.uid]);

  // --- ACTIONS ---

  const handleClaimAdmin = async () => {
    if (!confirm("The Family Head position is vacant. Do you want to claim it?")) return;
    
    try {
      // RACE CONDITION CHECK: Double check the server before writing
      const houseRef = doc(db, "households", householdId);
      const freshSnap = await getDoc(houseRef);
      const freshData = freshSnap.data();

      // If someone else claimed it just now (and they are a valid member)
      if (freshData.admin && freshData.admin !== user.uid) {
         // Check if that admin is actually valid
         const adminDoc = await getDoc(doc(db, "users", freshData.admin));
         if (adminDoc.exists() && adminDoc.data().householdId === householdId) {
             alert("❌ Too late! Someone else just claimed the position.");
             window.location.reload();
             return;
         }
      }

      // Proceed to Claim
      await updateDoc(houseRef, { admin: user.uid });
      setIsAdmin(true);
      setCanClaimAdmin(false);
      alert("👑 Success! You are now the Family Head.");
      
    } catch (err) {
      console.error(err);
      alert("Error claiming ownership.");
    }
  };

  const handleLeaveHousehold = async () => {
    if (!window.confirm("Are you sure you want to leave?")) return;
    try {
      const houseRef = doc(db, "households", householdId);
      
      // If I am the admin, I must abdicate the throne (set admin to null)
      if (isAdmin) {
          await updateDoc(houseRef, { 
              members: arrayRemove(user.uid),
              admin: null // Open the spot for someone else
          });
      } else {
          await updateDoc(houseRef, { members: arrayRemove(user.uid) });
      }

      await updateDoc(doc(db, "users", user.uid), { householdId: null });
      alert("You have left the household.");
      window.location.reload();
    } catch (err) { alert("Error leaving household."); }
  };

  const handleDeleteAccount = async () => {
    if (prompt("Type 'DELETE' to confirm account deletion.") === "DELETE") {
      try {
        if (householdId) {
            // Same logic: if Admin leaves, clear the admin field
            const updates = { members: arrayRemove(user.uid) };
            if (isAdmin) updates.admin = null;
            
            await updateDoc(doc(db, "households", householdId), updates);
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
        // (We re-fetch members roughly or use local state + self)
        const allMemberIds = [...members.map(m => m.uid), user.uid];
        allMemberIds.forEach(uid => {
            batch.update(doc(db, "users", uid), { householdId: null });
        });
        
        // Delete Subcollections (Manual loop required for Firestore)
        // Note: For a true production app, this should be a Cloud Function.
        // For client-side, we do best effort.
        const medsSnap = await getDocs(collection(db, "households", householdId, "medicines"));
        medsSnap.forEach(d => batch.delete(d.ref));
        
        const invSnap = await getDocs(collection(db, "households", householdId, "inventory"));
        invSnap.forEach(d => batch.delete(d.ref));

        batch.delete(houseRef);
        await batch.commit();
        
        alert("Household destroyed.");
        window.location.reload();
      } catch (err) { 
        console.error(err);
        alert("System error. Check console."); 
      }
    }
  };

  if (loading) return <div className="loading-screen">Loading Settings...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <div className="professional-form-card" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2 style={{ color: '#1e3a8a', marginBottom: '20px' }}>⚙️ Settings</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#475569' }}>My Account</h3>
          
          {/* ORPHAN FIX: CLAIM BUTTON (Visible to ANYONE if admin is missing) */}
          {canClaimAdmin && !isAdmin && (
             <div style={{ padding:'15px', background:'#e0f2fe', borderRadius:'10px', marginBottom:'15px', border:'1px solid #bae6fd' }}>
                <p style={{margin:'0 0 5px 0', color:'#0369a1', fontWeight:'bold'}}>⚠️ No Family Head Assigned</p>
                <p style={{margin:'0 0 15px 0', fontSize:'0.9rem', color:'#0c4a6e'}}>
                  This household currently has no administrator.
                </p>
                <button 
                  onClick={handleClaimAdmin} 
                  style={{
                    padding:'10px 20px', background:'#0284c7', color:'white', 
                    border:'none', borderRadius:'8px', fontWeight:'bold', 
                    cursor:'pointer', boxShadow:'0 4px 6px rgba(2, 132, 199, 0.2)'
                  }}
                >
                  👑 Claim Ownership Now
                </button>
             </div>
          )}

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
              {members.length > 0 ? members.map(m => (
                <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', marginTop: '5px', borderRadius: '8px' }}>
                  <span>{m.name}</span>
                  <button onClick={() => handleKickMember(m.uid, m.name)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                </div>
              )) : (
                <p style={{ color: '#c2410c', fontStyle:'italic' }}>No other members.</p>
              )}
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