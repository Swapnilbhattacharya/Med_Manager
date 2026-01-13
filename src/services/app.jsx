import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logoutUser } from "./authService";

// 👇 CHANGE IS HERE: We now import from lowercase "./login"
// This matches your file name "login.jsx"
import Login from "./login"; 

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

  
  if (user) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Medication Manager 💊</h1>
        <p>Welcome, {user.email}</p>
        
        <button onClick={logoutUser} style={{ padding: "5px 10px", cursor: "pointer" }}>
          Logout
        </button>
        
        <hr />
        <p>Your medicine cabinet is ready.</p>
      </div>
    );
  }

  return <Login />;
}

export default App;
