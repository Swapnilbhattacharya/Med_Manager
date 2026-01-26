import { db } from "./firebase";
import { 
  collection, addDoc, getDocs, query, orderBy, 
  serverTimestamp, doc, updateDoc, writeBatch, where, increment, getDoc 
} from "firebase/firestore";

const getMedCol = (houseId) => collection(db, "households", houseId, "medicines");

// ... (keep addMedicine and getHouseholdMeds exactly as they are)

export const addMedicine = async (houseId, medData) => {
  if (!houseId) throw new Error("No Household ID found!");
  try {
    const colRef = getMedCol(houseId);
    return await addDoc(colRef, {
      ...medData,
      status: "pending",
      taken: false,
      createdAt: serverTimestamp()
    });
  } catch (error) { console.error("AddMed Error:", error); throw error; }
};

export const getHouseholdMeds = async (houseId, targetUid = null) => {
  if (!houseId) return [];
  try {
    const q = query(getMedCol(houseId), orderBy("time", "asc"));
    const snapshot = await getDocs(q);
    const allMeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (targetUid) {
      return allMeds.filter(med => med.ownerId === targetUid);
    }
    return allMeds;
  } catch (error) { 
    console.error("FetchMeds Error:", error); 
    return []; 
  }
};

/**
 * UPDATED: Handles both status update AND inventory deduction
 */
export const updateMedicationStatus = async (houseId, medId, newStatus) => {
  try {
    const medRef = doc(db, "households", houseId, "medicines", medId);
    
    // 1. Get the medicine details from the schedule
    const medSnap = await getDoc(medRef);
    if (!medSnap.exists()) return;
    
    const medData = medSnap.data();
    const { name, dosage } = medData;

    // 2. Update the status in the schedule
    await updateDoc(medRef, {
      status: newStatus,
      taken: newStatus === "taken"
    });

    // 3. INVENTORY DEDUCTION LOGIC
    if (newStatus === "taken") {
      const invRef = collection(db, "households", houseId, "inventory");
      
      // CRITICAL: Filter by BOTH Name and Dosage to prevent the wrong stock from dropping
      const q = query(
        invRef, 
        where("medicineName", "==", name), 
        where("dosage", "==", Number(dosage)) 
      );

      const invSnap = await getDocs(q);

      if (!invSnap.empty) {
        // Pick the first matching batch
        const stockDoc = invSnap.docs[0];
        const stockRef = doc(db, "households", houseId, "inventory", stockDoc.id);

        await updateDoc(stockRef, {
          quantity: increment(-1)
        });
        console.log(`Deducted 1 from stock: ${name} ${dosage}mg`);
      } else {
        console.warn(`No matching stock found for ${name} ${dosage}mg`);
      }
    }
  } catch (error) { 
    console.error("UpdateStatus Error:", error); 
  }
};

// ... (keep resetDailyStatus and alias as they are)

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

export const getUserMeds = getHouseholdMeds;