export default function MedicineCard({ name, dose, status = "pending" }) {
  // Use a fallback to 'pending' if status is missing to prevent the .replace() crash
  const safeStatus = status || "pending";
  
  return (
    <div className={`med-card ${safeStatus.replace(/\s+/g, "").toLowerCase()}`}>
      <div>
        <strong>{name}</strong>
        <p>{dose}</p>
      </div>
      <span>{safeStatus}</span>
    </div>
  );
}