import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css";

export default function AddMed({ householdId, setView, targetUid, targetName }) {
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timeSlots, setTimeSlots] = useState([""]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedDays(daysOfWeek);
    } else {
      setSelectedDays([]);
    }
  };

  const addTimeSlot = () => setTimeSlots([...timeSlots, ""]);
  const updateTimeSlot = (index, value) => {
    const newSlots = [...timeSlots];
    newSlots[index] = value;
    setTimeSlots(newSlots);
  };
  const removeTimeSlot = (index) => {
    if (timeSlots.length > 1) {
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    
    if (!medName || selectedDays.length === 0 || timeSlots.some(t => !t)) {
      alert("Please fill in all required fields and select at least one day.");
      return;
    }

    const dosageNum = parseInt(dosage);
    if (isNaN(dosageNum) || dosageNum <= 0) {
      alert("Please enter a valid dosage amount.");
      return;
    }
    if (dosageNum > 1000) {
      alert("Safety limit exceeded: Dosage cannot be more than 1000mg.");
      return;
    }

    setLoading(true);
    const cleanMedName = medName.trim().toUpperCase();

    try {
      const medsRef = collection(db, "households", householdId, "medicines");
      
      const savePromises = [];
      selectedDays.forEach(day => {
        timeSlots.forEach(time => {
          savePromises.push(
            addDoc(medsRef, {
              name: cleanMedName,
              dosage: dosageNum, // Store as NUMBER to match inventory
              time: time,
              day: day,
              taken: false,
              status: "pending",
              ownerId: targetUid,
              ownerName: targetName,
              createdAt: serverTimestamp() 
            })
          );
        });
      });

      await Promise.all(savePromises);

      // --- UPDATED INVENTORY CHECK ---
      const invRef = collection(db, "households", householdId, "inventory");
      // Query filters by BOTH name and the specific dosage
      const q = query(
        invRef, 
        where("medicineName", "==", cleanMedName),
        where("dosage", "==", dosageNum)
      ); 
      
      const snap = await getDocs(q);
      
      let totalStock = 0;
      snap.docs.forEach(d => { totalStock += Number(d.data().quantity || 0); });

      if (snap.empty || totalStock <= 0) {
        alert(`Schedule Created! 📅\nNote: ${cleanMedName} (${dosageNum}mg) is not in stock. Update your inventory to log doses.`);
      }

      setView("dashboard"); 
    } catch (err) {
      console.error("Firebase Error:", err);
      alert("Error saving medication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dashboard-wrapper">
      <div className="professional-form-card" style={{ margin: '40px auto', maxWidth: '700px' }}>
        <h2 className="panel-title" style={{ fontSize: '2rem' }}>New Medication</h2>
        <p style={{ color: '#64748b', marginBottom: '25px', fontWeight: '600' }}>
          Schedule for: <span style={{ background:'#e0f2fe', color:'#0284c7', padding:'2px 8px', borderRadius:'6px' }}>{targetName}</span>
        </p>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div className="input-group">
            <label className="input-label">Medicine Name *</label>
            <input 
              className="pro-input" 
              value={medName} 
              onChange={(e) => setMedName(e.target.value.toUpperCase())} 
              placeholder="e.g. DOLO" 
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Dosage (mg) *</label>
              <input 
                className="pro-input" 
                type="number"
                value={dosage} 
                onChange={(e) => setDosage(e.target.value)} 
                placeholder="500" 
                required
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Time Slots *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {timeSlots.map((t, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      className="pro-input" 
                      type="time" 
                      value={t} 
                      onChange={(e) => updateTimeSlot(index, e.target.value)} 
                      required
                    />
                    {timeSlots.length > 1 && (
                      <button type="button" onClick={() => removeTimeSlot(index)} className="delete-med-btn">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addTimeSlot} className="btn-secondary" style={{ height: '35px', fontSize: '0.8rem' }}>+ Add Time</button>
              </div>
            </div>
          </div>
          
          {/* ... (Rest of UI for Repeat Days and Buttons remains exactly the same) ... */}
          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Repeat Days *</label>
              <label style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedDays.length === daysOfWeek.length} 
                  style={{ width: '16px', height: '16px' }}
                /> 
                Select All
              </label>
            </div>
            <div className="days-row-container">
              {daysOfWeek.map(day => (
                <button 
                  key={day} type="button" 
                  onClick={() => toggleDay(day)} 
                  className={selectedDays.includes(day) ? "day-btn active" : "day-btn"}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <button type="submit" disabled={loading} className="btn-add-main" style={{ flex: 2 }}>
              {loading ? "SAVING..." : "ADD TO SCHEDULE"}
            </button>
            <button type="button" onClick={() => setView("dashboard")} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}