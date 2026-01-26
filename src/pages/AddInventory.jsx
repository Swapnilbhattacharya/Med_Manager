import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// Ensure this imports the CSS file where your professional classes are defined
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
  const [showToast, setShowToast] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. GTIN Validation (Strictly Numeric)
    if (!/^\d+$/.test(formData.gtin.trim())) {
      alert("GTIN must contain only numbers.");
      return;
    }

    // 2. Quantity Constraint (1 to 10,000)
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 1) {
      alert("Please enter a valid quantity.");
      return;
    }
    if (qty > 10000) {
      alert("Quantity cannot exceed 10,000 units per entry.");
      return;
    }

    // 3. Expiry Date Validation (Prevents past dates)
    if (formData.expiryDate && formData.expiryDate < today) {
      alert("The expiry date cannot be in the past.");
      return;
    }

    setIsSubmitting(true);
    
    // Clean Data: Batch and Medicine Name to UPPERCASE
    const cleanBatch = formData.batchNumber.trim().toUpperCase();
    const cleanMedName = formData.medicineName.trim().toUpperCase(); // Changed to UPPERCASE
    
    // Unique ID based on GTIN + Batch Number
    const docId = `${formData.gtin.trim()}_${cleanBatch}`;
    
    try {
      const inventoryRef = doc(db, "households", householdId, "inventory", docId);

      await setDoc(inventoryRef, {
        ...formData,
        gtin: formData.gtin.trim(),
        medicineName: cleanMedName,
        batchNumber: cleanBatch,
        quantity: qty,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      setShowToast(true);
      // Brief delay so the user sees the success toast
      setTimeout(() => setView("inventory"), 1500); 
    } catch (err) {
      console.error("Firestore Error:", err);
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
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="success-toast"
            style={{
              position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#10b981', color: 'white', padding: '12px 24px',
              borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000, fontWeight: '600'
            }}
          >
            Inventory synced successfully! ✨
          </motion.div>
        )}
      </AnimatePresence>

       <header className="dash-header">
        <div className="welcome-area">
          <h1 className="highlight-name" style={{fontSize: '2rem'}}>Add Stock ➕</h1>
          <p style={{ color: '#64748b' }}>Register new supplies to your household.</p>
        </div>
        <button className="btn-secondary" onClick={() => setView("inventory")}>
          ← Back to Stock
        </button>
      </header>

      <div className="professional-form-card">
        <form onSubmit={handleSubmit}>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Product GTIN *</label>
            <input 
              className="pro-input" 
              placeholder="e.g. 890123456789" 
              inputMode="numeric"
              value={formData.gtin}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d+$/.test(val)) {
                  setFormData({...formData, gtin: val});
                }
              }}
              required
            />
            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Only numbers allowed.</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Medicine Name *</label>
            <input 
              className="pro-input" 
              placeholder="e.g. PARACETAMOL" 
              value={formData.medicineName}
              onChange={(e) => setFormData({...formData, medicineName: e.target.value.toUpperCase()})}
              required // Now a required field
            />
            <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Saved in UPPERCASE for consistency.</small>
          </div>

          <div className="days-row-container" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Batch Number *</label>
              <input 
                className="pro-input" 
                placeholder="e.g. LOT123" 
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value.toUpperCase()})}
                required
              />
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Found near expiry date.</small>
            </div>

            <div style={{ flex: 1 }}>
              <label className="input-label">Quantity *</label>
              <input 
                className="pro-input" 
                type="number" 
                max="10000"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Max 10,000.</small>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label className="input-label">Expiry Date *</label>
            <input 
              className="pro-input" 
              type="date" 
              min={today}
              value={formData.expiryDate}
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} 
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-add-main" 
            style={{ width: '100%', justifyContent: 'center' }} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Syncing..." : "Confirm Update"}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default AddInventory;