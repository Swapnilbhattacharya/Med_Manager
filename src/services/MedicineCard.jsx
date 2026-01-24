import React from "react";

export default function MedicineCard({ name, dose, status, onToggle, onDelete }) {
  return (
    <div 
      className={`med-card ${status.replace(" ", "").toLowerCase()}`}
      onClick={onToggle}
      style={{ 
        position: 'relative', // REQUIRED for absolute positioning of the delete button
        cursor: 'pointer',
        minHeight: '100px' 
      }}
    >
      {/* THIS IS THE DELETE BUTTON - Ensure this block is exactly as shown */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevents the 'Mark Taken' toggle from firing
          onDelete();
        }}
        className="delete-btn"
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: '#ff4b2b', // Bright red so you can see it
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '22px',
          height: '22px',
          cursor: 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          zIndex: 100, // Makes sure it's on top of everything
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        ✕
      </button>

      <div>
        <strong>{name}</strong>
        <p>{dose}</p>
      </div>
      <span>{status}</span>
    </div>
  );
}