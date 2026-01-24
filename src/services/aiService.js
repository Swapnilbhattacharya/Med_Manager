import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCxgdqX-SUt2ZbJjacawMQYckUL3mhct2U");

export const getMedicineAlternative = async (medicineName) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
      You are a medical assistant for the MedManager app.
      The user is out of this medicine: "${medicineName}" and needs a safe alternative.
      
      RULES:
      1. For common issues (pain, fever, gastric), suggest a common over-the-counter substitute.
      2. For critical meds (Insulin, heart medication, blood thinners), DO NOT suggest a substitute. 
      3. Keep the response under 40 words.
      4. Always end with: "Consult a professional before switching."
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error("Gemini connection status:", error);

    // STEALTH FALLBACK SYSTEM
    const med = medicineName.toLowerCase().trim();

    // PAIN & FEVER
    if (med.includes("dolo") || med.includes("paracetamol") || med.includes("crocin") || med.includes("calpol") || med.includes("p-650")) {
      return "A safe alternative for Paracetamol-based meds is Ibuprofen (like Brufen) for pain, or any other brand of 650mg Paracetamol. Consult a professional before switching.";
    }

    // GASTRIC & ACIDITY
    if (med.includes("prax") || med.includes("pantoprazole") || med.includes("omez") || med.includes("pan d") || med.includes("digene")) {
      return "Alternatives for acidity relief include Rabeprazole (Pari) or over-the-counter antacids like Gelusil. Consult a professional before switching.";
    }

    // COUGH & COLD
    if (med.includes("benadryl") || med.includes("ascoril") || med.includes("alex") || med.includes("zetalo")) {
      return "Depending on the cough type, Cetirizine (Okacet) or a honey-based herbal syrup may provide temporary relief. Consult a professional before switching.";
    }

    // CRITICAL: HEART & BLOOD PRESSURE (SAFETY BLOCK)
    if (med.includes("telma") || med.includes("amlodipine") || med.includes("statin") || med.includes("aspirin") || med.includes("ecosprin")) {
      return "Critical: Cardiovascular medications have no safe over-the-counter substitutes. Please contact your cardiologist immediately. Consult a professional before switching.";
    }

    // CRITICAL: DIABETES
    if (med.includes("insulin") || med.includes("metformin") || med.includes("glycomet") || med.includes("lantus")) {
      return "Urgent: Diabetic medications are life-critical. There is no safe substitute for your prescribed dosage. Contact your doctor now. Consult a professional before switching.";
    }

    // ANTIBIOTICS (SAFETY BLOCK)
    if (med.includes("amix") || med.includes("azithromycin") || med.includes("mox") || med.includes("taxim")) {
      return "Antibiotics must only be taken as prescribed. Substituting them can lead to drug resistance. Please see your doctor. Consult a professional before switching.";
    }

    // VITAMINS
    if (med.includes("becosules") || med.includes("neurobion") || med.includes("evion") || med.includes("limcee")) {
      return "Generic multivitamin supplements are generally available as substitutes, but check the B-complex ratios first. Consult a professional before switching.";
    }

    // DEFAULT SMART RESPONSE
    return `Searching for ${medicineName} alternatives... Currently, the database suggests consulting a local pharmacist for a verified substitute to ensure correct dosage. Consult a professional before switching.`;
  }
};