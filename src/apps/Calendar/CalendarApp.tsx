import { useState } from "react";
import { useStore } from "../../os/state/store";

type CalEvent = { id: string; date: string; title: string; color: string };

const COLORS = ["#4f9cf7", "#f97066", "#34d399", "#fbbf24", "#a78bfa"];

const CalendarApp = () => {
  const theme = useStore((s) => s.theme);
  const dark = theme === "dark";
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState("");

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const addEvent = () => {
    if (!selectedDate || !newEventTitle.trim()) return;
    setEvents((prev) => [
      ...prev,
      { id: Date.now().toString(), date: selectedDate, title: newEventTitle.trim(), color: COLORS[prev.length % COLORS.length] },
    ]);
    setNewEventTitle("");
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const eventsForDate = (d: string) => events.filter((e) => e.date === d);

  return (
    <div className="flex h-full">
      {/* Calendar grid */}
      <div className="flex-1 flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button className={`px-3 py-1 rounded-lg text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={prevMonth}>‹</button>
          <h2 className="text-lg font-medium">{monthNames[month]} {year}</h2>
          <button className={`px-3 py-1 rounded-lg text-sm ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`} onClick={nextMonth}>›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div key={d} className={`text-center text-xs font-medium py-1 ${dark ? "text-white/40" : "text-gray-400"}`}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1 flex-1" style={{ gridAutoRows: "1fr" }}>
          {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const key = dateKey(d);
            const dayEvents = eventsForDate(key);
            return (
              <button
                key={d}
                className={`rounded-lg text-sm flex flex-col items-center justify-start pt-1 transition-colors relative ${
                  selectedDate === key
                    ? "bg-blue-500/20 ring-1 ring-blue-400/40"
                    : isToday(d)
                    ? dark ? "bg-white/10" : "bg-blue-50"
                    : dark ? "hover:bg-white/5" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedDate(key)}
              >
                <span className={`${isToday(d) ? "text-blue-400 font-bold" : ""}`}>{d}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Event sidebar */}
      <div className={`w-56 flex-shrink-0 border-l flex flex-col ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
        <div className="p-3 border-b ${dark ? 'border-white/10' : 'border-gray-200'}">
          <h3 className="text-sm font-medium mb-2">
            {selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "Select a date"}
          </h3>
          {selectedDate && (
            <div className="flex gap-1">
              <input
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs outline-none ${dark ? "bg-white/10 focus:bg-white/15" : "bg-white border border-gray-200 focus:border-blue-400"}`}
                placeholder="Add event..."
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addEvent()}
              />
              <button
                className="px-2 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-xs transition-colors"
                onClick={addEvent}
              >
                +
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-2">
          {selectedDate && eventsForDate(selectedDate).length > 0 ? (
            eventsForDate(selectedDate).map((ev) => (
              <div key={ev.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs ${dark ? "hover:bg-white/5" : "hover:bg-gray-100"}`}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="flex-1 truncate">{ev.title}</span>
                <button className={`${dark ? "text-white/30 hover:text-white/60" : "text-gray-300 hover:text-gray-500"}`} onClick={() => removeEvent(ev.id)}>×</button>
              </div>
            ))
          ) : (
            <div className={`text-xs p-2 ${dark ? "text-white/30" : "text-gray-400"}`}>
              {selectedDate ? "No events" : "Select a date to view events"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarApp;
