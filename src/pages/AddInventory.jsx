import React, { useState } from 'react';
import { db } from '../services/firebase'; // Adjust based on your file tree
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const AddInventory = () => {
  const [formData, setFormData] = useState({
    gtin: '',
    batchNumber: '',
    medicineName: '',
    quantity: '',
    expiryDate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Your "Funda": Doc ID = GTIN_Batch
    const docId = `${formData.gtin}_${formData.batchNumber}`;
    
    try {
      await setDoc(doc(db, "Inventory", docId), {
        ...formData,
        quantity: parseInt(formData.quantity),
        lastUpdated: serverTimestamp()
      }, { merge: true });
      alert("Inventory Added!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="form-container-centered">
        <div className="professional-form-card">
          <h2 className="highlight-name" style={{fontSize: '1.5rem', fontWeight: '800'}}>
            Update Stock Levels
          </h2>
          
          <form onSubmit={handleSubmit} className="professional-form-card" style={{padding: 0, boxShadow: 'none'}}>
            <input 
              className="pro-input" 
              placeholder="GTIN (e.g., 890123)" 
              onChange={(e) => setFormData({...formData, gtin: e.target.value})}
            />
            
            <input 
              className="pro-input" 
              placeholder="Medicine Name" 
              onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
            />

            <div className="form-row-double">
              <input 
                className="pro-input" 
                placeholder="Batch (e.g., B99)" 
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
              />
              <input 
                className="pro-input" 
                type="number" 
                placeholder="Quantity" 
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            <input 
              className="pro-input" 
              type="date" 
              onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
            />

            <button type="submit" className="btn-save-main">
              Confirm Inventory Update
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInventory;