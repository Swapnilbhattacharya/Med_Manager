// src/services/medService.js
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const getUserMeds = async (uid) => {
  const ref = collection(db, "users", uid, "medicines");
  const snap = await getDocs(ref);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};