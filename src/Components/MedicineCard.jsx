import React from "react";

export default function MedicineCard({ name, dose, status, onToggle }) {
  const isTaken = status === "Taken";

  return (
    <div className={`med-glass-card ${isTaken ? "is-complete" : ""}`}>
      <div className="med-main-info">
        <div className="med-icon-wrapper">{isTaken ? "✅" : "💊"}</div>
        <div>
          <h4 style={{margin: 0, fontSize: '18px'}}>{name}</h4>
          <span className="med-dosage-pill">{dose}</span>
        </div>
      </div>

      <label className="custom-checkbox">
        <input 
          type="checkbox" 
          checked={isTaken} 
          onChange={onToggle} 
          disabled={isTaken} /* Fix: Prevents unchecking */
          style={{width: '20px', height: '20px', cursor: isTaken ? 'default' : 'pointer'}}
        />
        <span style={{marginLeft: '10px', fontWeight: '600', color: isTaken ? '#10b981' : '#64748b'}}>
          {isTaken ? "Taken" : "Mark Taken"}
        </span>
      </label>
    </div>
  );
}
