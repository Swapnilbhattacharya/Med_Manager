import React, { useState, useEffect } from "react";
import { auth, db } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Page Imports
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 
import Scan from "./pages/Scan"; 
import Calendar from "./pages/Calendar"; 
import Join from "./pages/Join";
import AddMed from "./pages/AddMed";

// Component Import
import TopNav from "./Components/TopNav"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [householdId, setHouseholdId] = useState(null); // 🏠 Added household state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch the user's household ID from their profile
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setHouseholdId(userDoc.data().householdId);
          }
        } catch (err) {
          console.error("Error fetching household ID:", err);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: "#4f46e5", fontFamily: "sans-serif" }}>💊 Med Manager</h2>
          <p style={{ color: "#64748b" }}>Loading your household data...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="app-main-layout" style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <TopNav setView={setView} currentView={view} />

      <main>
        {view === "dashboard" && (
          <Dashboard user={user} householdId={householdId} setView={setView} />
        )}
        
        {view === "calendar" && (
          <Calendar user={user} householdId={householdId} setView={setView} />
        )}
        
        {view === "scan" && (
          <Scan setView={setView} />
        )}

        {view === "join" && (
          <Join user={user} setView={setView} />
        )}

        {view === "addMed" && (
          <AddMed user={user} householdId={householdId} setView={setView} />
        )}
      </main>
    </div>
  );
}