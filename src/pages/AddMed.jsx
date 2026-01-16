import React, { useState } from "react";
import { addMedicine } from "../services/medService";
import "./Dashboard.css";

export default function AddMed({ user, householdId, setView }) {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    day: "Monday",
    time: "08:00",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addMedicine(householdId, { 
        ...formData, 
        userId: user.uid,
        status: "pending" 
      });
      setView("dashboard");
    } catch (err) {
      alert("Error adding medication");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dash-header">
        <div>
          <h2 className="highlight-name">Add Medication 💊</h2>
          <p style={{ color: '#64748b', marginTop: '5px' }}>Schedule a new reminder for your daily routine.</p>
        </div>
        <button className="btn-cancel" onClick={() => setView("dashboard")}>Cancel</button>
      </div>

      <div className="form-container-centered">
        <form onSubmit={handleSubmit} className="professional-form-card glass-inner">
          <div style={{ marginBottom: '20px' }}>
            <label style={styles.label}>Medicine Name</label>
            <input
              type="text"
              className="pro-input"
              placeholder="e.g. Paracetamol"
              style={{ width: '100%' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-double">
            <div>
              <label style={styles.label}>Dosage</label>
              <input
                type="text"
                className="pro-input"
                placeholder="e.g. 500mg"
                style={{ width: '100%' }}
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={styles.label}>Day of Week</label>
              <select
                className="pro-input"
                style={{ width: '100%' }}
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ margin: '20px 0' }}>
            <label style={styles.label}>Specified Time</label>
            <input
              type="time"
              className="pro-input"
              style={{ width: '100%' }}
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn-save-main">
            Confirm Schedule
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '14px'
  }
};