import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const getMedicineAlternative = async (userQuery, history = []) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // FIX: Gemini history MUST start with 'user'. We filter out the bot greeting if it's first.
    const validHistory = history
      .filter((msg, index) => !(index === 0 && msg.role === 'bot')) 
      .map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

    const chat = model.startChat({
      history: validHistory,
      generationConfig: { maxOutputTokens: 250, temperature: 0.7 },
    });

    const result = await chat.sendMessage(userQuery);
    return result.response.text();

  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Safety Fallback for offline/invalid key scenarios
    return "I'm having a connection hiccup. Please ensure your .env file is set up and restart your dev server. Consult a professional before switching.";
  }
};