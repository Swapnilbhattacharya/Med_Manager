import React, { useState } from "react";
import { joinExistingHousehold } from "../services/authService";
import "./Dashboard.css";

export default function Join({ user, setView }) {
  const [houseId, setHouseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!houseId.trim()) return;

    setIsSubmitting(true);
    try {
      await joinExistingHousehold(houseId, user.uid);
      alert("Welcome to the family! Household joined.");
      window.location.reload(); // Refresh to load the new household data
    } catch (error) {
      alert("Could not find that Household ID. Please double-check with the owner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fbff 0%, #eef2ff 100%)' 
    }}>
      <div className="card" style={{ 
        maxWidth: '450px', 
        width: '90%', 
        padding: '40px', 
        boxShadow: '0 20px 50px rgba(79, 70, 229, 0.1)',
        textAlign: 'center',
        borderRadius: '24px'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '20px' }}>🤝</div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#1e1b4b' }}>Join a Household</h2>
        <p className="subtitle" style={{ marginBottom: '30px' }}>
          Enter the unique Household ID shared by your family member to sync your medications.
        </p>

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', marginLeft: '4px', textTransform: 'uppercase' }}>
              Household ID
            </label>
            <input
              type="text"
              placeholder="e.g. xY79B2... (Ask the owner for this)"
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '6px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <button 
            type="submit" 
            className="primary-btn" 
            disabled={isSubmitting}
            style={{ padding: '16px', fontSize: '16px', marginTop: '10px' }}
          >
            {isSubmitting ? "Connecting..." : "Connect to Household"}
          </button>
        </form>

        <button 
          onClick={() => setView("dashboard")}
          style={{ 
            marginTop: '20px', 
            background: 'none', 
            border: 'none', 
            color: '#64748b', 
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}