import React, { useState, useEffect } from "react"; // Added useState and useEffect here
import { auth } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "./services/authService";

// 👇 Points to your file in the pages folder
import Login from "./pages/login"; 

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // If no user is logged in, show the Login screen
  if (!user) {
    return <Login />;
  }

  // If user is logged in, show the Dashboard
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Medication Manager 💊</h1>
      <p>Welcome, <strong>{user.email}</strong></p>
      
      <button 
        onClick={logoutUser} 
        style={{ 
          padding: "8px 15px", 
          cursor: "pointer",
          backgroundColor: "#ff4d4d",
          color: "white",
          border: "none",
          borderRadius: "5px"
        }}
      >
        Logout
      </button>
      
      <hr style={{ margin: "20px 0" }} />
      <h3>Your Medicine Cabinet</h3>
      <p>Your medicine cabinet is ready. Start adding your meds!</p>
    </div>
  );
}

export default App;