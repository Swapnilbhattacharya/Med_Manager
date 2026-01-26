import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../pages/Dashboard.css'; // Uses your existing styles

export default function CustomModal({ isOpen, type, title, message, onConfirm, onCancel, inputPlaceholder }) {
  const [inputValue, setInputValue] = React.useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
    setInputValue("");
  };

  const handleCancel = () => {
    onCancel();
    setInputValue("");
  };

  // Determine colors based on type
  const isDanger = title.toLowerCase().includes('delete') || title.toLowerCase().includes('destroy');
  const icon = type === 'alert' ? '⚠️' : type === 'prompt' ? '📝' : isDanger ? '🚨' : '🤔';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'white', padding: '25px', borderRadius: '20px',
            width: '90%', maxWidth: '400px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>{icon}</div>
          
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.25rem' }}>
            {title}
          </h3>
          
          <p style={{ margin: '0 0 20px 0', color: '#64748b', lineHeight: '1.5' }}>
            {message}
          </p>

          {type === 'prompt' && (
            <input 
              autoFocus
              className="pro-input"
              style={{ width: '100%', marginBottom: '20px' }}
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {type !== 'alert' && (
              <button 
                onClick={handleCancel}
                style={{
                  padding: '10px 20px', borderRadius: '10px', border: '1px solid #e2e8f0',
                  background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer', flex: 1
                }}
              >
                Cancel
              </button>
            )}
            
            <button 
              onClick={handleConfirm}
              style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: isDanger ? '#ef4444' : '#3b82f6', 
                color: 'white', fontWeight: '600', cursor: 'pointer', flex: 1,
                boxShadow: isDanger ? '0 4px 12px rgba(239, 68, 68, 0.3)' : '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              {type === 'alert' ? 'OK' : isDanger ? 'Confirm Delete' : 'Confirm'}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}