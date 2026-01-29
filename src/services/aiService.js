// 1. YOUR WORKING KEY
const API_KEY = "AIzaSyCBYYQ_hKc_gL5hTlryZv8e8a4W3yuU9uI"; 

export const getMedicineAlternative = async (userQuery, history = []) => {
  try {
    console.log("🔍 Scanning for available models...");

    // STEP A: Ask Google "What models do I have?" (Your working connection logic)
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const listResp = await fetch(listUrl);
    const listData = await listResp.json();

    if (!listResp.ok) {
      throw new Error(`Key Error: ${listData.error?.message || "Invalid Key"}`);
    }

    // STEP B: Find a model that can 'generateContent'
    const validModel = listData.models?.find(m => 
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name.includes("flash") || m.name.includes("pro"))
    );

    if (!validModel) {
      return "CRITICAL: Your project has no generative models. Go to AI Studio > Create New Project.";
    }

    console.log(`✅ Found Model: ${validModel.name}`);

    // STEP C: Define the Pharmacist Rules (THE NEW PART)
    // This forces the AI to be short and act like a medical app assistant.
    const systemInstruction = `
      Role: You are MedManager, a helpful pocket pharmacist.
      RULES:
      1. Keep answers UNDER 60 WORDS.
      2. Use bullet points for readability.
      3. Be direct and friendly.
      4. Only add a "consult doctor" warning if strictly necessary.
    `;

    // STEP D: Send the request using the valid model
    const chatUrl = `https://generativelanguage.googleapis.com/v1beta/${validModel.name}:generateContent?key=${API_KEY}`;
    
    const payload = {
      contents: [
        // 1. Add previous chat history
        ...history
          .filter((msg, index) => !(index === 0 && msg.role === 'bot'))
          .map(msg => ({
            role: msg.role === 'bot' ? 'model' : 'user',
            parts: [{ text: msg.text }]
          })),
        // 2. Add the User's Question WRAPPED in the System Rules
        { 
          role: "user", 
          parts: [{ text: `${systemInstruction}\n\nUser Question: ${userQuery}` }] 
        }
      ]
    };

    const response = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error?.message);
    
    return data.candidates[0].content.parts[0].text;

  } catch (error) {
    console.error("AI Error:", error);
    return `Connection Failed: ${error.message}`;
  }
};