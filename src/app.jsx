import React, { useState, useEffect } from "react";
import { auth } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";

// 👇 Ensure these folder names (pages) and file names match exactly
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listens to Firebase for the current login session
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Prevents the app from skipping to the wrong page while initializing
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", background: "#f9fafb" }}>
        <h2 style={{ fontFamily: "sans-serif", color: "#4f46e5" }}>Initializing Med Manager...</h2>
      </div>
    );
  }

  // Proper Gatekeeper logic
  return user ? <Dashboard user={user} /> : <Login />;
}

export default App;