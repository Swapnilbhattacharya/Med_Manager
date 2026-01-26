import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { doc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";

/**
 * 1. SIGN UP
 * Creates an auth account AND a Firestore profile document.
 * UPDATED: Now accepts and saves the mobile number.
 */
export const signUpUser = async (email, password, name, mobile) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create User Profile in Firestore
    // We add 'mobile' to the object below so it saves to the database
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      mobile: mobile, // <--- ADDED THIS LINE
      householdId: null, 
      uid: user.uid,
      createdAt: new Date().toISOString()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error("Sign Up Error:", error);
    throw error;
  }
};

/**
 * 2. LOGIN
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

/**
 * 3. LOGOUT
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw error;
  }
};

/**
 * 4. JOIN HOUSEHOLD
 */
export const joinExistingHousehold = async (householdId, userUid) => {
  try {
    const householdRef = doc(db, "households", householdId);
    const userRef = doc(db, "users", userUid);

    await updateDoc(householdRef, {
      memberIds: arrayUnion(userUid)
    });

    await setDoc(userRef, {
      householdId: householdId
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error joining household:", error);
    throw error;
  }
};