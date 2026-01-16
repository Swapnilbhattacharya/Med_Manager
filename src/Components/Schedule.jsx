import React from 'react';
import { updateMedicationStatus } from '../services/medService';

export default function Schedule({ meds = [], householdId }) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()];
  
  // Filter for today
  const todaysMeds = meds.filter(m => m.day === today);

  const handleUpdate = async (id, status) => {
    try {
      await updateMedicationStatus(householdId, id, status);
      window.location.reload(); 
    } catch (err) { alert("Update failed"); }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {todaysMeds.length > 0 ? (
        todaysMeds.map(m => (
          <div key={m.id} style={styles.row}>
            <div style={{ flex: 1 }}>
              <span style={styles.time}>{m.time}</span>
              <span style={styles.name}>{m.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => handleUpdate(m.id, 'taken')} 
                style={{...styles.btn, background: m.status === 'taken' ? '#10b981' : '#f1f5f9', color: m.status === 'taken' ? 'white' : '#475569'}}
              >✓</button>
              <button 
                onClick={() => handleUpdate(m.id, 'skipped')} 
                style={{...styles.btn, background: m.status === 'skipped' ? '#f59e0b' : '#f1f5f9', color: m.status === 'skipped' ? 'white' : '#475569'}}
              >✕</button>
            </div>
          </div>
        ))
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>No doses scheduled for {today}.</p>
      )}
    </div>
  );
}

const styles = {
  row: { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  time: { fontWeight: '700', color: '#4f46e5', width: '60px', fontSize: '14px' },
  name: { fontWeight: '600', color: '#1e1b4b', fontSize: '15px' },
  btn: { border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};