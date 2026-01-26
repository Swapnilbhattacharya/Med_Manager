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
  const [stockMap, setStockMap] = useState({}); 
  const [lowStock, setLowStock] = useState([]); 
  const [activityLog, setActivityLog] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stockHealth, setStockHealth] = useState({ expired: 0, soon: 0, healthy: 0 });
  
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I know your schedule. Ask me about side effects, interactions, or food advice!" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const displayGreeting = userName || "User";
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[new Date().getDay()];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { 
        setLoading(false); 
        return; 
      }
      try {
        const data = await getUserMeds(householdId, targetUid); 
        const filteredData = (data || [])
          .filter(m => m.day === todayName)
          .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
        setMeds(filteredData);

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
            if (expiry < today) {
              expiredCount++;
            } else if (expiry <= thirtyDaysFromNow) {
              soonCount++;
            } else {
              healthyCount++;
            }
          }

          if (qty > 0) {
            map[normName] = (map[normName] || 0) + qty;
          }
        });

        Object.keys(map).forEach(key => {
            if (map[key] <= 5) lowItems.push({ name: key.toUpperCase(), qty: map[key] });
        });

        setStockMap(map);
        setLowStock(lowItems);
        setStockHealth({ expired: expiredCount, soon: soonCount, healthy: healthyCount });

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

  // --- UPDATED CONSUMPTION LOGIC: Added medDosage ---
  const toggleMedStatus = async (medId, currentStatus, medName, medDosage) => {
    if (medId === "_") return;

    const normName = (medName || "").trim().toLowerCase();
    const currentStock = stockMap[normName] || 0;

    if (!currentStatus && currentStock <= 0) {
        alert(`❌ Out of Stock! "${medName}" is not available in the inventory.`);
        return;
    }

    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);

    try {
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { taken: true, status: "taken", lastUpdated: serverTimestamp() });
      
      if (!currentStatus) {
        const invRef = collection(db, "households", householdId, "inventory");
        
        // THE CRITICAL FIX: Query by name AND dosage
        const q = query(
          invRef, 
          where("medicineName", "==", medName),
          where("dosage", "==", Number(medDosage))
        ); 
        
        const querySnapshot = await getDocs(q);

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

            setStockMap(prev => ({
                ...prev,
                [normName]: prev[normName] - 1
            }));
        }
      }
    } catch (err) { console.error(err); setMeds(meds); }
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
          <h1>
            {isMonitoring ? "👁️ Monitoring" : "Good Morning,"} <span className="highlight-name">{displayGreeting}</span> ✨
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

          {/* STOCK HEALTH SECTION (Remains exactly the same) */}
          <div className="glass-inner" style={{ marginBottom: '0px', padding: '20px', position: 'relative' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>📊 Stock Health</h4>
            <h6 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>Click on the button for detailed expiry analysis report</h6>
            <motion.div whileHover="active" onClick={() => setView("StockAnalysis")} style={{ cursor: 'pointer', position: 'relative', borderRadius: '16px' }}>
              <motion.div variants={{ active: { scale: 1.02 } }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                <div style={{ background: '#fee2e2', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #ef4444' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>{stockHealth.expired}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#991b1b', textTransform: 'uppercase' }}>Expired</span>
                </div>
                <div style={{ background: '#fef3c7', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #f59e0b' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#f59e0b' }}>{stockHealth.soon}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase' }}>Soon</span>
                </div>
                <div style={{ background: '#dcfce7', padding: '10px 5px', borderRadius: '12px', borderBottom: '3px solid #10b981' }}>
                  <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>{stockHealth.healthy}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: '700', color: '#166534', textTransform: 'uppercase' }}>Healthy</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* EMERGENCY & AI BUTTONS (Style preserved) */}
          {!isMonitoring && (
            <>
              <div className="glass-inner" style={{ padding: '20px' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>⚡ Quick Ask Gemini</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => handleAiConsult("Side effects?")} className="btn-secondary" style={{ textAlign: 'left', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)', fontWeight: '600' }}>💊 Side Effects?</button>
                  </div>
              </div>
            </>
          )}
        </aside>

        <main className="schedule-panel glass-inner">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          {/* UP NEXT CARD: Pass nextUpMed.dosage */}
          {nextUpMed && (
             <div style={{ marginBottom: '25px', padding: '20px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: 'white' }}>
                <h2 style={{ margin: 0 }}>{nextUpMed.name}</h2>
                <p>{nextUpMed.dosage}mg • {nextUpMed.time}</p>
                <button 
                  onClick={() => toggleMedStatus(nextUpMed.id, false, nextUpMed.name, nextUpMed.dosage)} 
                  style={{ marginTop: '15px', background: 'white', color: '#2563eb', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: '700', cursor: 'pointer', width: '100%' }}
                >
                  Mark as Taken
                </button>
             </div>
          )}
          
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => {
                const isTaken = med.taken || med.status === "taken";
                const normName = (med.name || "").trim().toLowerCase();
                const stockQty = stockMap[normName] || 0;
                const isDisabled = !isTaken && stockQty <= 0;

                return (
                  <motion.div layout key={med.id} className={`med-row-card ${isTaken ? 'is-taken' : ''}`}>
                    <div className="med-main-content">
                      <div 
                        className="checkbox-wrapper" 
                        // PASS med.dosage HERE
                        onClick={() => !isDisabled && toggleMedStatus(med.id, isTaken, med.name, med.dosage)}
                      >
                        <div className="custom-checkbox">{isTaken && <span>✓</span>}</div>
                      </div>
                      <div className="med-details">
                        <h4 className={isTaken ? 'strikethrough' : ''}>{med.name}</h4>
                        <p>{med.dosage}mg</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">No medicines scheduled! 🌿</div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isChatOpen && (
           <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="chat-side-panel glass-inner">
              {/* Chat Content */}
           </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}