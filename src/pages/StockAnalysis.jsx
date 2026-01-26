import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import "./Dashboard.css"; 

const StockAnalysis = ({ householdId, setView }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const invRef = collection(db, "households", householdId, "inventory");
        const snap = await getDocs(invRef);
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventory(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [householdId]);

  // --- CALCULATION LOGIC ---
  const getTimeRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (expiry < now) return { expired: true, text: "EXPIRED" };

    let years = expiry.getFullYear() - now.getFullYear();
    let months = expiry.getMonth() - now.getMonth();
    let days = expiry.getDate() - now.getDate();

    if (days < 0) {
      months -= 1;
      days += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return {
      expired: false,
      years, months, days,
      totalDays: Math.floor((expiry - now) / (1000 * 60 * 60 * 24))
    };
  };

  const categories = {
    urgent: inventory.filter(item => {
      const res = getTimeRemaining(item.expiryDate);
      return res.expired || res.totalDays <= 30;
    }),
    warning: inventory.filter(item => {
      const res = getTimeRemaining(item.expiryDate);
      return !res.expired && res.totalDays > 30 && res.totalDays <= 180;
    }),
    healthy: inventory.filter(item => {
      const res = getTimeRemaining(item.expiryDate);
      return !res.expired && res.totalDays > 180;
    })
  };

  if (loading) return <div className="loading-screen"><h2>Analyzing Shelf Life...</h2></div>;

  const RenderSection = ({ title, items, color, icon }) => (
    <div style={{ marginBottom: '40px' }}>
      <h3 style={{ color: color, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
        {icon} {title} ({items.length})
      </h3>
      <div className="inventory-grid-container">
        {items.length > 0 ? items.map(item => {
          const timeLeft = getTimeRemaining(item.expiryDate);
          return (
            <motion.div key={item.id} className="glass-inner inventory-item-card" style={{ borderLeft: `6px solid ${color}` }}>
              <div className="inv-card-header">
                <h3>{item.medicineName?.toUpperCase()}</h3>
                <span className="qty-badge" style={{ background: color + '22', color: color }}>
                  Qty: {item.quantity}
                </span>
              </div>
              <div className="inv-details">
                <div className="detail-row">
                  <span>Expiry Date:</span>
                  <strong>{item.expiryDate}</strong>
                </div>
                <div className="detail-row" style={{ marginTop: '10px', background: color + '11', padding: '8px', borderRadius: '8px' }}>
                  <span style={{ color: color }}>Time Remaining:</span>
                  <strong style={{ color: color }}>
                    {timeLeft.expired ? "🚫 EXPIRED" : 
                      `${timeLeft.years > 0 ? timeLeft.years + 'y ' : ''}${timeLeft.months}m ${timeLeft.days}d`}
                  </strong>
                </div>
                <div className="detail-row" style={{ fontSize: '0.75rem', marginTop: '5px' }}>
                  <span>Batch:</span>
                  <strong>{item.batchNumber}</strong>
                </div>
              </div>
            </motion.div>
          );
        }) : <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No items in this category.</p>}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      <header className="dash-header">
        <div className="welcome-area">
          <h1 className="highlight-name" style={{ fontSize: '2.2rem' }}>Shelf Life Analysis 🔬</h1>
          <p>Detailed breakdown of your medicine cabinet's longevity.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("dashboard")}>← Dashboard</button>
      </header>

      <RenderSection title="Urgent: Expiring within 30 days" items={categories.urgent} color="#ef4444" icon="🛑" />
      <RenderSection title="Warning: Expiring within 6 months" items={categories.warning} color="#f59e0b" icon="⚠️" />
      <RenderSection title="Healthy Stock" items={categories.healthy} color="#10b981" icon="✅" />
    </motion.div>
  );
};

export default StockAnalysis;