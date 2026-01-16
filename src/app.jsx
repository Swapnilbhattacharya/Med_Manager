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

// Component Imports
import TopNav from "./Components/TopNav"; 
import HouseholdFooter from "./Components/HouseholdFooter";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [householdId, setHouseholdId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch the user's profile to find their Household ID
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setHouseholdId(userDoc.data().householdId);
          }
        } catch (err) {
          console.error("Error syncing household:", err);
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
          <p style={{ color: "#64748b" }}>Syncing your family schedule...</p>
        </div>
      </div>
    );
  }

  // 1. If no user, show only the Login page
  if (!user) return <Login />;

  // 2. Main App (Once logged in)
  return (
    <div className="app-main-layout" style={{ minHeight: "100vh", background: "#f8fbff", paddingBottom: '70px' }}>
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

      {/* Persistent footer so the ID is always visible */}
      <HouseholdFooter householdId={householdId} />
    </div>
  );
}