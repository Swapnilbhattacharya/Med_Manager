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
import AddInventory from "./pages/AddInventory"; // 1. IMPORT YOUR NEW PAGE
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

      <main>
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

        {/* 2. ADD THE INVENTORY VIEW CASE */}
        {currentView === "inventory" && (
          <AddInventory user={user} householdId={householdId} setView={setView} />
        )}
      </main>

      <HouseholdFooter householdId={householdId} />
    </div>
  );
}