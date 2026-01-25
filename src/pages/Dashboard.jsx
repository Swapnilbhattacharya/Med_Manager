import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown'; 
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
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

// ACCEPT userName PROP HERE
export default function Dashboard({ user, userName, householdId, setView }) {
  const [meds, setMeds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Hello! I'm your AI Medical Assistant. Need a substitute or info about your meds?" }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Use the name passed from App.jsx, fallback to 'User'
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

  const toggleMedStatus = async (medId, currentStatus, medName) => {
    if (currentStatus || medId === "_") return; 

    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);

    try {
      const medRef = doc(db, "households", householdId, "medicines", medId);
      await updateDoc(medRef, { 
        taken: true, 
        status: "taken",
        lastUpdated: serverTimestamp() 
      });

      const inventoryRef = collection(db, "households", householdId, "inventory");
      const q = query(inventoryRef, where("medicineName", "==", medName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const stockDoc = querySnapshot.docs[0];
        const stockRef = doc(db, "households", householdId, "inventory", stockDoc.id);
        const currentQty = stockDoc.data().quantity || 0;

        if (currentQty > 0) {
          await updateDoc(stockRef, {
            quantity: currentQty - 1,
            lastUpdated: serverTimestamp()
          });
        }
      }
    } catch (err) { 
      console.error("Update failed:", err);
      setMeds(meds); 
    }
  };

  const handleDelete = async (medId) => {
    if (window.confirm("Remove this medication from your schedule?")) {
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
          {/* Use the new displayGreeting variable here */}
          <h1>{getGreeting()}, <span className="highlight-name">{displayGreeting}</span> ✨</h1>
          <p>Schedule for <span className="count-tag">{todayName}</span></p>
        </div>
      </header>

      <div className="main-grid">
        {/* Left Panel: Adherence Stats */}
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

        {/* Right Panel: Schedule List */}
        <main className="schedule-panel glass-inner">
          <div className="panel-header">
            <h3>Current Schedule</h3>
            <span className="today-date">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="med-grid">
            {meds.length > 0 ? (
              meds.map(med => {
                const isTaken = med.taken || med.status === "taken";
                return (
                  <motion.div 
                    layout 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    key={med.id} 
                    className={`med-row-card ${isTaken ? 'is-taken' : ''}`}
                  >
                    <div className="med-main-content">
                      <div className="checkbox-wrapper" onClick={() => toggleMedStatus(med.id, isTaken, med.name)}>
                        <div className="custom-checkbox">
                          {isTaken && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="med-details">
                        <h4 className={isTaken ? 'strikethrough' : ''}>
                          {med.name || "Unknown Medicine"}
                        </h4>
                        <p>{med.dosage || med.dose || "Standard Dose"}</p>
                      </div>
                    </div>
                    <button className="delete-med-btn" onClick={() => handleDelete(med.id)} title="Remove medicine">
                      🗑️
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">No medicines scheduled for {todayName}! 🌿</div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Chat Toggle */}
      <button className="chat-toggle-btn" onClick={() => setIsChatOpen(true)}>
        🤖 Ask Gemini
      </button>

      {/* Slide-out Chat Drawer */}
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
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }} 
              className="chat-side-panel glass-inner"
            >
              <div className="panel-header-ai">
                <h4 className="ai-title">🤖 Gemini Consultant</h4>
                <button className="close-panel-btn" onClick={() => setIsChatOpen(false)}>✕</button>
              </div>
              
              <div className="chat-window">
                {aiHistory.map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`chat-bubble ${msg.role}`}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </motion.div>
                ))}
                {isAiLoading && <p className="loading-text">Gemini is thinking...</p>}
              </div>
              
              <div className="chat-input-area">
                <input 
                  value={aiQuery} 
                  onChange={(e) => setAiQuery(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && handleAiConsult()}
                  placeholder="Ask about dosage, substitutes..." 
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