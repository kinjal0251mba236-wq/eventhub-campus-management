import { useMemo } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { formatDisplayDate, formatDisplayTime, isPastEvent } from '@/src/lib/eventMedia';
import type { CampusEvent, EventRegistration } from '@/src/types/eventhub';

interface MyRegistrationsViewProps {
  events: CampusEvent[];
  registrations: EventRegistration[];
  loading: boolean;
  onSelectEvent: (event: CampusEvent) => void;
  onUnregister: (event: CampusEvent) => void;
  onBrowseEvents: () => void;
  busyEventId: string | null;
}

export function MyRegistrationsView({
  events,
  registrations,
  loading,
  onSelectEvent,
  onUnregister,
  onBrowseEvents,
  busyEventId,
}: MyRegistrationsViewProps) {
  const eventMap = useMemo(() => {
    const map = new Map<string, CampusEvent>();
    for (const ev of events) map.set(ev.id, ev);
    return map;
  }, [events]);

  const enriched = useMemo(() => {
    return registrations
      .map((reg) => ({
        registration: reg,
        event: eventMap.get(reg.eventId),
      }))
      .filter((item): item is { registration: EventRegistration; event: CampusEvent } =>
        Boolean(item.event)
      )
      .sort((a, b) => a.event.startAtMs - b.event.startAtMs);
  }, [registrations, eventMap]);

  const upcomingRegistrations = enriched.filter((item) => !isPastEvent(item.event.startAtMs));
  const pastRegistrations = enriched
    .filter((item) => isPastEvent(item.event.startAtMs))
    .sort((a, b) => b.event.startAtMs - a.event.startAtMs);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-3" />
        <h2 className="font-display text-lg font-bold text-[#0B1B3B] mb-1">
          No Event Registrations Yet
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Your personal registration history will track every upcoming and past campus event you join.
        </p>
        <button
          type="button"
          onClick={onBrowseEvents}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
        >
          Browse Campus Events
        </button>
      </div>
    );
  }

  const renderRows = (
    items: { registration: EventRegistration; event: CampusEvent }[],
    allowCancel: boolean
  ) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
      {items.map(({ registration, event }) => {
        const regTimestamp = registration.registeredAt
          ? registration.registeredAt.toDate().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Confirmed';

        return (
          <div
            key={registration.id}
            className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-blue-700">{event.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">Registered {regTimestamp}</span>
                {registration.department && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{registration.department}</span>
                  </>
                )}
              </div>

              <h3 className="font-display text-base font-bold text-[#0B1B3B]">
                <button
                  type="button"
                  onClick={() => onSelectEvent(event)}
                  className="text-left hover:text-blue-700 transition-colors cursor-pointer"
                >
                  {event.title}
                </button>
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDisplayDate(event.eventDate)}
                </span>
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDisplayTime(event.eventTime)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {event.venue}
                </span>
              </div>

              {registration.notes && (
                <p className="text-xs text-slate-500 pt-0.5">
                  Note: {registration.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onSelectEvent(event)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Event Details
              </button>
              {allowCancel && (
                <button
                  type="button"
                  disabled={busyEventId === event.id}
                  onClick={() => onUnregister(event)}
                  className="px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  {busyEventId === event.id ? 'Canceling...' : 'Unregister'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
            Upcoming Registered Events
          </h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {upcomingRegistrations.length} active
          </span>
        </div>
        {upcomingRegistrations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
            You have no upcoming event registrations.
          </div>
        ) : (
          renderRows(upcomingRegistrations, true)
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
            Past Registration History
          </h2>
          <span className="text-xs font-medium text-slate-500 tabular-nums">
            {pastRegistrations.length} completed
          </span>
        </div>
        {pastRegistrations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
            No past event registrations recorded yet.
          </div>
        ) : (
          renderRows(pastRegistrations, false)
        )}
      </section>
    </div>
  );
}
