import React, { useState } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import "./Inventory.css";

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
    // Unique ID per combination of GTIN and Batch
    const docId = `${formData.gtin.trim()}_${formData.batchNumber.trim()}`;
    
    try {
      /** * PATH: households/{householdId}/inventory/{docId} 
       * This creates a sub-collection unique to the household
       */
      const inventoryRef = doc(db, "households", householdId, "inventory", docId);

      await setDoc(inventoryRef, {
        ...formData,
        gtin: formData.gtin.trim(),
        batchNumber: formData.batchNumber.trim(),
        quantity: qty,
        lastUpdated: serverTimestamp()
      }, { merge: true }); // merge: true handles the "Update if exists" logic
      
      alert("Inventory synced for your household! ✨");
      setView("dashboard");
    } catch (err) {
      console.error(err);
      alert("Error updating household inventory.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inventory-container">
      <div className="inventory-card">
        <div className="card-header">
          <h2>Household Stock</h2>
          <p>ID: {householdId.substring(0, 8)}...</p>
        </div>
        
        <form onSubmit={handleSubmit} className="inventory-form">
          <div className="input-group">
            <label>Product GTIN</label>
            <input 
              className="inv-input" 
              placeholder="e.g. 890123" 
              value={formData.gtin}
              onChange={(e) => setFormData({...formData, gtin: e.target.value})}
              required
            />
          </div>
          
          <div className="input-group">
            <label>Medicine Name</label>
            <input 
              className="inv-input" 
              placeholder="Medicine Name" 
              value={formData.medicineName}
              onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
            />
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Batch</label>
              <input 
                className="inv-input" 
                placeholder="Batch" 
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                required
              />
            </div>
            <div className="input-group">
              <label>Quantity</label>
              <input 
                className="inv-input" 
                type="number" 
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Expiry Date</label>
            <input className="inv-input" type="date" onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
          </div>

          <button type="submit" className="inv-btn" disabled={isSubmitting}>
            {isSubmitting ? "Syncing..." : "Confirm Update"}
          </button>
          
          <button type="button" className="btn-back-text" onClick={() => setView("dashboard")}>
            Return to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;