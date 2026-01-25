import React, { useEffect, useState } from "react";
import { db } from "../services/firebase";
import { collection, onSnapshot } from "firebase/firestore"; // Use onSnapshot for real-time updates
import { motion } from "framer-motion";
import "../pages/Dashboard.css"; 

export default function InventoryList({ householdId, setView }) {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;

    // Use onSnapshot for real-time updates (better for stock management)
    const invRef = collection(db, "households", householdId, "inventory");
    const unsubscribe = onSnapshot(invRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // FILTER: Remove items with 0 quantity (They "disappear")
      const availableStock = data.filter(item => Number(item.quantity) > 0);
      
      setInventory(availableStock);
      setLoading(false);
    }, (err) => {
      console.error("Error loading inventory:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [householdId]);

  if (loading) return <div className="loading-screen">✨ Checking Stock Levels...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="dashboard-wrapper"
    >
      <header className="dash-header">
        <div className="welcome-area">
          <h1 className="highlight-name" style={{fontSize: '2rem'}}>Stock Manager 📦</h1>
          <p style={{ color: '#64748b' }}>Track quantity, batches, and expiry.</p>
        </div>
        
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setView("dashboard")}>
            ← Dashboard
          </button>
          
          <button className="btn-add-main" onClick={() => setView("addInventory")}>
            + Add New Stock
          </button>
        </div>
      </header>

      <div className="inventory-grid-container">
        {inventory.length > 0 ? (
          inventory.map((item) => (
            <motion.div 
              whileHover={{ y: -5 }} 
              key={item.id} 
              className="glass-inner inventory-item-card"
            >
              <div className="inv-card-header">
                <h3>{item.medicineName || "Unknown Item"}</h3>
                <span className={`qty-badge ${item.quantity < 5 ? 'low-stock' : 'good-stock'}`}>
                  Qty: {item.quantity}
                </span>
              </div>
              
              <div className="inv-details">
                <div className="detail-row">
                  <span>Batch:</span> <strong>{item.batchNumber}</strong>
                </div>
                <div className="detail-row">
                  <span>GTIN:</span> <span>{item.gtin}</span>
                </div>
                <div className="detail-row">
                  <span>Expires:</span> 
                  <span style={{ color: item.expiryDate ? '#1e293b' : '#94a3b8' }}>
                    {item.expiryDate || "N/A"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="empty-state-glass">
            <p>Your inventory is empty (or all items are out of stock).</p>
            <button className="btn-add-main" style={{margin:'20px auto'}} onClick={() => setView("addInventory")}>
              Add Stock
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}