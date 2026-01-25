import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";

// FIX: Ensure this imports the CSS file where 'professional-form-card' is defined
import "./Dashboard.css"; 

const AddInventory = ({ householdId, setView }) => {
  const [formData, setFormData] = useState({
    gtin: '',
    batchNumber: '',
    medicineName: '',
    quantity: '',
    expiryDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.gtin.trim() || !formData.batchNumber.trim()) {
      alert("GTIN and Batch Number are required!");
      return;
    }

    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }

    setIsSubmitting(true);
    const docId = `${formData.gtin.trim()}_${formData.batchNumber.trim()}`;
    
    try {
      const inventoryRef = doc(db, "households", householdId, "inventory", docId);

      await setDoc(inventoryRef, {
        ...formData,
        gtin: formData.gtin.trim(),
        batchNumber: formData.batchNumber.trim(),
        quantity: qty,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      alert("Inventory synced successfully! ✨");
      // Redirect back to the LIST view
      setView("inventory"); 
    } catch (err) {
      console.error(err);
      alert("Error updating household inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="dashboard-wrapper"
    >
       <header className="dash-header">
        <div className="welcome-area">
          {/* Using same class as Dashboard for font consistency */}
          <h1 className="highlight-name" style={{fontSize: '2rem'}}>Add Stock ➕</h1>
          <p style={{ color: '#64748b' }}>Register new supplies to your household.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("inventory")}>
          ← Back to Stock
        </button>
      </header>

      {/* Using the Professional Glass Form Class */}
      <div className="professional-form-card">
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Product GTIN</label>
            <input 
              className="pro-input" 
              placeholder="e.g. 890123" 
              value={formData.gtin}
              onChange={(e) => setFormData({...formData, gtin: e.target.value})}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Medicine Name</label>
            <input 
              className="pro-input" 
              placeholder="Name of medicine" 
              value={formData.medicineName}
              onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
            />
          </div>

          <div className="days-row-container" style={{ marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Batch Number</label>
              <input 
                className="pro-input" 
                placeholder="Batch #" 
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Quantity</label>
              <input 
                className="pro-input" 
                type="number" 
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label className="input-label">Expiry Date</label>
            <input 
              className="pro-input" 
              type="date" 
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} 
            />
          </div>

          <button type="submit" className="btn-add-main" style={{ width: '100%', justifyContent: 'center' }} disabled={isSubmitting}>
            {isSubmitting ? "Syncing..." : "Confirm Update"}
          </button>
        
        </form>
      </div>
    </motion.div>
  );
};

export default AddInventory;