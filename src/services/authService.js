import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// 1. SIGN UP (Creates User + Household)
export const signUpUser = async (email, password, name) => {
  try {
    // A. Create the Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // B. Create the Household (Using User ID as House ID for MVP simplicity)
    await setDoc(doc(db, "households", user.uid), {
      name: `${name}'s Household`,
      ownerId: user.uid,
      memberIds: [user.uid] // Important: Add them to the list!
    });

    // C. Create User Profile linked to that House
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      householdId: user.uid 
    });

    return user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// 2. LOGIN
export const loginUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// 3. LOGOUT
export const logoutUser = () => {
  return signOut(auth);
};