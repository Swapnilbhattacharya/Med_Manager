import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

/**
 * 1. ADD MEDICINE
 * Strictly saves to the household's shared collection.
 */
export const addMedicine = async (householdId, medData) => {
  if (!householdId) {
    throw new Error("Cannot add medicine: No Household ID found. Please create/join a household first.");
  }
  
  try {
    // Path: households/{householdId}/medicines
    const medRef = collection(db, "households", householdId, "medicines");
    return await addDoc(medRef, {
      ...medData,
      taken: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Database Write Error:", error);
    throw error;
  }
};

/**
 * 2. GET HOUSEHOLD MEDS
 * Strictly fetches from the household's shared collection.
 */
export const getHouseholdMeds = async (householdId) => {
  if (!householdId) return [];
  
  try {
    const medRef = collection(db, "households", householdId, "medicines");
    // Sort by time so 8:00 AM appears before 9:00 PM
    const q = query(medRef, orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Database Read Error:", error);
    return [];
  }
};

// Alias to keep Dashboard from crashing
export const getUserMeds = getHouseholdMeds;