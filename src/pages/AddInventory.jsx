import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import "./Dashboard.css"; 

const AddInventory = ({ householdId, setView }) => {
  const [formData, setFormData] = useState({
    gtin: '',
    batchNumber: '',
    medicineName: '',
    quantity: '',
    dosage: '', // Added Dosage State
    expiryDate: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. GTIN Validation
    if (!/^\d+$/.test(formData.gtin.trim())) {
      alert("GTIN must contain only numbers.");
      return;
    }

    // 2. Quantity Constraint
    const qty = parseInt(formData.quantity);
    if (isNaN(qty) || qty < 1) {
      alert("Please enter a valid quantity.");
      return;
    }

    // 3. Dosage Constraint (Max 1000mg)
    const dose = parseInt(formData.dosage);
    if (isNaN(dose) || dose < 1) {
      alert("Please enter a valid dosage.");
      return;
    }
    if (dose > 1000) {
      alert("Dosage cannot exceed 1000mg per entry.");
      return;
    }

    // 4. Expiry Date Validation
    if (formData.expiryDate && formData.expiryDate < today) {
      alert("The expiry date cannot be in the past.");
      return;
    }

    setIsSubmitting(true);
    
    const cleanBatch = formData.batchNumber.trim().toUpperCase();
    const cleanMedName = formData.medicineName.trim().toUpperCase();
    
    // UPDATE: Include dose in the ID so 500mg and 650mg are different documents
    const docId = `${formData.gtin.trim()}_${dose}_${cleanBatch}`;
    
    try {
      const inventoryRef = doc(db, "households", householdId, "inventory", docId);

      await setDoc(inventoryRef, {
        ...formData,
        gtin: formData.gtin.trim(),
        medicineName: cleanMedName,
        batchNumber: cleanBatch,
        quantity: qty,
        dosage: dose, 
        lastUpdated: serverTimestamp()
      }, { merge: true });
    
 
      
      setShowToast(true);
      setTimeout(() => setView("inventory"), 1500); 
    } catch (err) {
      console.error("Firestore Error:", err);
      alert("Error updating household inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dashboard-wrapper">
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
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
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Medicine Name *</label>
            <input 
              className="pro-input" 
              placeholder="e.g. PARACETAMOL" 
              value={formData.medicineName}
              onChange={(e) => setFormData({...formData, medicineName: e.target.value.toUpperCase()})}
              required
            />
          </div>

          <div className="days-row-container" style={{ marginBottom: '20px', display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Batch Number *</label>
              <input 
                className="pro-input" 
                placeholder="LOT123" 
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value.toUpperCase()})}
                required
              />
            </div>

            {/* NEW DOSAGE FIELD */}
            <div style={{ flex: 1 }}>
              <label className="input-label">Dosage (mg) *</label>
              <input 
                className="pro-input" 
                type="number" 
                placeholder="500"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                required
              />
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Max 1000mg.</small>
            </div>
          </div>

          <div className="days-row-container" style={{ marginBottom: '30px', display: 'flex', gap: '15px' }}>
             <div style={{ flex: 1 }}>
              <label className="input-label">Quantity *</label>
              <input 
                className="pro-input" 
                type="number" 
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
            
            <div style={{ flex: 1 }}>
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