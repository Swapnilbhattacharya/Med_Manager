import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const Dashboard = () => {
  const [hasHousehold, setHasHousehold] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserStatus = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        // If they have a householdId that is NOT their own UID, 
        // or if you've marked them as 'setup: true'
        if (userDoc.exists() && userDoc.data().householdId) {
          setHasHousehold(true);
        }
      }
      setLoading(false);
    };
    checkUserStatus();
  }, []);

  if (loading) return <div>Loading...</div>;

  // If the user hasn't joined a specific house yet, show the choice screen
  if (!hasHousehold) {
    return (
      <div style={styles.container}>
        <h1>Welcome! How would you like to start?</h1>
        <div style={styles.buttonGroup}>
          <button onClick={() => setHasHousehold(true)} style={styles.btnCreate}>
            🏠 Create My Own Household
          </button>
          <button onClick={() => navigate('/join')} style={styles.btnJoin}>
            🔗 Join an Existing Household
          </button>
        </div>
      </div>
    );
  }

  // If they HAVE a household, show the actual medication manager
  return (
    <div>
      <h1>Your Medication Dashboard</h1>
      {/* Rest of your existing Dashboard code goes here */}
    </div>
  );
};

const styles = {
  container: { textAlign: 'center', marginTop: '50px', padding: '20px' },
  buttonGroup: { display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' },
  btnCreate: { padding: '15px 25px', backgroundColor: '#4A90E2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnJoin: { padding: '15px 25px', backgroundColor: '#50E3C2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default Dashboard;