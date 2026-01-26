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
    if (months < 0) { years -= 1; months += 12; }

    return {
      expired: false, years, months, days,
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

  // Transition settings for a soft, professional feel
  const softSpring = { type: "spring", stiffness: 100, damping: 15, mass: 1 };

  const RenderColumn = ({ title, items, color, icon }) => (
    <div className="analysis-column" style={{ 
      flex: 1, 
      minWidth: '320px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '32px',
      padding: '20px',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      height: '75vh',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.05)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 10px 15px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>{icon}</span>
          <h3 style={{ color: '#1e3a8a', margin: 0, fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>
        </div>
        <span style={{ background: color, color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900', boxShadow: `0 4px 12px ${color}33` }}>
          {items.length}
        </span>
      </div>
      
      <div className="custom-scrollbar" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {items.length > 0 ? items.map(item => {
          const timeLeft = getTimeRemaining(item.expiryDate);
          return (
            <motion.div 
              key={item.id} 
              whileHover={{ y: -6, scale: 1.02, boxShadow: '0 15px 30px rgba(30, 64, 175, 0.1)' }}
              transition={softSpring}
              style={{ 
                padding: '20px', 
                borderRadius: '24px', 
                background: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid rgba(255, 255, 255, 1)',
                position: 'relative',
                cursor: 'default'
              }}
            >
              <div style={{ position: 'absolute', top: '15px', right: '15px', height: '8px', width: '8px', borderRadius: '50%', background: color }}></div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{item.medicineName?.toUpperCase()}</h4>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', marginBottom: '12px' }}>BATCH: {item.batchNumber}</div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)', 
                padding: '12px', 
                borderRadius: '16px', 
                border: '1px solid #e2e8f0' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>EXPIRY DATE</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#1e293b' }}>{item.expiryDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>TIME LEFT</span>
                  <strong style={{ color: color, fontSize: '0.8rem', fontWeight: '900' }}>
                    {timeLeft.expired ? "🚫 EXPIRED" : `${timeLeft.years > 0 ? timeLeft.years + 'Y ' : ''}${timeLeft.months}M ${timeLeft.days}D`}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>STOCK</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e3a8a' }}>{item.quantity}</span>
                </div>
                {timeLeft.expired && (
                   <motion.button 
                    whileHover={{ scale: 1.05 }}
                    transition={softSpring}
                    style={{ padding: '5px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.65rem', fontWeight: '900', cursor: 'pointer' }}>
                    DISPOSE
                   </motion.button>
                )}
              </div>
            </motion.div>
          );
        }) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '24px' }}>
            No records found
          </div>
        )}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-wrapper">
      
      <header style={{ textAlign: 'center', marginBottom: '50px', position: 'relative' }}>
        <motion.button 
          whileHover={{ x: -5 }}
          transition={softSpring}
          className="btn-secondary" 
          onClick={() => setView("dashboard")}
          style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', padding: '10px 20px', height: 'auto' }}
        >
          ← Back
        </motion.button>
        
        <motion.h1 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...softSpring, delay: 0.1 }}
          style={{ fontSize: '2.8rem', fontWeight: '900', color: '#1e3a8a', margin: '0 0 10px 0', letterSpacing: '-1px' }}
        >
          Shelf Life Analysis <span style={{ color: '#3b82f6' }}>🔬</span>
        </motion.h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', maxWidth: '600px', margin: '0 auto' }}>
          Intelligent real-time monitoring of your household medication stability and expiry timelines.
        </p>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '30px', 
        overflowX: 'auto', 
        paddingBottom: '30px',
        alignItems: 'flex-start',
        justifyContent: 'center' 
      }}>
        <RenderColumn title="Urgent Action" items={categories.urgent} color="#ef4444" icon="🛑" />
        <RenderColumn title="Monitor List" items={categories.warning} color="#f59e0b" icon="⏳" />
        <RenderColumn title="Stable Stock" items={categories.healthy} color="#10b981" icon="🛡️" />
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: rgba(30, 58, 138, 0.1); 
          border-radius: 10px; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(30, 58, 138, 0.2); }
      `}</style>
    </motion.div>
  );
};

export default StockAnalysis;