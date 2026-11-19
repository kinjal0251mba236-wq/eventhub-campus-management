import { ArrowRight, CalendarCheck2, CalendarClock, Layers, PlusCircle } from 'lucide-react';
import { isPastEvent } from '@/src/lib/eventMedia';
import type { AppSection, CampusEvent } from '@/src/types/eventhub';
import { CalendarSchedule } from './CalendarSchedule';
import { EventCard } from './EventCard';

interface DashboardViewProps {
  events: CampusEvent[];
  registeredEventIds: Set<string>;
  currentUserId: string;
  loading: boolean;
  onNavigate: (section: AppSection) => void;
  onSelectEvent: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onQuickUnregister: (event: CampusEvent) => void;
  onCreateEvent: () => void;
  onSeedSamples: () => Promise<void>;
  seeding: boolean;
  busyEventId: string | null;
}

export function DashboardView({
  events,
  registeredEventIds,
  currentUserId,
  loading,
  onNavigate,
  onSelectEvent,
  onQuickRegister,
  onQuickUnregister,
  onCreateEvent,
  onSeedSamples,
  seeding,
  busyEventId,
}: DashboardViewProps) {
  const upcomingEvents = events.filter((e) => !isPastEvent(e.startAtMs));
  const pastEvents = events.filter((e) => isPastEvent(e.startAtMs));
  const myRegisteredCount = events.filter((e) => registeredEventIds.has(e.id)).length;
  const featuredUpcoming = upcomingEvents.slice(0, 3);

  const stats = [
    {
      label: 'Total Campus Events',
      value: events.length,
      detail: 'Published across all categories',
      icon: Layers,
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents.length,
      detail: 'Open for campus participation',
      icon: CalendarClock,
    },
    {
      label: 'My Registered Events',
      value: myRegisteredCount,
      detail: 'Confirmed student registrations',
      icon: CalendarCheck2,
    },
    {
      label: 'Past Events Archive',
      value: pastEvents.length,
      detail: 'Completed campus programs',
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                <Icon className="w-4 h-4 text-blue-600 shrink-0" />
              </div>
              <p className="font-display text-3xl font-bold text-[#0B1B3B] tabular-nums">
                {loading ? '—' : stat.value}
              </p>
              <p className="text-xs text-slate-500 mt-1">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      {!loading && events.length === 0 ? (
        <section className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <h2 className="font-display text-xl font-bold text-[#0B1B3B] mb-2">
            Welcome to EVENTHUB
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
            No campus events have been published yet. Create your first event in Organizer Studio or load a starter schedule of campus events to explore registration and calendar features.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onCreateEvent}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Event
            </button>
            <button
              type="button"
              disabled={seeding}
              onClick={onSeedSamples}
              className="px-4 py-2.5 text-sm font-medium text-[#0B1B3B] bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {seeding ? 'Adding Campus Schedule...' : 'Load Sample Campus Events'}
            </button>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5">
            <CalendarSchedule
              events={events}
              registeredEventIds={registeredEventIds}
              onSelectEvent={onSelectEvent}
              mode="compact"
            />
          </div>

          <section className="xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                  Featured Upcoming Events
                </h2>
                <p className="text-xs text-slate-500">
                  Next scheduled opportunities across campus departments
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('browse')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap cursor-pointer"
              >
                Browse All Events
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-80 bg-white border border-slate-200 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : featuredUpcoming.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <p className="text-sm font-medium text-slate-800">No upcoming events right now</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Check the past events archive or publish a new campus event.
                </p>
                <button
                  type="button"
                  onClick={onCreateEvent}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Create Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredUpcoming.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    isRegistered={registeredEventIds.has(ev.id)}
                    isOrganizer={ev.organizerId === currentUserId}
                    onSelect={onSelectEvent}
                    onQuickRegister={onQuickRegister}
                    onQuickUnregister={onQuickUnregister}
                    busyEventId={busyEventId}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
