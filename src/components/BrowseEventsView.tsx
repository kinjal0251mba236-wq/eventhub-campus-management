import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { isPastEvent } from '@/src/lib/eventMedia';
import { EVENT_CATEGORIES, type CampusEvent, type EventCategory } from '@/src/types/eventhub';
import { EventCard } from './EventCard';

interface BrowseEventsViewProps {
  events: CampusEvent[];
  registeredEventIds: Set<string>;
  currentUserId: string;
  loading: boolean;
  onSelectEvent: (event: CampusEvent) => void;
  onQuickRegister: (event: CampusEvent) => void;
  onQuickUnregister: (event: CampusEvent) => void;
  busyEventId: string | null;
}

type TimeFilter = 'all' | 'upcoming' | 'past';

export function BrowseEventsView({
  events,
  registeredEventIds,
  currentUserId,
  loading,
  onSelectEvent,
  onQuickRegister,
  onQuickUnregister,
  busyEventId,
}: BrowseEventsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return events.filter((ev) => {
      if (selectedCategory !== 'All' && ev.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const haystack = `${ev.title} ${ev.venue} ${ev.organizerName} ${ev.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [events, searchQuery, selectedCategory]);

  const upcomingEvents = useMemo(
    () => filteredEvents.filter((ev) => !isPastEvent(ev.startAtMs)),
    [filteredEvents]
  );

  const pastEvents = useMemo(
    () =>
      filteredEvents
        .filter((ev) => isPastEvent(ev.startAtMs))
        .sort((a, b) => b.startAtMs - a.startAtMs),
    [filteredEvents]
  );

  const showUpcoming = timeFilter === 'all' || timeFilter === 'upcoming';
  const showPast = timeFilter === 'all' || timeFilter === 'past';

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by name, venue, or organizer..."
              aria-label="Search events by name"
              className="w-full pl-10 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="p-1 text-slate-400 hover:text-slate-700 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg self-start md:self-auto"
            role="tablist"
            aria-label="Event timeframe filter"
          >
            {(
              [
                { id: 'all', label: `All (${filteredEvents.length})` },
                { id: 'upcoming', label: `Upcoming (${upcomingEvents.length})` },
                { id: 'past', label: `Past (${pastEvents.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={timeFilter === tab.id}
                onClick={() => setTimeFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                  timeFilter === tab.id
                    ? 'bg-white text-[#0B1B3B] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-[#0B1B3B] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            All Categories
          </button>
          {EVENT_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === category
                  ? 'bg-[#0B1B3B] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-88 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-base font-semibold text-[#0B1B3B]">No matching events found</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Try clearing your search term or switching to another event category.
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {showUpcoming && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2.5">
                <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                  Upcoming Events
                </h2>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {upcomingEvents.length} scheduled
                </span>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No upcoming events match the current filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {upcomingEvents.map((ev) => (
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
          )}

          {showPast && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-2.5">
                <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                  Past Events
                </h2>
                <span className="text-xs font-medium text-slate-500 tabular-nums">
                  {pastEvents.length} completed
                </span>
              </div>

              {pastEvents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No past events match the current filter.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {pastEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      isRegistered={registeredEventIds.has(ev.id)}
                      isOrganizer={ev.organizerId === currentUserId}
                      onSelect={onSelectEvent}
                      busyEventId={busyEventId}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
