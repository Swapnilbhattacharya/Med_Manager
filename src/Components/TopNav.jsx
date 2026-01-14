import "./TopNav.css";
export default function TopNav() {
  return (
    <div className="top-nav">
      <h2 className="logo">Medication Manager</h2>

      <div className="nav-links">
        <button className="active">Dashboard</button>
        <button>Scan</button>
        <button>Calendar</button>
        <button>Profile</button>
      </div>
    </div>
  );
}
