export default function ProgressRing({ taken, total }) {
  return (
    <div className="progress-card">
      <div className="circle">
        <h2>{taken}/{total}</h2>
        <p>Meds Taken</p>
      </div>
    </div>
  );
}
