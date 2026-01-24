import React from 'react';
import { motion } from 'framer-motion';

export default function MedicineCard({ name, dose, status, onToggle, onDelete }) {
  const isTaken = status === "Taken";

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`med-row-card ${isTaken ? 'is-taken' : ''}`}
    >
      <div className="med-main-content">
        {/* CUSTOM ANIMATED CHECKBOX */}
        <div className="checkbox-wrapper" onClick={onToggle}>
          <motion.div 
            initial={false}
            animate={{ 
              backgroundColor: isTaken ? "#10b981" : "transparent",
              borderColor: isTaken ? "#10b981" : "#cbd5e1"
            }}
            whileTap={{ scale: 0.9 }}
            className="custom-checkbox"
          >
            {isTaken && (
              <motion.svg 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                viewBox="0 0 24 24"
              >
                <path fill="none" stroke="white" strokeWidth="4" d="M5 13l4 4L19 7" />
              </motion.svg>
            )}
          </motion.div>
        </div>

        {/* SIDE-BY-SIDE INFO */}
        <div className="med-details">
          <h4 className={isTaken ? 'strikethrough' : ''}>{name}</h4>
          <p>{dose}</p>
        </div>
      </div>

      <button className="delete-med-btn" onClick={onDelete}>✕</button>
    </motion.div>
  );
}