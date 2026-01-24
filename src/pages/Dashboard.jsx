import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../services/firebase"; 
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore"; 
import { getUserMeds } from "../services/medService";
import { getMedicineAlternative } from "../services/aiService"; 
import MedicineCard from "../Components/MedicineCard";
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

export default function Dashboard({ user, householdId, setView }) {
  const [meds, setMeds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I'm your AI Medical Assistant. Need a substitute or info about your meds?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const userName = user?.email?.split('@')[0] || "User";

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
        console.warn("Dashboard: Waiting for householdId...");
        setLoading(false); 
        return; 
      }
      try {
        const data = await getUserMeds(householdId);
        const filteredData = (data || []).filter(m => m.day === todayName);
        setMeds(filteredData);
      } catch (err) {
        console.error("Error loading meds:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [householdId, todayName]);

  const handleAiConsult = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = { role: 'user', text: aiQuery };
    setAiHistory(prev => [...prev, userMsg]);
    setAiQuery("");
    setIsAiLoading(true);
    try {
      const response = await getMedicineAlternative(aiQuery);
      setAiHistory(prev => [...prev, { role: 'bot', text: response }]);
    } catch (err) {
      setAiHistory(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting right now." }]);
    }
    setIsAiLoading(false);
  };

  /**
   * Updated Toggle Logic:
   * 1. Marks medicine as taken in the schedule.
   * 2. Finds matching medicine in the household inventory sub-collection.
   * 3. Decrements quantity by 1 if stock is available.
   */
  const toggleMedStatus = async (medId, currentStatus, medName) => {
    if (currentStatus || medId === "_") return; 

    // Update UI State immediately
    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);

    try {
      // Step A: Update the schedule document
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { 
        taken: true, 
        status: "taken",
        lastUpdated: serverTimestamp() 
      });

      // Step B: Inventory Reduction Logic
      const inventoryRef = collection(db, "households", householdId, "inventory");
      const q = query(inventoryRef, where("medicineName", "==", medName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Find the first batch with available stock
        const stockDoc = querySnapshot.docs[0];
        const stockRef = doc(db, "households", householdId, "inventory", stockDoc.id);
        const currentQty = stockDoc.data().quantity || 0;

        if (currentQty > 0) {
          await updateDoc(stockRef, {
            quantity: currentQty - 1,
            lastUpdated: serverTimestamp()
          });
        } else {
          console.warn(`Insufficient stock for ${medName}`);
        }
      }
    } catch (err) { 
      console.error("Update failed:", err);
      setMeds(meds); // Revert UI if DB fails
    }
  };

  const handleDelete = async (medId) => {
    if (medId === "_") {
      alert("Note: This is an invalid system document. Cleaning it up now.");
    }

    if (window.confirm("Remove this medication?")) {
      try {
        await deleteDoc(doc(db, "households", householdId, "medicines", medId));
        setMeds(prev => prev.filter(m => m.id !== medId));
      } catch (err) { 
        console.error("Delete failed:", err); 
      }
    }
  };

  if (loading) return <div className="loading-screen">✨ Optimizing your health suite...</div>;

  const takenCount = meds.filter(m => m.taken || m.status === "taken").length;
  const totalCount = meds.length;
  const pendingCount = totalCount - takenCount;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <header className="dash-header">
        <div className="welcome-area">
          <h1>{getGreeting()}, <span className="highlight-name">{userName}</span> ✨</h1>
          <p>Schedule for <span className="count-tag">{todayName}</span></p>
        </div>
        
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setView("inventory")}>📦 Stock Manager</button>
          <button className="btn-secondary" onClick={() => setView("calendar")}>🗓️ Calendar</button>
          <button className="btn-add-main" onClick={() => setView("addMed")}>+ Add Medicine</button>
        </div>
      </header>

      <div className="main-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
        <aside className="left-panel">
          <motion.div whileHover={{ scale: 1.02 }} className="glass-inner adherence-box">
            <h3 className="panel-title">Daily Adherence</h3>
            <ProgressRing taken={takenCount} total={totalCount} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
          </motion.div>
        </aside>

        <main className="schedule-panel glass-inner">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => (
                <MedicineCard 
                  key={med.id} 
                  name={med.name || "Unknown Medicine"} 
                  dose={med.dosage || med.dose || "N/A"} 
                  status={med.taken || med.status === "taken" ? "Taken" : "Pending"} 
                  onToggle={() => toggleMedStatus(med.id, med.taken, med.name)} 
                  onDelete={() => handleDelete(med.id)}
                />
              ))
            ) : (
              <div className="empty-state">No meds for {todayName}! Take a break. 🌿</div>
            )}
          </div>
        </main>
      </div>

      <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
        🤖 Ask Gemini
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="chat-overlay" 
              onClick={() => setIsChatOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="chat-side-panel glass-inner"
            >
              <div className="panel-header-ai">
                <h4 className="ai-title">🤖 Gemini Consultant</h4>
                <button className="close-panel-btn" onClick={() => setIsChatOpen(false)}>✕</button>
              </div>
              <div className="chat-window">
                {aiHistory.map((msg, i) => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`chat-bubble ${msg.role}`}>
                    {msg.text}
                  </motion.div>
                ))}
                {isAiLoading && <p className="loading-text">Thinking...</p>}
              </div>
              <div className="chat-input-area">
                <input 
                  value={aiQuery} 
                  onChange={(e) => setAiQuery(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleAiConsult()}
                  placeholder="Ask about substitutes..." 
                />
                <button onClick={handleAiConsult}>Send</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}