import React from 'react';

export default function Scan({ setView }) {
  return (
    <div className="dashboard-page" style={{ padding: '24px' }}>
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '60px' }}>📷</div>
        <h3>Medicine Scanner</h3>
        <p>Align the barcode within the frame to identify your medication.</p>
        <div style={{ height: '200px', background: '#000', margin: '20px 0', borderRadius: '12px', border: '2px solid #4f46e5' }}></div>
        <button className="primary-btn" onClick={() => setView("dashboard")}>Cancel and Return</button>
      </div>
    </div>
  );
}