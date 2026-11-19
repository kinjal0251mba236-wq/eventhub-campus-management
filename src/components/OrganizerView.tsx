import { useState } from 'react';
import { Calendar, Edit3, Plus, Trash2, Users } from 'lucide-react';
import { formatDisplayDate, formatDisplayTime, isPastEvent } from '@/src/lib/eventMedia';
import type { CampusEvent, EventRegistration } from '@/src/types/eventhub';

interface OrganizerViewProps {
  myEvents: CampusEvent[];
  organizerRegistrations: EventRegistration[];
  loading: boolean;
  onCreateEvent: () => void;
  onEditEvent: (event: CampusEvent) => void;
  onDeleteEvent: (event: CampusEvent) => Promise<void>;
  onViewParticipants: (event: CampusEvent) => void;
  onSelectEvent: (event: CampusEvent) => void;
}

export function OrganizerView({
  myEvents,
  organizerRegistrations,
  loading,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewParticipants,
  onSelectEvent,
}: OrganizerViewProps) {
  const [confirmDeleteEvent, setConfirmDeleteEvent] = useState<CampusEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalSeatsFilled = myEvents.reduce((acc, ev) => acc + ev.registeredCount, 0);
  const upcomingCount = myEvents.filter((ev) => !isPastEvent(ev.startAtMs)).length;

  const countByEvent = (eventId: string) =>
    organizerRegistrations.filter((r) => r.eventId === eventId).length;

  const handleConfirmDelete = async () => {
    if (!confirmDeleteEvent) return;
    setDeleting(true);
    try {
      await onDeleteEvent(confirmDeleteEvent);
      setConfirmDeleteEvent(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
            Your Hosted Events
          </h2>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {myEvents.length} events created · {upcomingCount} upcoming · {totalSeatsFilled} total registered participants
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateEvent}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Event
        </button>
      </div>

      {loading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-xl animate-pulse" />
      ) : myEvents.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <h3 className="font-display text-lg font-bold text-[#0B1B3B] mb-1">
            No Events Created Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Only events you create appear in Organizer Studio. Publish your first campus event to manage schedules and inspect student rosters.
          </p>
          <button
            type="button"
            onClick={onCreateEvent}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Campus Event
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-5">Event</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Venue</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Participants</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {myEvents.map((ev) => {
                  const past = isPastEvent(ev.startAtMs);
                  const participantCount = Math.max(ev.registeredCount, countByEvent(ev.id));
                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5 max-w-[260px]">
                        <button
                          type="button"
                          onClick={() => onSelectEvent(ev)}
                          className="font-semibold text-[#0B1B3B] hover:text-blue-700 text-left block truncate w-full cursor-pointer"
                        >
                          {ev.title}
                        </button>
                        <span className="text-xs text-slate-500">{ev.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 tabular-nums whitespace-nowrap">
                        <div>{formatDisplayDate(ev.eventDate)}</div>
                        <div className="text-slate-500">{formatDisplayTime(ev.eventTime)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-[180px] truncate">
                        {ev.venue}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold whitespace-nowrap">
                        <span className={past ? 'text-slate-500' : 'text-emerald-700'}>
                          {past ? 'Completed' : 'Upcoming'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewParticipants(ev)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {participantCount} / {ev.capacity}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewParticipants(ev)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                          >
                            Roster
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditEvent(ev)}
                            aria-label={`Edit ${ev.title}`}
                            className="p-1.5 text-slate-600 hover:text-[#0B1B3B] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteEvent(ev)}
                            aria-label={`Delete ${ev.title}`}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {confirmDeleteEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6">
            <h3 id="delete-event-title" className="font-display text-lg font-bold text-[#0B1B3B] mb-2">
              Delete Event?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-900">{confirmDeleteEvent.title}</span>? This will permanently remove the event and its {confirmDeleteEvent.registeredCount} registration records.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteEvent(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
