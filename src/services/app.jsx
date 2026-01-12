import { useEffect, useState } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import Login from "./Login";
import { logoutUser } from "./authService";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // This listener runs automatically when auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Medication Manager 💊</h1>
      <p>Welcome, {user.email}</p>
      <button onClick={logoutUser}>Logout</button>
      
      {/* NEXT STEP: Your AddMedication component will go here */}
      <hr />
      <p>No meds yet...</p>
    </div>
  );
}

export default App;
