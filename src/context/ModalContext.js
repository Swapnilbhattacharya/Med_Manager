import React, { createContext, useContext, useState, useRef } from 'react';
import CustomModal from '../Components/CustomModal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // alert, confirm, prompt
    title: '',
    message: '',
    inputPlaceholder: '',
  });

  // We use a ref to store the 'resolve' function of the Promise
  const awaiter = useRef(null);

  const close = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const showDialog = (type, title, message, placeholder = '') => {
    return new Promise((resolve) => {
      awaiter.current = resolve;
      setModalState({
        isOpen: true,
        type,
        title,
        message,
        inputPlaceholder: placeholder,
      });
    });
  };

  const handleConfirm = (value) => {
    close();
    if (awaiter.current) awaiter.current(value || true);
  };

  const handleCancel = () => {
    close();
    if (awaiter.current) awaiter.current(false); // Return false on cancel
  };

  // --- PUBLIC API ---
  const showAlert = (title, message) => showDialog('alert', title, message);
  const showConfirm = (title, message) => showDialog('confirm', title, message);
  const showPrompt = (title, message, placeholder) => showDialog('prompt', title, message, placeholder);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      <CustomModal 
        {...modalState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
};