import React, { useEffect, useState } from "react";
import { db } from "../services/firebase"; 
import { doc, updateDoc, deleteDoc } from "firebase/firestore"; 
import { getUserMeds } from "../services/medService";
import { getMedicineAlternative } from "../services/aiService"; 
import MedicineCard from "../Components/MedicineCard";
import ProgressRing from "../Components/ProgressRing";
import "./Dashboard.css";

// EXPORT DEFAULT is required to fix the error in image_be66d2.png
export default function Dashboard({ user, householdId, setView }) {
  const [meds, setMeds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [streak] = useState(7);
  
  // AI State
  const [aiQuery, setAiQuery] = useState("");
  const [aiHistory, setAiHistory] = useState([
    { role: 'bot', text: "Need a substitute? Tell me the name and I'll find a safe alternative." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Static chart data
  const weeklyData = [
    { day: 'M', value: 80 }, { day: 'T', value: 100 }, { day: 'W', value: 60 },
    { day: 'T', value: 90 }, { day: 'F', value: 100 }, { day: 'S', value: 40 },
    { day: 'S', value: 100 }
  ];

  const userName = user?.email?.split('@')[0] || "User";

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const data = await getUserMeds(householdId);
        setMeds(data || []); // Properly initializes the meds array
      } catch (err) {
        console.error("Error loading meds:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [householdId]);

  // NEW: Handle Deletion logic
  const handleDelete = async (medId) => {
    if (window.confirm("Are you sure you want to remove this medication?")) {
      try {
        await deleteDoc(doc(db, "households", householdId, "medications", medId));
        setMeds(prev => prev.filter(m => m.id !== medId)); // UI updates instantly
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleAiConsult = async () => {
    if (!aiQuery.trim()) return;
    const userMsg = { role: 'user', text: aiQuery };
    setAiHistory(prev => [...prev, userMsg]);
    setAiQuery("");
    setIsAiLoading(true);
    const response = await getMedicineAlternative(aiQuery);
    setAiHistory(prev => [...prev, { role: 'bot', text: response }]);
    setIsAiLoading(false);
  };

  const toggleMedStatus = async (medId, currentStatus) => {
    if (currentStatus) return; 
    const updatedMeds = meds.map(m => m.id === medId ? { ...m, taken: true } : m);
    setMeds(updatedMeds);
    try {
      await updateDoc(doc(db, "households", householdId, "medications", medId), { taken: true });
    } catch (err) { console.error(err); }
  };

  // 1. LOADING CHECK: Prevents ReferenceErrors
  if (loading) return <div className="loading-screen">Waking up the Medical Suite...</div>;

  // 2. DATA CALCULATION: Safe to run because loading is finished
  const takenCount = meds ? meds.filter(m => m.taken).length : 0;
  const showEmergency = meds ? (meds.length - takenCount) > 2 : false; 

  return (
    <div className="dashboard-wrapper" style={{ 
      background: 'radial-gradient(circle at top right, #1a2a6c, #b21f1f, #fdbb2d)', 
      minHeight: '100vh', paddingBottom: '120px', position: 'relative', fontFamily: "'Poppins', sans-serif" 
    }}>
      
      <header style={{ padding: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '32px', color: 'white', fontWeight: 800 }}>Medical Dashboard</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setView("calendar")} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer' }}>📅 Calendar</button>
          <button onClick={() => setView("addMed")} style={{ background: 'white', color: '#b21f1f', border: 'none', padding: '12px 25px', borderRadius: '15px', fontWeight: 800, cursor: 'pointer' }}>+ NEW MEDICINE</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', padding: '30px', gap: '30px' }}>
        {/* SIDEBAR */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(15px)', borderRadius: '35px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>ADHERENCE</h3>
            <ProgressRing taken={takenCount} total={meds.length} />
          </div>

          <div style={{ background: 'white', borderRadius: '25px', padding: '20px', height: '400px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1a2a6c' }}>🤖 Gemini AI Consultant</h4>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
              {aiHistory.map((msg, i) => (
                <div key={i} style={{ background: msg.role === 'user' ? '#1a2a6c' : '#f0f2f5', color: msg.role === 'user' ? 'white' : '#333', padding: '10px', borderRadius: '12px', marginBottom: '8px', fontSize: '13px' }}>{msg.text}</div>
              ))}
              {isAiLoading && <p style={{ fontSize: '11px', color: '#888' }}>Thinking...</p>}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder="Type med name..." style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} onKeyPress={(e) => e.key === 'Enter' && handleAiConsult()} />
              <button onClick={handleAiConsult} style={{ background: '#ff4b2b', color: 'white', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 'bold', cursor: 'pointer' }}>Ask</button>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h4 style={{ margin: '0 0 15px 0', color: 'white', fontSize: '12px', opacity: 0.8 }}>WEEKLY CONSISTENCY</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '60px' }}>
              {weeklyData.map((d, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ width: '10px', height: `${d.value * 0.6}px`, background: d.value === 100 ? '#4CAF50' : 'rgba(255,255,255,0.5)', borderRadius: '5px', marginBottom: '5px' }}></div>
                  <span style={{ fontSize: '10px', color: 'white', opacity: 0.6 }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN MEDICATION GRID */}
        <main>
          <div className="med-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {meds.map(med => (
              <MedicineCard 
                key={med.id} 
                name={med.name} 
                dose={med.dosage} 
                status={med.taken ? "Taken" : "Pending"} 
                onToggle={() => toggleMedStatus(med.id, med.taken)}
                onDelete={() => handleDelete(med.id)} // PASSING DELETE PROP
              />
            ))}
          </div>
        </main>
      </div>

      {showEmergency && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: '#ff4b2b', color: 'white', padding: '15px 40px', borderRadius: '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)', fontWeight: 'bold', zIndex: 2000 }}>
          🚨 URGENT: Multiple doses are still pending!
        </div>
      )}
    </div>
  );
}