import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown'; 
import { db } from "../services/firebase"; 
import { 
  doc, updateDoc, deleteDoc, serverTimestamp, collection, query, where, getDocs 
} from "firebase/firestore"; 
import { getUserMeds } from "../services/medService";
import { getMedicineAlternative } from "../services/aiService"; 
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

export default function Dashboard({ user, userName, householdId, setView, targetUid, isMonitoring }) {
  const [meds, setMeds] = useState([]); 
  const [lowStock, setLowStock] = useState([]); 
  const [activityLog, setActivityLog] = useState([]); // NEW: Activity Feed
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I know your schedule. Ask me about side effects, interactions, or food advice!" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const displayGreeting = userName || "User";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { 
        setLoading(false); 
        return; 
      }
      try {
        // 1. Fetch Schedule for TARGET USER
        const data = await getUserMeds(householdId, targetUid); // Pass targetUid
        const filteredData = (data || []).filter(m => m.day === todayName);
        setMeds(filteredData);

        // 2. Fetch Global Inventory
        const invRef = collection(db, "households", householdId, "inventory");
        const invSnap = await getDocs(invRef);
        const lowItems = invSnap.docs
          .map(d => d.data())
          .filter(item => Number(item.quantity) <= 5); 
        setLowStock(lowItems);

        // 3. Generate Activity Log (Simulated from taken status)
        const recentActivity = data
            .filter(m => m.taken)
            // Sort by a generic timestamp for simulation if lastUpdated isn't strictly set on all
            .sort((a, b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0))
            .slice(0, 5);
        setActivityLog(recentActivity);

      } catch (err) {
        console.error("Error loading data:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [householdId, todayName, targetUid]); // Re-fetch when target changes

  // --- SMART AI HANDLER ---
  const handleAiConsult = async (directQuery = null) => {
    const queryText = typeof directQuery === 'string' ? directQuery : aiQuery;
    if (!queryText.trim()) return;
    if (directQuery) setIsChatOpen(true);

    const userMsg = { role: 'user', text: queryText };
    setAiHistory(prev => [...prev, userMsg]);
    setAiQuery(""); 
    setIsAiLoading(true);

    const medListString = meds.length > 0 
      ? meds.map(m => `${m.name} (${m.dosage || 'unknown dose'})`).join(", ")
      : "No active medications currently scheduled for today.";

    const fullContextPrompt = `
      CONTEXT: The user is a patient taking the following medications today: [${medListString}].
      USER QUESTION: ${queryText}
      INSTRUCTION: Answer the user's question specifically regarding the medications listed above if relevant. Keep it concise.
    `;

    try {
      const response = await getMedicineAlternative(fullContextPrompt);
      setAiHistory(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setAiHistory(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    }
    setIsAiLoading(false);
  };

  const toggleMedStatus = async (medId, currentStatus, medName) => {
    if (currentStatus || medId === "_") return; 
    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);
    try {
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { taken: true, status: "taken", lastUpdated: serverTimestamp() });
      
      const inventoryRef = collection(db, "households", householdId, "inventory");
      const q = query(inventoryRef, where("medicineName", "==", medName));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const stockDoc = querySnapshot.docs[0];
        const stockRef = doc(db, "households", householdId, "inventory", stockDoc.id);
        const currentQty = stockDoc.data().quantity || 0;
        if (currentQty > 0) {
          await updateDoc(stockRef, { quantity: currentQty - 1, lastUpdated: serverTimestamp() });
        }
      }
    } catch (err) { console.error(err); setMeds(meds); }
  };

  const handleDelete = async (medId) => {
    if (window.confirm("Remove this medication?")) {
      try {
        await deleteDoc(doc(db, "households", householdId, "medicines", medId));
        setMeds(prev => prev.filter(m => m.id !== medId));
      } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div className="loading-screen">✨ Optimizing your health suite...</div>;

  const takenCount = meds.filter(m => m.taken || m.status === "taken").length;
  const totalCount = meds.length;
  const pendingCount = totalCount - takenCount;
  const nextUpMed = meds.find(m => !m.taken && m.status !== "taken");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      
      <header className="dash-header">
        <div className="welcome-area">
          <h1>
            {isMonitoring ? "👁️ Monitoring" : "Good Morning,"} <span className="highlight-name">{displayGreeting}</span> ✨
            {isMonitoring && <span style={{display:'block', fontSize:'0.5em', color:'#64748b', marginTop:'5px'}}>ADMIN MODE ACTIVE</span>}
          </h1>
          <p>Schedule for <span className="count-tag">{todayName}</span></p>
        </div>
      </header>

      <div className="main-grid">
        <aside className="left-panel">
          
          <motion.div whileHover={{ scale: 1.02 }} className="glass-inner adherence-box">
            <h3 className="panel-title">{isMonitoring ? "Their Progress" : "Daily Adherence"}</h3>
            <ProgressRing taken={takenCount} total={totalCount} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
          </motion.div>

          {/* INNOVATION: ACTIVITY LOG (Shown only when monitoring) */}
          {isMonitoring ? (
            <div className="glass-inner" style={{ padding: '20px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>📋 Activity Log</h4>
              {activityLog.length > 0 ? (
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                  {activityLog.map(log => (
                    <li key={log.id} style={{ marginBottom: '8px' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>Taken:</span> {log.name}
                    </li>
                  ))}
                </ul>
              ) : <p style={{fontSize:'0.9rem', color: '#94a3b8', fontStyle:'italic'}}>No activity recorded today.</p>}
            </div>
          ) : (
            /* STANDARD WIDGETS (Shown for normal user) */
            <>
              {lowStock.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-inner"
                  style={{ background: 'rgba(254, 226, 226, 0.95)', border: '1px solid #fecaca' }}
                >
                  <h4 style={{ margin: '0 0 10px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Low Stock Warning
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '0.9rem' }}>
                    {lowStock.slice(0, 3).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}><b>{item.medicineName}</b> ({item.quantity})</li>
                    ))}
                  </ul>
                  <button onClick={() => setView("inventory")} style={{ marginTop: '12px', background: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', color: '#b91c1c', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}>Refill Inventory</button>
                </motion.div>
              )}

              <div className="glass-inner" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>⚡ Quick Ask Gemini</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleAiConsult("Side effects?")} style={{ textAlign: 'left', padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>💊 Side Effects?</button>
                    <button onClick={() => handleAiConsult("Food interactions?")} style={{ textAlign: 'left', padding: '10px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>🥦 Food Interactions?</button>
                  </div>
              </div>

              <div className="glass-inner" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>📞 Emergency Hub</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button style={{ padding: '12px', borderRadius: '12px', background: '#dcfce7', color: '#166534', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Doctor</button>
                    <button style={{ padding: '12px', borderRadius: '12px', background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: '700', cursor: 'pointer' }}>SOS</button>
                  </div>
              </div>
            </>
          )}

        </aside>

        <main className="schedule-panel glass-inner">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {nextUpMed ? (
             <div style={{ 
               marginBottom: '25px', padding: '20px', borderRadius: '20px', 
               background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white',
               boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', position: 'relative', overflow: 'hidden'
             }}>
                <div style={{ position: 'absolute', top: -10, right: -10, width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}></div>
                <span style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Up Next</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{nextUpMed.name}</h2>
                    <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '1rem' }}>{nextUpMed.dosage || "Standard Dose"} • {nextUpMed.time || "Scheduled"}</p>
                  </div>
                  <div style={{ fontSize: '2.5rem', background: 'rgba(255,255,255,0.2)', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>💊</div>
                </div>
                <button onClick={() => toggleMedStatus(nextUpMed.id, false, nextUpMed.name)} style={{ marginTop: '15px', background: 'white', color: '#2563eb', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: '700', cursor: 'pointer', width: '100%' }}>Mark as Taken</button>
             </div>
          ) : (
            meds.length > 0 && takenCount === totalCount && (
              <div style={{ marginBottom: '20px', padding: '20px', borderRadius: '16px', background: '#dcfce7', color: '#166534', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: 0 }}>🎉 All Done!</h3>
                <p style={{ margin: '5px 0 0 0' }}>You've taken all your meds for today.</p>
              </div>
            )
          )}
          
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => {
                const isTaken = med.taken || med.status === "taken";
                return (
                  <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={med.id} className={`med-row-card ${isTaken ? 'is-taken' : ''}`}>
                    <div className="med-main-content">
                      <div className="checkbox-wrapper" onClick={() => toggleMedStatus(med.id, isTaken, med.name)}>
                        <div className="custom-checkbox">{isTaken && <span>✓</span>}</div>
                      </div>
                      <div className="med-details">
                        <h4 className={isTaken ? 'strikethrough' : ''}>{med.name}</h4>
                        <p>{med.dosage || med.dose || "Standard Dose"}</p>
                      </div>
                    </div>
                    {/* Allow deleting only if NOT monitoring, or allow admin override if desired. Currently allowing all for simplicity. */}
                    <button className="delete-med-btn" onClick={() => handleDelete(med.id)} title="Remove medicine">🗑️</button>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">No medicines scheduled for {todayName}! 🌿</div>
            )}
          </div>
        </main>
      </div>

      {/* Hide AI Chat if monitoring to reduce clutter */}
      {!isMonitoring && (
        <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>🤖 Ask Gemini</button>
      )}

      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="chat-overlay" onClick={() => setIsChatOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }} className="chat-side-panel glass-inner">
              <div className="panel-header-ai">
                <h4 className="ai-title">🤖 Gemini Consultant</h4>
                <button className="close-panel-btn" onClick={() => setIsChatOpen(false)}>✕</button>
              </div>
              <div className="chat-window">
                {aiHistory.map((msg, i) => (
                  <motion.div key={i} className={`chat-bubble ${msg.role}`}><ReactMarkdown>{msg.text}</ReactMarkdown></motion.div>
                ))}
                {isAiLoading && <p className="loading-text">Gemini is thinking...</p>}
              </div>
              <div className="chat-input-area">
                <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAiConsult()} placeholder="Ask about dosage, substitutes..." />
                <button onClick={() => handleAiConsult()}>Send</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}