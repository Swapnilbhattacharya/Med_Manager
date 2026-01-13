import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProgressRing from "../components/ProgressRing";
import MedicineCard from "../components/MedicineCard";
import Schedule from "../components/Schedule";

export default function Dashboard() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);

  // Load medicines saved from AddMed.jsx
  useEffect(() => {
    const storedMedicines =
      JSON.parse(localStorage.getItem("medicines")) || [];
    setMedicines(storedMedicines);
  }, []);

  return (
    <div className="dashboard" style={{ padding: "20px" }}>
      <h3>Good Morning 👋</h3>

      {/* Progress Ring */}
      <ProgressRing
        taken={0}
        total={medicines.length > 0 ? medicines.length : 1}
      />

      {/* Scan Button */}
      <button
        onClick={() => navigate("/scan")}
        style={{
          margin: "15px 0",
          padding: "10px 16px",
          background: "#4caf50",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        + Scan New Medicine
      </button>

      <h4>My Medications</h4>

      {/* Empty state */}
      {medicines.length === 0 && (
        <p style={{ color: "#777" }}>
          No medicines added yet. Scan one to get started.
        </p>
      )}

      {/* Medicine list */}
      {medicines.map((med) => (
        <MedicineCard
          key={med.id}
          name={med.name}
          dose={med.dosage || "—"}
          status="Active"
        />
      ))}

      {/* Schedule section */}
      <Schedule />
    </div>
  );
}