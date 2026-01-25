import { db } from "./firebase";
import { 
  collection, addDoc, getDocs, query, orderBy, 
  serverTimestamp, doc, updateDoc, writeBatch 
} from "firebase/firestore";

// Helper to get the correct collection path
const getMedCol = (houseId) => collection(db, "households", houseId, "medicines");

export const addMedicine = async (houseId, medData) => {
  if (!houseId) throw new Error("No Household ID found!");
  try {
    const colRef = getMedCol(houseId);
    return await addDoc(colRef, {
      ...medData,
      status: "pending", // Critical: ensures it shows up in Schedule
      taken: false,
      createdAt: serverTimestamp()
    });
  } catch (error) { console.error("AddMed Error:", error); throw error; }
};

// UPDATED: Now accepts optional 'targetUid' to filter
export const getHouseholdMeds = async (houseId, targetUid = null) => {
  if (!houseId) return [];
  try {
    // Fetch all household meds first
    const q = query(getMedCol(houseId), orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    const allMeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // FILTER: Only return medicines belonging to the target User
    if (targetUid) {
      return allMeds.filter(med => med.ownerId === targetUid);
    }

    return allMeds;
  } catch (error) { 
    console.error("FetchMeds Error:", error); 
    return []; 
  }
};

export const updateMedicationStatus = async (houseId, medId, newStatus) => {
  try {
    const medRef = doc(db, "households", houseId, "medicines", medId);
    await updateDoc(medRef, {
      status: newStatus,
      taken: newStatus === "taken"
    });
  } catch (error) { console.error("UpdateStatus Error:", error); }
};

export const resetDailyStatus = async (houseId) => {
  try {
    const snapshot = await getDocs(getMedCol(houseId));
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      const ref = doc(db, "households", houseId, "medicines", d.id);
      batch.update(ref, { status: "pending", taken: false });
    });
    const houseRef = doc(db, "households", houseId);
    batch.update(houseRef, { lastResetDate: new Date().toDateString() });
    await batch.commit();
  } catch (error) { console.error("Reset Error:", error); }
};

// ALIAS
export const getUserMeds = getHouseholdMeds;