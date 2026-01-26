import React, { useState, useEffect } from "react";
import { auth, db } from "./services/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";

// Page Imports
import Login from "./pages/login"; 
import Dashboard from "./pages/Dashboard"; 
import Calendar from "./pages/Calendar"; 
import Setup from "./pages/Join"; 
import AddMed from "./pages/AddMed";
import AddInventory from "./pages/AddInventory"; 
import InventoryList from "./Components/InventoryList"; 
import TopNav from "./Components/TopNav"; 
import SwitchUser from "./pages/SwitchUser"; 
import Settings from "./pages/Settings"; 

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  
  const [householdId, setHouseholdId] = useState(null);
  const [userName, setUserName] = useState("");
  const [familyName, setFamilyName] = useState("My Family");
  
  // NEW: Store the Admin's ID to check roles
  const [adminUid, setAdminUid] = useState(null);

  const [monitoringTarget, setMonitoringTarget] = useState(null); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const unsubUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const hId = data.householdId || null;
            setHouseholdId(hId);
            const realName = data.name || currentUser.displayName || currentUser.email.split('@')[0];
            setUserName(realName);

            if (hId) {
              try {
                const houseSnap = await getDoc(doc(db, "households", hId));
                if (houseSnap.exists()) {
                  const houseData = houseSnap.data();
                  setFamilyName(houseData.name || "My Family");
                  setAdminUid(houseData.admin); // Store Admin ID
                }
              } catch (err) { console.error(err); }
            }
          } else {
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

  const targetUid = monitoringTarget?.uid || user.uid;
  const targetName = monitoringTarget?.name || userName;

  return (
    <div className="app-main-layout" style={{ minHeight: "100vh", background: "#f8fbff" }}>
      
      <TopNav 
        setView={setView} 
        currentView={currentView} 
        user={user} 
        userName={userName}      
        familyName={familyName}  
        householdId={householdId}
        adminUid={adminUid} // Pass Admin ID to TopNav
        setMonitoringTarget={setMonitoringTarget}
        monitoringTarget={monitoringTarget}
      />

      {monitoringTarget && (
        <div style={{ background: '#fef3c7', color: '#92400e', textAlign: 'center', padding: '8px', fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid #fcd34d' }}>
          👁️ CAREGIVER MODE: You are managing {monitoringTarget.name}.
        </div>
      )}
      
      <main className="content-container" style={{ padding: '20px' }}>
        {currentView === "setup" && <Setup user={user} setView={setView} />}
        
        {currentView === "dashboard" && (
          <Dashboard 
            user={user} userName={targetName} householdId={householdId} setView={setView}
            targetUid={targetUid} isMonitoring={!!monitoringTarget} 
          />
        )}
        
        {currentView === "calendar" && (
          <Calendar householdId={householdId} setView={setView} targetUid={targetUid} />
        )}
        
        {currentView === "addMed" && (
          <AddMed 
            householdId={householdId} setView={setView} targetUid={targetUid} targetName={targetName}   
          />
        )}
        
        {currentView === "inventory" && <InventoryList householdId={householdId} setView={setView} />}
        {currentView === "addInventory" && <AddInventory householdId={householdId} setView={setView} />}
        {currentView === "switchUser" && <SwitchUser householdId={householdId} setView={setView} currentUser={user} />}
        
        {currentView === "settings" && (
          <Settings user={user} householdId={householdId} setView={setView} />
        )}
      </main>
    </div>
  );
}