import React, { useState } from "react";
import { getAIResponse } from "../services/aiService";

export default function AIChat({ meds }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([{ role: "ai", text: "Hello! Ask me anything about your meds." }]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const aiRes = await getAIResponse(input, meds);
    setMessages((prev) => [...prev, { role: "ai", text: aiRes }]);
    setLoading(false);
  };

  return (
    <div className="ai-chat-box">
      <div className="chat-display">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
        ))}
        {loading && <div className="bubble ai">...typing</div>}
      </div>
      <div className="chat-input">
        <input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a question..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}