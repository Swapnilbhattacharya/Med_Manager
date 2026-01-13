export default function MedicineCard({ name, dose, status }) {
  return (
    <div className={`med-card ${status.replace(" ", "").toLowerCase()}`}>
      <div>
        <strong>{name}</strong>
        <p>{dose}</p>
      </div>
      <span>{status}</span>
    </div>
  );
}
