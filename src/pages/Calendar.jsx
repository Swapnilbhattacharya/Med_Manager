import React, { useEffect, useState } from "react";
import { getHouseholdMeds } from "../services/medService";
import "./Dashboard.css";

export default function Calendar({ householdId, setView }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDays = { 
    "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", 
    "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday" 
  };

  useEffect(() => {
    if (householdId) {
      getHouseholdMeds(householdId).then((data) => {
        setMeds(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [householdId]);

  return (
    <div className="dashboard-wrapper">
      <div className="dash-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '32px' }}>🗓️</span> 
          <span className="highlight-name">Weekly Schedule</span>
        </h2>
        <button className="btn-add-main" onClick={() => setView("dashboard")}>
          ← Back Home
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h3 style={{ color: '#4f46e5' }}>Syncing Calendar...</h3>
        </div>
      ) : (
        <div className="calendar-grid-layout">
          {days.map(day => {
            const dayMeds = meds.filter(m => m.day === fullDays[day]);

            return (
              <div key={day} className="glass-inner calendar-day-card">
                <h3 className="day-title">{day}</h3>
                
                <div className="day-med-list">
                  {dayMeds.length > 0 ? (
                    dayMeds.map(m => (
                      <div key={m.id} className="calendar-item-box">
                        <div className="item-time">{m.time}</div>
                        <div className="item-details">
                          <strong>{m.name}</strong>
                          <p>{m.dosage}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-meds-placeholder">No meds</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}