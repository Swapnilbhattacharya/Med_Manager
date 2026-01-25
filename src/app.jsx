import React, { useState, useEffect } from "react";
import { auth, db } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

// Page Imports
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 
import Calendar from "./pages/Calendar"; 
import Setup from "./pages/Join"; 
import AddMed from "./pages/AddMed";

// --- INVENTORY IMPORTS ---
import AddInventory from "./pages/AddInventory"; 
import InventoryList from "./Components/InventoryList"; // Ensure this path matches your folder structure

import TopNav from "./Components/TopNav"; 
import HouseholdFooter from "./Components/HouseholdFooter";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [householdId, setHouseholdId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists() && docSnap.data().householdId) {
            setHouseholdId(docSnap.data().householdId);
          } else {
            setHouseholdId(null); 
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setHouseholdId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="loading-screen"><h2>💊 Syncing...</h2></div>;
  if (!user) return <Login />;

  const currentView = !householdId ? "setup" : view;

  return (
    <div className="app-main-layout" style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <TopNav setView={setView} currentView={currentView} />
      
      <main className="content-container" style={{ padding: '20px' }}>
        
        {currentView === "setup" && <Setup user={user} setView={setView} />}
        
        {currentView === "dashboard" && (
          <Dashboard user={user} householdId={householdId} setView={setView} />
        )}
        
        {currentView === "calendar" && (
          <Calendar user={user} householdId={householdId} setView={setView} />
        )}
        
        {currentView === "addMed" && (
          <AddMed user={user} householdId={householdId} setView={setView} />
        )}

        {/* --- FIX: SHOW LIST WHEN 'STOCK MANAGER' IS CLICKED --- */}
        {currentView === "inventory" && (
          <InventoryList householdId={householdId} setView={setView} />
        )}

        {/* --- FIX: SHOW FORM ONLY WHEN 'ADD STOCK' IS CLICKED --- */}
        {currentView === "addInventory" && (
          <AddInventory householdId={householdId} setView={setView} />
        )}

      </main>
      <HouseholdFooter householdId={householdId} />
    </div>
  );
}