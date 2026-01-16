import React, { useEffect, useState } from "react";
import { getHouseholdMeds } from "../services/medService";
import "./Dashboard.css";

export default function Calendar({ householdId, setView }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const fullDays = { "Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday", "Sat": "Saturday", "Sun": "Sunday" };

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
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '30px' }}>🗓️</span> Weekly Schedule
        </h2>
        <button className="primary-btn" onClick={() => setView("dashboard")} style={{ background: '#4f46e5' }}>Home</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}><h3>Syncing Calendar...</h3></div>
      ) : (
        <div className="med-grid">
          {days.map(day => {
            const dayMeds = meds.filter(m => m.day === fullDays[day]);

            return (
              <div key={day} className="card" style={{ minHeight: '180px' }}>
                <h3 style={{ color: '#4f46e5', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>{day}</h3>
                
                {dayMeds.length > 0 ? (
                  dayMeds.map(m => (
                    <div key={m.id} style={{ 
                      padding: '10px', background: '#f8fafc', borderRadius: '10px', 
                      marginBottom: '10px', borderLeft: '4px solid #4f46e5', fontSize: '14px' 
                    }}>
                      <div style={{ fontWeight: '700' }}>{m.time} — {m.name}</div>
                      <div style={{ color: '#64748b', fontSize: '12px' }}>{m.dosage}</div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginTop: '30px' }}>No meds</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}