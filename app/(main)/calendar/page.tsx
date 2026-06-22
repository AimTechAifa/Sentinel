import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { releases } from "@/lib/dummy-data";

export default function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleString("en-AU", { month: "long", year: "numeric" });

  const releasesByDay: Record<number, typeof releases> = {};
  releases.forEach((r) => {
    const d = new Date(r.targetDate);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      if (!releasesByDay[day]) releasesByDay[day] = [];
      releasesByDay[day].push(r);
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
  for (let day = 1; day <= daysInMonth; day++) {
    const dayReleases = releasesByDay[day] ?? [];
    cells.push(
      <div key={day} className="min-h-[80px] border border-slate-100 p-2 rounded-lg bg-white">
        <span className="text-xs font-medium text-gray-500">{day}</span>
        <div className="mt-1 space-y-1">
          {dayReleases.map((r) => (
            <div key={r.id} className="text-xs truncate">
              <StatusBadge status={r.status} className="text-[10px] px-1.5 py-0" />
              <span className="ml-1 text-gray-600">{r.version}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Release Calendar" subtitle={monthName} />
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
        ))}
        {cells}
      </div>
    </div>
  );
}
