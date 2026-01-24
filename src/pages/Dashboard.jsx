import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../services/firebase"; 
import { doc, updateDoc, deleteDoc } from "firebase/firestore"; 
import { getUserMeds } from "../services/medService";
import { getMedicineAlternative } from "../services/aiService"; 
import MedicineCard from "../Components/MedicineCard";
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

export default function Dashboard({ user, householdId, setView }) {
  const [meds, setMeds] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I'm your AI Medical Assistant. Need a substitute or info about your meds?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const userName = user?.email?.split('@')[0] || "User";

  // Dynamic Greeting Logic
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
      if (!householdId) { setLoading(false); return; }
      try {
        const data = await getUserMeds(householdId);
        // FEATURE PRESERVED: Day-wise filtering
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

  const toggleMedStatus = async (medId, currentStatus) => {
    if (currentStatus) return; 
    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);
    try {
      // FEATURE PRESERVED: Firestore update
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { taken: true, status: "taken" });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (medId) => {
    if (window.confirm("Remove this medication?")) {
      try {
        // FEATURE PRESERVED: Deletion logic
        await deleteDoc(doc(db, "households", householdId, "medicines", medId));
        setMeds(prev => prev.filter(m => m.id !== medId));
      } catch (err) { console.error("Delete failed:", err); }
    }
  };

  if (loading) return <div className="loading-screen">✨ Optimizing your health suite...</div>;

  const takenCount = meds.filter(m => m.taken || m.status === "taken").length;
  const totalCount = meds.length;
  const pendingCount = totalCount - takenCount;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="dashboard-wrapper"
    >
      <header className="dash-header">
        <motion.div 
          initial={{ x: -50 }} 
          animate={{ x: 0 }} 
          className="welcome-area"
        >
          <h1>{getGreeting()}, <span className="highlight-name">{userName}</span> ✨</h1>
          <p>Schedule for <span className="count-tag">{todayName}</span></p>
        </motion.div>
        
        {/* FIX APPLIED: Button alignment wrapper */}
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setView("calendar")}>
            🗓️ Calendar
          </button>
          <button className="btn-add-main" onClick={() => setView("addMed")}>
            + Add Medicine
          </button>
        </div>
      </header>

      <div className="main-grid">
        {/* LEFT PANEL: Progress & AI */}
        <aside className="left-panel">
          <motion.div whileHover={{ scale: 1.02 }} className="glass-inner adherence-box">
            <h3 className="panel-title">Daily Adherence</h3>
            <ProgressRing taken={takenCount} total={totalCount} />
            <div className="stat-mini-row">
               <div className="mini-box"><strong>{pendingCount}</strong><p>Pending</p></div>
               <div className="mini-box"><strong>{takenCount}</strong><p>Taken</p></div>
            </div>
          </motion.div>

          {/* FIX APPLIED: Refined AI Consultant layout */}
          <div className="ai-chat-card glass-inner">
            <h4 className="ai-title">🤖 Gemini Consultant</h4>
            <div className="chat-window">
              <AnimatePresence initial={false}>
                {aiHistory.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i} 
                    className={`chat-bubble ${msg.role}`}
                  >
                    {msg.text}
                  </motion.div>
                ))}
              </AnimatePresence>
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
          </div>
        </aside>

        {/* RIGHT PANEL: The Med List */}
        <main className="schedule-panel glass-inner">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>

          <motion.div layout className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => (
                <motion.div layout key={med.id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <MedicineCard 
                    name={med.name} 
                    dose={med.dosage || med.dose} 
                    status={med.taken || med.status === "taken" ? "Taken" : "Pending"} 
                    onToggle={() => toggleMedStatus(med.id, med.taken)} 
                    onDelete={() => handleDelete(med.id)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="empty-state">No meds for {todayName}! Take a break. 🌿</div>
            )}
          </motion.div>
        </main>
      </div>

      {pendingCount > 2 && (
        <motion.div 
          initial={{ y: 100 }} 
          animate={{ y: 0 }} 
          className="emergency-toast"
        >
          🚨 {pendingCount} doses are still pending!
        </motion.div>
      )}
    </motion.div>
  );
}