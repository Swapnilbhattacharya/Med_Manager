import React, { useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { deleteUser } from "firebase/auth";
import { 
  doc, getDoc, updateDoc, deleteDoc, arrayRemove, collection, getDocs, writeBatch 
} from "firebase/firestore";
import { motion } from "framer-motion";
import { useModal } from "../context/ModalContext"; 
import "./Dashboard.css"; 

export default function Settings({ user, householdId, setView }) {
  const modal = useModal(); 

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
          
          // Fetch Members
          const usersRef = collection(db, "users");
          const snapshot = await getDocs(usersRef);
          const houseMembers = snapshot.docs
              .map(d => ({ uid: d.id, ...d.data() }))
              .filter(m => m.householdId === householdId);
          
          // Filter out myself for the list UI
          setMembers(houseMembers.filter(m => m.uid !== user.uid));

          // Admin Logic
          if (data.admin === user.uid) {
            setIsAdmin(true);
          } else {
            // Check if Admin exists in the house member list
            const adminExists = houseMembers.some(m => m.uid === data.admin);
            // If admin field is null OR the admin ID isn't in the member list anymore...
            if (!data.admin || !adminExists) {
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
    // 1. Modal Confirmation
    const confirmed = await modal.showConfirm("Claim Ownership", "The Family Head position is vacant. Do you want to claim it?");
    if (!confirmed) return;
    
    try {
      // 2. SAFETY CHECK (Restored): Check if someone else claimed it while you were reading
      const houseRef = doc(db, "households", householdId);
      const freshSnap = await getDoc(houseRef);
      const freshData = freshSnap.data();

      if (freshData.admin && freshData.admin !== user.uid) {
         // Verify the new admin is valid
         const adminDoc = await getDoc(doc(db, "users", freshData.admin));
         if (adminDoc.exists() && adminDoc.data().householdId === householdId) {
             modal.showAlert("Too Late", "❌ Someone else just claimed the position!");
             window.location.reload();
             return;
         }
      }

      // 3. Execute Claim
      await updateDoc(houseRef, { admin: user.uid });
      setIsAdmin(true);
      setCanClaimAdmin(false);
      modal.showAlert("Success!", "👑 You are now the Family Head.");
    } catch (err) {
      modal.showAlert("Error", "Could not claim ownership.");
    }
  };

  const handleLeaveHousehold = async () => {
    const confirmed = await modal.showConfirm("Leave Family?", "Are you sure you want to leave? You will lose access to the schedule.");
    if (!confirmed) return;

    try {
      const houseRef = doc(db, "households", householdId);
      
      // ABDICATION LOGIC: If I am admin, I must set admin to null so others can claim it
      if (isAdmin) {
          await updateDoc(houseRef, { members: arrayRemove(user.uid), admin: null });
      } else {
          await updateDoc(houseRef, { members: arrayRemove(user.uid) });
      }

      await updateDoc(doc(db, "users", user.uid), { householdId: null });
      
      await modal.showAlert("Goodbye", "You have left the household.");
      window.location.reload();
    } catch (err) { modal.showAlert("Error", "Could not leave household."); }
  };

  const handleDeleteAccount = async () => {
    const input = await modal.showPrompt(
      "Delete Account", 
      "CRITICAL: This will permanently delete your account. Type 'DELETE' to confirm.", 
      "Type DELETE here..."
    );

    if (input === "DELETE") {
      try {
        if (householdId) {
            // Logic: If Admin deletes account, abdicate throne
            const updates = { members: arrayRemove(user.uid) };
            if (isAdmin) updates.admin = null;
            await updateDoc(doc(db, "households", householdId), updates);
        }
        await deleteDoc(doc(db, "users", user.uid));
        await deleteUser(auth.currentUser);
        await modal.showAlert("Account Deleted", "Your account has been removed.");
      } catch (err) { modal.showAlert("Error", "Could not delete account. Login again and try."); }
    }
  };

  const handleKickMember = async (memberUid, memberName) => {
    const confirmed = await modal.showConfirm("Remove Member", `Are you sure you want to remove ${memberName}?`);
    if (!confirmed) return;

    try {
      await updateDoc(doc(db, "households", householdId), { members: arrayRemove(memberUid) });
      await updateDoc(doc(db, "users", memberUid), { householdId: null });
      setMembers(prev => prev.filter(m => m.uid !== memberUid));
      modal.showAlert("Removed", `${memberName} has been removed.`);
    } catch (err) { modal.showAlert("Error", "Failed to remove member."); }
  };

  const handleDestroyHousehold = async () => {
    const input = await modal.showPrompt(
      "Destroy Household", 
      "🚨 DANGER: This will delete ALL data (medicines, inventory, schedule) for EVERYONE. Type 'DESTROY' to confirm.",
      "Type DESTROY here..."
    );

    if (input === "DESTROY") {
      try {
        const batch = writeBatch(db);
        const houseRef = doc(db, "households", householdId);
        
        // 1. Unlink all members
        const allMemberIds = [...members.map(m => m.uid), user.uid];
        allMemberIds.forEach(uid => {
            batch.update(doc(db, "users", uid), { householdId: null });
        });

        // 2. Cascade Delete: Medicines
        const medsSnap = await getDocs(collection(db, "households", householdId, "medicines"));
        medsSnap.forEach(d => batch.delete(d.ref));
        
        // 3. Cascade Delete: Inventory
        const invSnap = await getDocs(collection(db, "households", householdId, "inventory"));
        invSnap.forEach(d => batch.delete(d.ref));

        // 4. Delete House
        batch.delete(houseRef);
        await batch.commit();
        
        await modal.showAlert("Destroyed", "Household has been deleted.");
        window.location.reload();
      } catch (err) { modal.showAlert("Error", "System error occurred."); }
    }
  };

  if (loading) return <div className="loading-screen">Loading Settings...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <div className="professional-form-card" style={{ maxWidth: '800px', margin: '40px auto' }}>
        <h2 style={{ color: '#1e3a8a', marginBottom: '20px' }}>⚙️ Settings</h2>
        
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#475569' }}>My Account</h3>
          
          {/* CLAIM BUTTON (Visible if admin invalid) */}
          {canClaimAdmin && !isAdmin && (
             <div style={{ padding:'15px', background:'#e0f2fe', borderRadius:'10px', marginBottom:'15px', border:'1px solid #bae6fd' }}>
                <p style={{margin:'0 0 5px 0', color:'#0369a1', fontWeight:'bold'}}>⚠️ No Family Head Assigned</p>
                <p style={{margin:'0 0 15px 0', fontSize:'0.9rem', color:'#0c4a6e'}}>This household has no administrator.</p>
                <button onClick={handleClaimAdmin} style={{padding:'10px 20px', background:'#0284c7', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>
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
              )) : <p style={{ color: '#c2410c', fontStyle:'italic' }}>No other members.</p>}
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