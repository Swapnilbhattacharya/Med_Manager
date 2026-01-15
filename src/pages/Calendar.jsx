import React from 'react';

export default function Calendar({ setView }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="dashboard-page" style={{ padding: '24px' }}>
      <div className="dashboard-header">
        <h2>📅 Weekly Schedule</h2>
      </div>
      <div className="med-grid">
        {days.map(day => (
          <div key={day} className="card">
            <h4 style={{ color: '#4f46e5' }}>{day}</h4>
            <p style={{ fontSize: '12px', color: '#64748b' }}>No medications.</p>
          </div>
        ))}
      </div>
    </div>
  );
}