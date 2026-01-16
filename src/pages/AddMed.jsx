import React, { useState } from "react";
import { addMedicine } from "../services/medService";
import "./Dashboard.css";

export default function AddMed({ user, householdId, setView }) {
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    dosage: "",
    day: "Monday",
    time: "08:00"
  });
  const [isSaving, setIsSaving] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛡️ Safety Check: Prevent adding meds if user isn't in a house yet
    if (!householdId) {
      alert("Please create or join a household from the Dashboard first!");
      setView("dashboard");
      return;
    }

    setIsSaving(true);
    try {
      await addMedicine(householdId, formData);
      alert("Medicine added to Household Schedule!");
      setView("calendar"); // Go to calendar to see it instantly
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ background: '#f8fbff' }}>
      <div className="dashboard-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#4f46e5', fontSize: '30px' }}>➕</span> Add Medicine
        </h2>
        <button className="primary-btn" onClick={() => setView("dashboard")} style={{ background: '#64748b' }}>Cancel</button>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '30px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={labelStyle}>Medicine Name</label>
            <input required style={inputStyle} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Paracetamol" />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Barcode</label>
              <input style={inputStyle} value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} placeholder="Scan or type ID" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Dosage</label>
              <input style={inputStyle} value={formData.dosage} onChange={(e) => setFormData({...formData, dosage: e.target.value})} placeholder="e.g. 500mg" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Day of Week</label>
              <select style={inputStyle} value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})}>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Specific Time</label>
              <input type="time" style={inputStyle} value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={isSaving} style={{ padding: '16px', fontSize: '16px' }}>
            {isSaving ? "Saving..." : "Save to Household"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: '800', color: '#4f46e5', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };