import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PASTE YOUR KEYS FROM FIREBASE CONSOLE HERE
const firebaseConfig = {
  apiKey: "AIzaSyDxbTRhppNnsSdlt53Hmekxl3wgICHEoOQ",
  authDomain: "medicationmanager-1eb47.firebaseapp.com",
  projectId: "medicationmanager-1eb47",
  storageBucket: "medicationmanager-1eb47.firebasestorage.app",
  messagingSenderId: "425584456938",
  appId: "1:425584456938:web:1108f7e0b4d7a431615393"
};

const app = initializeApp(firebaseConfig);

// These are the "tools" your team will use
export const auth = getAuth(app); // For Login (Alisha)
export const db = getFirestore(app); // For Meds (You)
;
