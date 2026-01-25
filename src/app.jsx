import React, { useState, useEffect } from "react";
import { auth, db } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

// Page Imports
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 
import Calendar from "./pages/Calendar"; 
import Setup from "./pages/Join"; // Make sure this matches your file name (Join.jsx)
import AddMed from "./pages/AddMed";
import AddInventory from "./pages/AddInventory"; 
import InventoryList from "./Components/InventoryList"; 
import TopNav from "./Components/TopNav"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  
  // Data States
  const [householdId, setHouseholdId] = useState(null);
  const [userName, setUserName] = useState("");
  const [familyName, setFamilyName] = useState("My Family");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 1. Listen to User Document (Real-time)
        const userRef = doc(db, "users", currentUser.uid);
        
        const unsubUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Set Household ID
            const hId = data.householdId || null;
            setHouseholdId(hId);

            // Set User Name (Fallback to email if name is missing)
            const realName = data.name || currentUser.displayName || currentUser.email.split('@')[0];
            setUserName(realName);

            // 2. Fetch Family Name if ID exists
            if (hId) {
              try {
                const houseSnap = await getDoc(doc(db, "households", hId));
                if (houseSnap.exists()) {
                  setFamilyName(houseSnap.data().name || "My Family");
                }
              } catch (err) {
                console.error("Error fetching family:", err);
              }
            }
          } else {
            // New user with no data doc yet
            setHouseholdId(null);
            setUserName(currentUser.email.split('@')[0]); 
          }
          setLoading(false);
        });

        return () => unsubUser();
      } else {
        setHouseholdId(null);
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
      
      {/* PASSING REAL DATA TO NAV */}
      <TopNav 
        setView={setView} 
        currentView={currentView} 
        user={user} 
        userName={userName}      // <--- Real Name
        familyName={familyName}  // <--- Real Family Name
        householdId={householdId} 
      />
      
      <main className="content-container" style={{ padding: '20px' }}>
        {currentView === "setup" && <Setup user={user} setView={setView} />}
        
        {currentView === "dashboard" && (
          <Dashboard 
            user={user} 
            userName={userName} // <--- Pass Name to Dashboard
            householdId={householdId} 
            setView={setView} 
          />
        )}
        
        {currentView === "calendar" && <Calendar householdId={householdId} setView={setView} />}
        {currentView === "addMed" && <AddMed householdId={householdId} setView={setView} />}
        {currentView === "inventory" && <InventoryList householdId={householdId} setView={setView} />}
        {currentView === "addInventory" && <AddInventory householdId={householdId} setView={setView} />}
      </main>
    </div>
  );
}