import React, { useState } from 'react';

export default function HouseholdFooter({ householdId }) {
  const [copied, setCopied] = useState(false);

  if (!householdId) return null; // Don't show if the user hasn't joined a house yet

  const handleCopy = () => {
    navigator.clipboard.writeText(householdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset "Copied" message after 2 seconds
  };

  return (
    <div style={styles.footer}>
      <div style={styles.content}>
        <span style={styles.label}>HOUSEHOLD ID:</span>
        <code style={styles.idCode}>{householdId}</code>
        <button onClick={handleCopy} style={styles.copyBtn}>
          {copied ? "✅ Copied!" : "📋 Copy ID"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    maxWidth: '1200px',
    width: '100%',
    justifyContent: 'center'
  },
  label: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '1px'
  },
  idCode: {
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#475569',
    fontFamily: 'monospace',
    border: '1px solid #cbd5e0'
  },
  copyBtn: {
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  }
};