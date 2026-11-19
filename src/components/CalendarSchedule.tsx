import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import {
  formatDisplayDate,
  formatDisplayTime,
  formatShortDateParts,
  isPastEvent,
} from '@/src/lib/eventMedia';
import type { CampusEvent } from '@/src/types/eventhub';

interface CalendarScheduleProps {
  events: CampusEvent[];
  registeredEventIds: Set<string>;
  onSelectEvent: (event: CampusEvent) => void;
  mode: 'compact' | 'full';
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarSchedule({
  events,
  registeredEventIds,
  onSelectEvent,
  mode,
}: CalendarScheduleProps) {
  const [cursorDate, setCursorDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CampusEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.eventDate) || [];
      list.push(ev);
      map.set(ev.eventDate, list);
    }
    return map;
  }, [events]);

  const upcomingEvents = useMemo(
    () => events.filter((ev) => !isPastEvent(ev.startAtMs)).slice(0, 6),
    [events]
  );

  if (mode === 'compact') {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
              Upcoming Campus Schedule
            </h2>
            <p className="text-xs text-slate-500">
              Chronological calendar view of the next scheduled campus events
            </p>
          </div>
          <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">No upcoming events scheduled</p>
            <p className="text-xs text-slate-500 mt-1">
              Upcoming campus dates will appear here once published.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingEvents.map((ev) => {
              const parts = formatShortDateParts(ev.eventDate);
              const isRegistered = registeredEventIds.has(ev.id);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="w-full py-3.5 flex items-center gap-4 text-left hover:bg-slate-50 rounded-lg px-2 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0B1B3B] text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium uppercase text-blue-200 leading-none">
                      {parts.month}
                    </span>
                    <span className="font-mono text-base font-bold tabular-nums leading-tight mt-0.5">
                      {parts.day}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0B1B3B] truncate">
                        {ev.title}
                      </p>
                      {isRegistered && (
                        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                          Registered
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate tabular-nums">
                      {ev.category} · {formatDisplayTime(ev.eventTime)} · {ev.venue}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = new Date().toISOString().slice(0, 10);

  const monthCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) monthCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) monthCells.push(d);
  while (monthCells.length % 7 !== 0) monthCells.push(null);

  const monthLabel = cursorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const agendaEvents = selectedDayIso
    ? eventsByDate.get(selectedDayIso) || []
    : upcomingEvents;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <section className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B1B3B]">{monthLabel}</h2>
            <p className="text-xs text-slate-500">
              Select a highlighted date to inspect scheduled campus events
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDayIso(null);
                setCursorDate(new Date(year, month - 1, 1));
              }}
              aria-label="Previous month"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setSelectedDayIso(null);
                setCursorDate(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDayIso(null);
                setCursorDate(new Date(year, month + 1, 1));
              }}
              aria-label="Next month"
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-slate-200 rounded-lg overflow-hidden">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="bg-slate-50 border-r border-b border-slate-200 py-2 text-center text-xs font-semibold text-slate-600"
            >
              {day}
            </div>
          ))}

          {monthCells.map((dayNum, idx) => {
            if (!dayNum) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[86px] bg-slate-50/40 border-r border-b border-slate-200"
                />
              );
            }
            const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(
              2,
              '0'
            )}`;
            const dayEvents = eventsByDate.get(iso) || [];
            const isSelected = selectedDayIso === iso;
            const isToday = todayIso === iso;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDayIso(isSelected ? null : iso)}
                className={`min-h-[86px] p-2 border-r border-b border-slate-200 text-left flex flex-col justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 ring-1 ring-inset ring-blue-600'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <span
                  className={`font-mono text-xs tabular-nums font-semibold w-6 h-6 inline-flex items-center justify-center rounded-md ${
                    isToday
                      ? 'bg-[#0B1B3B] text-white'
                      : isSelected
                        ? 'text-blue-700'
                        : 'text-slate-700'
                  }`}
                >
                  {dayNum}
                </span>

                <div className="space-y-1 w-full mt-1">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[11px] font-medium px-1.5 py-0.5 rounded truncate ${
                        registeredEventIds.has(ev.id)
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <p className="text-[10px] text-slate-500 font-medium px-1 tabular-nums">
                      +{dayEvents.length - 2} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#0B1B3B]">
              {selectedDayIso ? formatDisplayDate(selectedDayIso) : 'Next Upcoming Events'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedDayIso ? 'Events scheduled on selected date' : 'Click any calendar date to filter'}
            </p>
          </div>
          {selectedDayIso && (
            <button
              type="button"
              onClick={() => setSelectedDayIso(null)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Show All
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700">No events on this date</p>
            <p className="text-xs text-slate-500 mt-1">
              Select another highlighted date or clear the filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendaEvents.map((ev) => {
              const isRegistered = registeredEventIds.has(ev.id);
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="w-full p-4 rounded-lg border border-slate-200 hover:border-blue-300 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="text-slate-500 font-medium">{ev.category}</span>
                    {isRegistered && (
                      <span className="text-emerald-700 font-semibold">Registered</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0B1B3B] mb-2">{ev.title}</p>
                  <div className="space-y-1 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDisplayDate(ev.eventDate)} · {formatDisplayTime(ev.eventTime)}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{ev.venue}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
