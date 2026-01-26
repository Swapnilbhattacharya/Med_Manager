import { auth, db } from "./firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  updateProfile,             // NEW: To save name in Auth
  sendEmailVerification,     // NEW: For verification link
  sendPasswordResetEmail     // NEW: For forgot password
} from "firebase/auth";
import { doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

/**
 * 1. SIGN UP
 * Creates account, updates profile name, sends verification, saves to Firestore.
 */
export const signUpUser = async (email, password, name, mobile) => {
  try {
    // A. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // B. Update Display Name (Important for Dashboard display)
    await updateProfile(user, { displayName: name });

    // C. Create User Profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      mobile: mobile, // Preserved your mobile logic
      householdId: null, 
      createdAt: serverTimestamp(),
      role: "member"
    }, { merge: true });

    return user;
  } catch (error) {
    console.error("Sign Up Error:", error);
    throw error;
  }
};

/**
 * 2. SEND VERIFICATION EMAIL
 */
export const sendVerification = async (user) => {
  return sendEmailVerification(user);
};

/**
 * 3. LOGIN
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
 * 4. LOGOUT
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
 * 5. RESET PASSWORD
 */
export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * 6. JOIN HOUSEHOLD (Preserved)
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