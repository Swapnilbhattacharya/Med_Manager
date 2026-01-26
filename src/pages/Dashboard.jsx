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

// --- 🌟 DAILY MOTIVATION BANK 🌟 ---
const MOTIVATIONAL_QUOTES = [
  "The greatest wealth is health. 🌿",
  "Take care of your body. It’s the only place you have to live.",
  "Health is a relationship between you and your body.",
  "Small steps every day lead to big results. 🚀",
  "Your health is an investment, not an expense.",
  "Consistency is the key to recovery.",
  "A healthy outside starts from the inside. 🍎",
  "Don't wish for it, work for it.",
  "Self-care is how you take your power back.",
  "Healing takes time, and asking for help is a courageous step.",
  "Every pill taken is a step towards a better you.",
  "Wellness is the complete integration of body, mind, and spirit.",
  "Today is another chance to get stronger.",
  "Rest when you're weary. Refresh and renew your body.",
  "Listen to your body, it knows what it needs."
];

export default function Dashboard({ user, userName, householdId, setView, targetUid, isMonitoring }) {
  const [meds, setMeds] = useState([]); 
  const [stockMap, setStockMap] = useState({}); 
  const [lowStock, setLowStock] = useState([]); 
  const [activityLog, setActivityLog] = useState([]); 
  const [stockHealth, setStockHealth] = useState({ expired: 0, soon: 0, healthy: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI & AI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I know your schedule. Ask me about side effects, interactions, or food advice!" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("");

  const displayGreeting = userName || "User";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  const getGreeting = () => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  };

  useEffect(() => {
    // 1. Pick Daily Quote
    const dayOfMonth = new Date().getDate();
    const quoteIndex = dayOfMonth % MOTIVATIONAL_QUOTES.length;
    setDailyQuote(MOTIVATIONAL_QUOTES[quoteIndex]);

    const loadData = async () => {
      if (!householdId) { 
        setLoading(false); 
        return; 
      }
      try {
        // 2. Fetch Schedule
        const data = await getUserMeds(householdId, targetUid); 
        const filteredData = (data || [])
          .filter(m => m.day === todayName)
          .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        setMeds(filteredData);

        // 3. Fetch Inventory & Stats
        const invRef = collection(db, "households", householdId, "inventory");
        const invSnap = await getDocs(invRef);
        
        const map = {};
        const lowItems = [];
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        let expiredCount = 0;
        let soonCount = 0;
        let healthyCount = 0;

        invSnap.docs.forEach(doc => {
          const item = doc.data();
          const qty = Number(item.quantity) || 0;
          const normName = (item.medicineName || "").trim().toLowerCase();
          
          if (item.expiryDate) {
            const expiry = new Date(item.expiryDate);
            if (expiry < today) expiredCount++;
            else if (expiry <= thirtyDaysFromNow) soonCount++;
            else healthyCount++;
          }

          if (qty > 0) map[normName] = (map[normName] || 0) + qty;
        });

        // Low Stock Logic
        Object.keys(map).forEach(key => {
            if (map[key] <= 5) lowItems.push({ name: key.toUpperCase(), qty: map[key] });
        });

        setStockMap(map);
        setLowStock(lowItems);
        setStockHealth({ expired: expiredCount, soon: soonCount, healthy: healthyCount });

        // 4. Activity Log
        const recentActivity = data
            .filter(m => m.taken)
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
  }, [householdId, todayName, targetUid]); 

  // --- ACTIONS ---
  const toggleMedStatus = async (medId, currentStatus, medName) => {
    if (medId === "_") return;
  
    // 1. Get the specific dosage from the med object (ensure it's a number)
    const targetMed = meds.find(m => m.id === medId);
    const dosageNum = Number(targetMed?.dosage);
    const normName = (medName || "").trim().toLowerCase();
    
    // Note: Your stockMap key logic might need refinement if you want 
    // the UI to show stock per dosage, but for the DB update:
    const currentStock = stockMap[normName] || 0;
  
    if (!currentStatus && currentStock <= 0) {
        alert(`❌ Out of Stock! "${medName}" is not available.`);
        return;
    }

    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
  setMeds(updatedMeds);

  try {
    const medRef = doc(db, "households", householdId, "medicines", medId);
    await updateDoc(medRef, { taken: true, status: "taken", lastUpdated: serverTimestamp() });
    
    if (!currentStatus) {
      const invRef = collection(db, "households", householdId, "inventory");
      
      // --- THE CRITICAL FIX: Query by BOTH Name and Dosage ---
      const q = query(
        invRef, 
        where("medicineName", "==", medName.trim().toUpperCase()), // Matches AddMed format
        where("dosage", "==", dosageNum) // Matches AddMed format
      ); 

      const querySnapshot = await getDocs(q);

      // Filter and sort to find the oldest batch with stock
      const batches = querySnapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(b => Number(b.quantity) > 0)
          .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

      if (batches.length > 0) {
          const targetBatch = batches[0]; 
          const stockRef = doc(db, "households", householdId, "inventory", targetBatch.id);
          
          await updateDoc(stockRef, { 
              quantity: Number(targetBatch.quantity) - 1,
              lastUpdated: serverTimestamp() 
          });

          // Update local stockMap state
          setStockMap(prev => ({ ...prev, [normName]: prev[normName] - 1 }));
      } else {
          console.error("No matching inventory found for this specific dosage.");
      }
    }
  } catch (err) { 
    console.error(err); 
    setMeds(meds); // Rollback UI on error
  }
};

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
      : "No active medications.";

    const fullContextPrompt = `CONTEXT: Patient meds: [${medListString}]. USER QUESTION: ${queryText}`;

    try {
      const response = await getMedicineAlternative(fullContextPrompt);
      setAiHistory(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setAiHistory(prev => [...prev, { role: 'bot', text: "Connection error." }]);
    }
    setIsAiLoading(false);
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
  const nextUpMed = meds.find(m => !m.taken && (stockMap[(m.name||"").toLowerCase()] || 0) > 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      
      <header className="dash-header">
        <div className="welcome-area">
          <h1 style={{ marginBottom: '5px' }}>
            {isMonitoring ? "👁️ Monitoring" : getGreeting() + ","} <span className="highlight-name">{displayGreeting}</span> ✨
            {isMonitoring && <span style={{display:'block', fontSize:'0.5em', color:'#64748b', marginTop:'5px'}}>ADMIN MODE ACTIVE</span>}
          </h1>
          {/* QUOTE PILL */}
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="daily-quote-pill"
          >
            💡 {dailyQuote}
          </motion.div>
        </div>
      </header>

      <div className="main-grid">
        <aside className="left-panel">
          
          {/* ADHERENCE RING */}
          <motion.div whileHover={{ scale: 1.02 }} className="glass-inner adherence-box">
            <h3 className="panel-title">{isMonitoring ? "Their Progress" : "Daily Adherence"}</h3>
            <ProgressRing taken={takenCount} total={totalCount} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
          </motion.div>

          {/* INTERACTIVE STOCK HEALTH WIDGET */}
          <div className="glass-inner" style={{ padding: '20px', position: 'relative' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>📊 Stock Health</h4>
            <h6 style={{ margin: '0 0 15px 0', color: '#64748b', fontSize:'0.75rem', fontWeight:'600' }}>Click below for analysis report</h6>
            
            <motion.div 
              whileHover="active"
              onClick={() => setView("StockAnalysis")} 
              style={{ cursor: 'pointer', position: 'relative', borderRadius: '16px' }}
            >
              {/* Content Grid */}
              <motion.div 
                variants={{ active: { scale: 1.02 } }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center', transition: { duration: 0.2 } }}
              >
                <motion.div whileHover={{ scale: 1.1 }} style={{ background: '#fee2e2', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #ef4444' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>{stockHealth.expired}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>Expired</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} style={{ background: '#fef3c7', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #f59e0b' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>{stockHealth.soon}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Soon</span>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1 }} style={{ background: '#dcfce7', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #10b981' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{stockHealth.healthy}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Healthy</span>
                </motion.div>
              </motion.div>

              {/* Floating Tooltip */}
              <motion.div
                variants={{ initial: { opacity: 0, y: 10, scale: 0.9 }, active: { opacity: 1, y: -45, scale: 1 } }}
                initial="initial"
                style={{
                  position: 'absolute', top: '50%', left: '50%', x: '-50%', 
                  background: '#1e293b', color: 'white', padding: '8px 14px',
                  borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700',
                  whiteSpace: 'nowrap', boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  zIndex: 10, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <span>View Expiry Report</span>
                <span style={{ fontSize: '1rem' }}>📋</span>
                <div style={{ position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b' }} />
              </motion.div>
            </motion.div>
          </div>

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
            <>
              {lowStock.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass-inner"
                  style={{ background: '#fff1f2', border: '1px solid #fda4af' }}
                >
                  <h4 style={{ margin: '0 0 10px 0', color: '#be123c' }}>⚠️ Low Stock Warning</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d', fontSize: '0.9rem' }}>
                    {lowStock.slice(0, 3).map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}><b>{item.name}</b> (Qty: {item.qty})</li>
                    ))}
                  </ul>
                  <button onClick={() => setView("inventory")} style={{ marginTop: '15px', background: 'white', border: 'none', padding: '10px 16px', borderRadius: '12px', color: '#b91c1c', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}>Refill Inventory</button>
                </motion.div>
              )}

              <div className="glass-inner" style={{ padding: '24px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>⚡ Quick Ask Gemini</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleAiConsult("Side effects?")} className="quick-action-btn">💊 Side Effects?</button>
                    <button onClick={() => handleAiConsult("Food interactions?")} className="quick-action-btn">🥦 Food Interactions?</button>
                  </div>
              </div>

              <div className="glass-inner" style={{ padding: '24px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>📞 Emergency Hub</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button style={{ padding: '12px', borderRadius: '16px', background: '#dcfce7', color: '#166534', border: 'none', fontWeight: '700', cursor: 'pointer' }}>Doctor</button>
                    <button style={{ padding: '12px', borderRadius: '16px', background: '#fee2e2', color: '#991b1b', border: 'none', fontWeight: '700', cursor: 'pointer' }}>SOS</button>
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

          {/* UP NEXT BLUE CARD */}
          {nextUpMed ? (
             <div className="up-next-card">
                <div className="up-next-circle-decor"></div>
                <span className="up-next-badge">Up Next</span>
                
                <div className="up-next-content">
                  <div>
                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800' }}>{nextUpMed.name}</h2>
                    <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '1.1rem' }}>
                      {nextUpMed.dosage || "Standard Dose"} • {nextUpMed.time || "Scheduled"}
                    </p>
                  </div>
                  <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>💊</div>
                </div>
                
                <button 
                  className="up-next-btn"
                  onClick={() => toggleMedStatus(nextUpMed.id, false, nextUpMed.name)}
                >
                  Mark as Taken
                </button>
             </div>
          ) : (
            meds.length > 0 && takenCount === totalCount && (
              <div style={{ marginBottom: '20px', padding: '25px', borderRadius: '24px', background: '#dcfce7', color: '#166534', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>🎉 All Done!</h3>
                <p style={{ margin: '5px 0 0 0' }}>You've taken all your meds for today.</p>
              </div>
            )
          )}
          
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => {
                const isTaken = med.taken || med.status === "taken";
                const normName = (med.name || "").trim().toLowerCase();
                const stockQty = stockMap[normName] || 0;
                const isDisabled = !isTaken && stockQty <= 0;

                return (
                  <motion.div 
                    layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    key={med.id} 
                    className={`med-row-card ${isTaken ? 'is-taken' : ''}`}
                    style={isDisabled ? { opacity: 0.6, background: '#f8fafc' } : {}}
                  >
                    <div className="med-main-content">
                      <div 
                        className="checkbox-wrapper" 
                        onClick={() => !isDisabled && toggleMedStatus(med.id, isTaken, med.name)}
                        style={isDisabled ? { cursor: 'not-allowed', borderColor: '#e2e8f0', background: '#e2e8f0' } : {}}
                      >
                        <div className="custom-checkbox">{isTaken && <span>✓</span>}</div>
                      </div>
                      <div className="med-details">
                        <h4 className={isTaken ? 'strikethrough' : ''}>
                          {med.name}
                          {isDisabled && (
                            <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', verticalAlign:'middle' }}>OUT OF STOCK</span>
                          )}
                        </h4>
                        <p>{med.dosage || "Standard Dose"}</p>
                      </div>
                    </div>
                    <button className="delete-med-btn" onClick={() => handleDelete(med.id)} title="Remove medicine">🗑️</button>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">No medicines scheduled for {todayName}! 🌿</div>
            )}
          </div>

          {/* CONTACT & SUPPORT FOOTER */}
          <div style={{ marginTop: '40px', borderTop: '2px dashed #e2e8f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', color: '#64748b', fontSize: '0.9rem' }}>
            <h5 style={{ margin: 0, color: '#3b82f6', fontSize: '0.95rem' }}>🛠️ For Support & Queries contact</h5>
            <div><span style={{ fontWeight: '600' }}>Phn: </span><span style={{ color: '#1e293b' }}>9830193679</span></div>
            <div><span style={{ fontWeight: '600' }}>E-mail: </span><a href="mailto:medmanagersupport@gmail.com" style={{ color: '#1e293b', textDecoration: 'none' }}>medmanagersupport@gmail.com</a></div>
          </div>

        </main>
      </div>

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