import ProgressRing from "./ProgressRing";
import MedicineCard from "./MedicineCard";
import Schedule from "./Schedule";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h3>Good Morning, Sarah 👋</h3>

      <ProgressRing taken={3} total={5} />

      <h4>My Medications</h4>
      <MedicineCard
        name="Atorvastatin"
        dose="20mg | Take 1 Tablet"
        status="Active"
      />
      <MedicineCard
        name="Metformin"
        dose="500mg | Take with food"
        status="Expires Soon"
      />

      <Schedule />
    </div>
  );
}
