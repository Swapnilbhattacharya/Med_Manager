import React, { useEffect, useState } from "react";
import { getUserMeds } from "../services/medService";
import { motion } from "framer-motion";
import "./Dashboard.css"; 

// UPDATED: Now accepts 'targetUid'
export default function Calendar({ householdId, setView, targetUid }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { 
        setLoading(false); 
        return; 
      }
      try {
        // FIX: Pass targetUid to the service to filter the calendar!
        const data = await getUserMeds(householdId, targetUid);
        setMeds(data || []);
      } catch (err) { 
        console.error("Error loading calendar data:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    loadData();
  }, [householdId, targetUid]); // FIX: Re-run when target user changes

  if (loading) return <div className="loading-screen">✨ Mapping Weekly Routine...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="dashboard-wrapper"
    >
      <header className="dash-header">
        <div>
          <h2 className="highlight-name">Weekly Routine 🗓️</h2>
          <p style={{ color: '#64748b', marginTop: '5px' }}>
            A comprehensive 7-day visual mapping tool.
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setView("dashboard")}>
          ← Back to Dashboard
        </button>
      </header>

      {/* THE 7-COLUMN GRID CONTAINER */}
      <div className="calendar-grid-wrapper">
        {dayNames.map((day) => {
          // Filter meds for this specific day
          const dayMeds = meds.filter((m) => m.day === day);

          return (
            <motion.div 
              whileHover={{ y: -5 }} 
              key={day} 
              className="glass-pane-column"
            >
              <h3 className="day-label">{day.substring(0, 3)}</h3>
              
              <div className="pane-content">
                {dayMeds.length > 0 ? (
                  dayMeds.map((med) => (
                    <div key={med.id} className="mini-med-card">
                      <strong>{med.name}</strong>
                      <p>{med.time || "No time set"}</p>
                      {med.dosage && (
                        <span style={{
                          fontSize: '0.75rem', 
                          background: '#eff6ff', 
                          color: '#3b82f6', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          marginTop: '4px',
                          display: 'inline-block'
                        }}>
                          {med.dosage}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="no-meds-text">Empty</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}