import React, { useState } from "react";
import { db } from "../services/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function AddMed({ householdId, setView }) {
  const [medName, setMedName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
      // Direct subcollection targeting for global sync
      const medsRef = collection(db, "households", householdId, "medications");
      await addDoc(medsRef, {
        name: medName,
        dosage: dosage,
        time: time,
        days: selectedDays, // The array needed for Calendar filtering
        taken: false,
        createdAt: new Date()
      });
      setView("dashboard"); // Redirect refreshes the global state
    } catch (err) {
      console.error("Firebase Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-med-wrapper" style={{ 
      background: 'radial-gradient(circle at top right, #1a2a6c, #b21f1f, #fdbb2d)',
      minHeight: '100vh', padding: '40px', color: 'white', fontFamily: "'Poppins', sans-serif" 
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Add New Medication</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Medicine Name" style={{ padding: '12px', borderRadius: '10px', border: 'none' }} />
          <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="Dosage (e.g. 650mg)" style={{ padding: '12px', borderRadius: '10px', border: 'none' }} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: 'none' }} />
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {daysOfWeek.map(day => (
              <button key={day} type="button" onClick={() => toggleDay(day)} style={{ 
                padding: '8px 12px', borderRadius: '8px', border: '1px solid white',
                background: selectedDays.includes(day) ? 'white' : 'transparent',
                color: selectedDays.includes(day) ? '#1a2a6c' : 'white', cursor: 'pointer'
              }}>{day}</button>
            ))}
          </div>

          <button type="submit" disabled={loading} style={{ background: '#4CAF50', color: 'white', padding: '15px', borderRadius: '15px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? "SAVING..." : "ADD TO SCHEDULE"}
          </button>
        </form>
      </div>
    </div>
  );
}