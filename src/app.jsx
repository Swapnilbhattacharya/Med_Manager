import React, { useState, useEffect } from "react";
import { auth } from "./services/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Page Imports
import Login from "./pages/login";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Calendar from "./pages/Calendar";

// Component Import
import TopNav from "./Components/TopNav";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // Controls which page shows

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}><h2>Initializing...</h2></div>;
  if (!user) return <Login />;

  return (
    <div className="app-container">
      {/* 🛡️ RENDER TOPNAV ONLY ONCE HERE */}
      <TopNav setView={setView} currentView={view} />

      <main>
        {view === "dashboard" && <Dashboard user={user} setView={setView} />}
        {view === "calendar" && <Calendar setView={setView} />}
        {view === "scan" && <Scan setView={setView} />}
      </main>
    </div>
  );
}