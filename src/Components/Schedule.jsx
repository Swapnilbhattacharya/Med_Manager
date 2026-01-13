export default function Schedule() {
  return (
    <div className="schedule">
      <h4>Today's Schedule</h4>

      <div className="time-block">
        🌅 8:00 AM — Lisinopril <span className="done">Taken</span>
      </div>

      <div className="time-block">
        ☀️ 1:00 PM — Vitamin D3 <span className="upcoming">Upcoming</span>
      </div>

      <div className="time-block">
        🌙 9:00 PM — Metformin <span className="upcoming">Upcoming</span>
      </div>
    </div>
  );
}
