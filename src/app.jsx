import React, { useState, useEffect } from "react";
import { auth } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";

// Page Imports
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listener to check if a user is logged in
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", fontFamily: "sans-serif" }}>
        <h2>Initializing Med Manager...</h2>
      </div>
    );
  }

  // GATEKEEPER: If user exists, show Dashboard. Otherwise, show Login.
  return user ? <Dashboard user={user} /> : <Login />;
}

export default App;