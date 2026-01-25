import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css"; 

export default function SwitchUser({ householdId, setView, currentUser }) {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const fetchFamily = async () => {
      if (!householdId) return;
      try {
        const q = query(collection(db, "users"), where("householdId", "==", householdId));
        const snapshot = await getDocs(q);
        const members = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setFamilyMembers(members);
      } catch (err) {
        console.error("Error fetching family:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFamily();
  }, [householdId]);

  const handleSafeSwitch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    
    try {
      // 1. Attempt Login
      await signInWithEmailAndPassword(auth, selectedUser.email, password);
      
      // 2. CRITICAL FIX: Force redirection to Dashboard immediately
      setView("dashboard"); 
      
    } catch (err) {
      console.error(err);
      setAuthError("Wrong password.");
      setLoading(false); // Stop loading so they can try again
    }
  }

  return (
    <div className="dashboard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="professional-form-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        
        {!selectedUser ? (
          /* STATE A: LIST OF USERS */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ color: '#1e3a8a', marginBottom: '10px' }}>Who is logging in?</h2>
            <p style={{ color: '#64748b', marginBottom: '30px' }}>Select your profile to switch quickly.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '20px' }}>
              {familyMembers.map((member) => (
                <div 
                  key={member.uid} 
                  onClick={() => setSelectedUser(member)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '15px', 
                    borderRadius: '16px', 
                    background: member.uid === currentUser.uid ? '#eff6ff' : 'white',
                    border: member.uid === currentUser.uid ? '2px solid #2563eb' : '1px solid #e2e8f0',
                    transition: 'transform 0.2s'
                  }}
                  className="user-card-hover"
                >
                  <div style={{ 
                    width: '50px', height: '50px', background: '#3b82f6', color: 'white', 
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', margin: '0 auto 10px auto', fontWeight: 'bold'
                  }}>
                    {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.9rem' }}>
                    {member.name || "User"}
                    {member.uid === currentUser.uid && " (You)"}
                  </h4>
                </div>
              ))}

              {/* Add New Account Option */}
              <div 
                onClick={() => auth.signOut()}
                style={{ cursor: 'pointer', padding: '15px', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '1.5rem', color: '#64748b' }}>+</span>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Log into another</span>
              </div>
            </div>
            
            <button className="btn-secondary" style={{ marginTop: '30px' }} onClick={() => setView("dashboard")}>
              Cancel
            </button>
          </motion.div>
        ) : (
          /* STATE B: PASSWORD INPUT FOR SELECTED USER */
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
             <div style={{ 
                width: '60px', height: '60px', background: '#3b82f6', color: 'white', 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 15px auto', fontWeight: 'bold'
              }}>
              {selectedUser.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3 style={{ color: '#1e3a8a', marginBottom: '5px' }}>Hello, {selectedUser.name}</h3>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>Please enter your password to switch.</p>

            <form onSubmit={handleSafeSwitch}>
              <input 
                type="password" 
                className="pro-input" 
                autoFocus
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '2px' }}
              />
              
              {authError && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{authError}</p>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSelectedUser(null); setAuthError(""); }}>
                  Back
                </button>
                <button type="submit" className="btn-add-main" style={{ flex: 1, justifyContent: 'center' }} disabled={loading}>
                  {loading ? "Switching..." : "Login"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}