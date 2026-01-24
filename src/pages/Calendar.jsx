import React, { useEffect, useState } from "react";
import { getUserMeds } from "../services/medService";
import { motion } from "framer-motion";
import "./Dashboard.css";

export default function Calendar({ householdId, setView }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const loadData = async () => {
      if (!householdId) { setLoading(false); return; }
      try {
        const data = await getUserMeds(householdId);
        setMeds(data || []);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    loadData();
  }, [householdId]);

  if (loading) return <div className="loading-screen">✨ Mapping Weekly Routine...</div>;

  return (
    <div className="dashboard-wrapper">
      <header className="dash-header">
        <div>
          <h2 className="highlight-name">Weekly Routine 🗓️</h2>
          <p style={{ color: '#64748b' }}>A comprehensive 7-day visual mapping tool.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("dashboard")}>← Dashboard</button>
      </header>

      {/* THIS IS THE CRITICAL WRAPPER FOR SIDE-BY-SIDE PANES */}
      <div className="calendar-grid-wrapper">
        {dayNames.map((day) => {
          const dayMeds = meds.filter((m) => m.day === day);
          return (
            <motion.div key={day} className="glass-pane-column">
              <h3 className="day-label">{day}</h3>
              <div className="pane-content">
                {dayMeds.length > 0 ? (
                  dayMeds.map((med) => (
                    <div key={med.id} className="mini-med-card">
                      <strong>{med.name}</strong>
                      <p>{med.time}</p>
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
    </div>
  );
}