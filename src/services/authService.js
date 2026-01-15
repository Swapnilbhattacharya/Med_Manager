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
 */
export const signUpUser = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create User Profile in Firestore
    // householdId is null initially so the Dashboard knows to show Join/Create options
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
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
 * Links an existing user to an existing household.
 */
export const joinExistingHousehold = async (householdId, userUid) => {
  try {
    const householdRef = doc(db, "households", householdId);
    const userRef = doc(db, "users", userUid);

    // A. Add user UID to the household's members array
    await updateDoc(householdRef, {
      memberIds: arrayUnion(userUid)
    });

    // B. Update the user's profile to store the householdId
    await setDoc(userRef, {
      householdId: householdId
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error joining household:", error);
    throw error;
  }
};