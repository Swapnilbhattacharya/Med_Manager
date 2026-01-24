import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css";

export default function AddMed({ householdId, setView }) {
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!medName || selectedDays.length === 0) {
      alert("Please enter a name and select at least one day.");
      return;
    }

    setLoading(true);
    try {
      const medsRef = collection(db, "households", householdId, "medicines");
      const savePromises = selectedDays.map(day => 
        addDoc(medsRef, {
          name: medName,
          dosage: dosage,
          time: time,
          day: day,
          taken: false,
          status: "pending",
          createdAt: new Date()
        })
      );

      await Promise.all(savePromises);
      setView("dashboard"); 
    } catch (err) {
      console.error("Firebase Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="dashboard-wrapper"
    >
      <div className="professional-form-card" style={{ margin: '40px auto', maxWidth: '700px' }}>
        <h2 className="panel-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>New Medication</h2>
        <p style={{ color: '#64748b', marginBottom: '30px', fontWeight: '600' }}>Add a new medicine to your daily routine.</p>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div className="input-group">
            <label className="input-label">Medicine Name</label>
            <input 
              className="pro-input" 
              value={medName} 
              onChange={(e) => setMedName(e.target.value)} 
              placeholder="e.g. Paracetamol" 
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label className="input-label">Dosage</label>
              <input 
                className="pro-input" 
                value={dosage} 
                onChange={(e) => setDosage(e.target.value)} 
                placeholder="e.g. 500mg" 
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-group">
              <label className="input-label">Scheduled Time</label>
              <input 
                className="pro-input" 
                type="time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                style={{ width: '100%' }}
              />
            </div>
          </div>
          
          <div className="input-group">
            <label className="input-label">Repeat Days</label>
            {/* FIX: Days buttons forced into one line */}
            <div className="days-row-container">
              {daysOfWeek.map(day => (
                <button 
                  key={day} 
                  type="button" 
                  onClick={() => toggleDay(day)} 
                  className={selectedDays.includes(day) ? "day-btn active" : "day-btn"}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
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