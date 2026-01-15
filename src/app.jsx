import React, { useState, useEffect } from "react";
import { auth } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";

// ⚠️ FIXED PATHS: Using lowercase to match your actual files
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 
import Scan from "./pages/Scan"; 
import Calendar from "./pages/Calendar"; 
import Join from "./pages/Join"; 

// Component Import
import TopNav from "./Components/TopNav"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 🧭 VIEW CONTROLLER
  const [view, setView] = useState("dashboard");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 1. LOADING STATE
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: 'center' }}>
           <h2 style={{ color: "#4f46e5", fontFamily: "sans-serif" }}>💊 Med Manager</h2>
           <p style={{ color: "#64748b" }}>Syncing your household...</p>
        </div>
      </div>
    );
  }

  // 2. AUTH GATEKEEPER
  if (!user) return <Login />;

  // 3. MAIN APP
  return (
    <div className="app-main-wrapper" style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <TopNav setView={setView} currentView={view} />

      <main>
        {view === "dashboard" && (
          <Dashboard user={user} setView={setView} />
        )}
        
        {view === "calendar" && (
          <Calendar user={user} setView={setView} />
        )}
        
        {view === "scan" && (
          <Scan user={user} setView={setView} />
        )}

        {view === "join" && (
          <Join user={user} setView={setView} />
        )}
      </main>
    </div>
  );
}