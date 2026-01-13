import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AddMed() {
  const navigate = useNavigate();
  const location = useLocation();

  // Receive barcode from Scan.jsx
  const scannedBarcode = location.state?.barcode || "";

  // Form states
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState(scannedBarcode);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name || !barcode) {
      setError("Medicine name and barcode are required");
      return;
    }

    const newMedicine = {
      id: Date.now(),
      name,
      barcode,
      dosage,
      frequency,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage (demo-friendly)
    const existing = JSON.parse(localStorage.getItem("medicines")) || [];
    localStorage.setItem(
      "medicines",
      JSON.stringify([...existing, newMedicine])
    );

    navigate("/dashboard");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h2>➕ Add Medicine</h2>

      {error && (
        <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>
      )}

      <label>Medicine Name</label>
      <input
        type="text"
        placeholder="e.g. Paracetamol"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inputStyle}
      />

      <label>Barcode</label>
      <input
        type="text"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        style={inputStyle}
      />

      <label>Dosage</label>
      <input
        type="text"
        placeholder="e.g. 500 mg"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        style={inputStyle}
      />

      <label>Frequency</label>
      <input
        type="text"
        placeholder="e.g. Twice a day"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        style={inputStyle}
      />

      <button onClick={handleSave} style={primaryBtn}>
        Save Medicine
      </button>

      <button
        onClick={() => navigate("/scan")}
        style={secondaryBtn}
      >
        Scan Again
      </button>
    </div>
  );
}

// Styles
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const primaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#4caf50",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginBottom: "10px",
};

const secondaryBtn = {
  width: "100%",
  padding: "10px",
  background: "#eee",
  color: "#333",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};