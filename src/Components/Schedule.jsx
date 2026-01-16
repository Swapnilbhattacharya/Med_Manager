import React from 'react';
import { updateMedicationStatus } from '../services/medService';

export default function Schedule({ meds = [], householdId }) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = dayNames[new Date().getDay()];
  
  const todaysMeds = meds.filter(m => m.day === today);

  const handleToggle = async (id, currentStatus) => {
    // If status is missing, we assume it was 'pending'
    const newStatus = currentStatus === 'taken' ? 'pending' : 'taken';
    try {
      await updateMedicationStatus(householdId, id, newStatus);
      window.location.reload(); 
    } catch (err) { 
      console.error("Update failed:", err);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {todaysMeds.length > 0 ? (todaysMeds.map(m => {
          const status = m.status || 'pending'; // Safety fallback
          return (
            <div key={m.id} style={styles.row}>
              <div style={{ flex: 1 }}>
                <span style={styles.time}>{m.time}</span>
                <span style={styles.name}>{m.name}</span>
              </div>
              
              <button 
                onClick={() => handleToggle(m.id, status)} 
                style={{
                  ...styles.statusBtn, 
                  backgroundColor: status === 'taken' ? '#10b981' : '#f1f5f9',
                  color: status === 'taken' ? 'white' : '#64748b',
                  border: status === 'taken' ? 'none' : '1px solid #e2e8f0'
                }}
              >
                {status === 'taken' ? '✓ Taken' : 'Mark Taken'}
              </button>
            </div>
          );
        })
      ) : (
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center' }}>No doses scheduled for {today}.</p>
      )}
    </div>
  );
}

const styles = {
  row: { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  time: { fontWeight: '700', color: '#4f46e5', width: '65px', fontSize: '14px' },
  name: { fontWeight: '600', color: '#1e1b4b', fontSize: '15px' },
  statusBtn: { padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease', minWidth: '100px' }
};