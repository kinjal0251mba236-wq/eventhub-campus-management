import { useState } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, UserCheck, Users, X } from 'lucide-react';
import {
  CATEGORY_IMAGE_MAP,
  formatDisplayDate,
  formatDisplayTime,
  isPastEvent,
} from '@/src/lib/eventMedia';
import { SCHEMA_LIMITS, type CampusEvent, type EventRegistration } from '@/src/types/eventhub';

interface EventModalProps {
  event: CampusEvent | null;
  registration: EventRegistration | undefined;
  isOrganizer: boolean;
  defaultDepartment: string;
  onClose: () => void;
  onRegister: (event: CampusEvent, department: string, notes: string) => Promise<void>;
  onUnregister: (event: CampusEvent) => Promise<void>;
  onOpenParticipants?: (event: CampusEvent) => void;
  onEditEvent?: (event: CampusEvent) => void;
}

export function EventModal({
  event,
  registration,
  isOrganizer,
  defaultDepartment,
  onClose,
  onRegister,
  onUnregister,
  onOpenParticipants,
  onEditEvent,
}: EventModalProps) {
  const [department, setDepartment] = useState(defaultDepartment);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  if (!event) return null;

  const past = isPastEvent(event.startAtMs);
  const isRegistered = Boolean(registration);
  const isFull = event.registeredCount >= event.capacity;
  const remaining = Math.max(0, event.capacity - event.registeredCount);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onRegister(event, department, notes);
      setNotes('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not complete registration.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregisterClick = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onUnregister(event);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not unregister from event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="aspect-[16/7] bg-slate-100 relative overflow-hidden">
          {!imgFailed ? (
            <img
              src={CATEGORY_IMAGE_MAP[event.category]}
              alt={event.title}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0B1B3B] to-blue-700 flex items-center justify-center text-white font-display text-xl font-bold">
              {event.category}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event details"
            className="absolute top-3 right-3 p-2 rounded-lg bg-white/90 hover:bg-white text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <p className="text-xs font-medium text-blue-200 mb-1">
              {event.category} · Organized by {event.organizerName}
            </p>
            <h2 id="event-modal-title" className="font-display text-2xl font-bold leading-tight">
              {event.title}
            </h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-slate-200 text-sm">
            <div className="flex items-start gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="font-medium text-slate-900 tabular-nums">
                  {formatDisplayDate(event.eventDate)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Start Time</p>
                <p className="font-medium text-slate-900 tabular-nums">
                  {formatDisplayTime(event.eventTime)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Campus Venue</p>
                <p className="font-medium text-slate-900">{event.venue}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 text-slate-700">
              <Users className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Attendance</p>
                <p className="font-medium text-slate-900 tabular-nums">
                  {event.registeredCount} / {event.capacity} registered ({remaining} seats left)
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0B1B3B] mb-2">About This Event</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          {isOrganizer && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0B1B3B]">Organizer Controls</p>
                <p className="text-xs text-slate-500">
                  You created this event and can inspect its participant roster or edit details.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpenParticipants && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenParticipants(event);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0B1B3B] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    View Participants ({event.registeredCount})
                  </button>
                )}
                {onEditEvent && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEditEvent(event);
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Edit Event
                  </button>
                )}
              </div>
            </div>
          )}

          {past ? (
            <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-600">
              This event has already taken place. Registration is closed.
              {isRegistered && ' You were registered for this event.'}
            </div>
          ) : isRegistered ? (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-950">
                    Your seat is confirmed
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {registration?.department
                      ? `Department: ${registration.department}`
                      : 'Registered with your verified student account.'}
                    {registration?.notes ? ` · Note: ${registration.notes}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={handleUnregisterClick}
                className="px-4 py-2 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {submitting ? 'Canceling...' : 'Unregister'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="pt-2 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#0B1B3B]">
                  Student Participation Registration
                </h3>
                <span className="text-xs text-slate-500 tabular-nums">
                  {remaining} seats available
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-dept" className="block text-xs font-medium text-slate-700 mb-1">
                    Department or Program (optional)
                  </label>
                  <input
                    id="reg-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    maxLength={SCHEMA_LIMITS.DEPARTMENT_MAX}
                    placeholder="e.g. MBA, Computer Science"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label htmlFor="reg-notes" className="block text-xs font-medium text-slate-700 mb-1">
                    Participation Notes (optional)
                  </label>
                  <input
                    id="reg-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={SCHEMA_LIMITS.NOTES_MAX}
                    placeholder="Team name, accessibility, or interest"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || isFull}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Confirming Seat...'
                    : isFull
                      ? 'Event at Full Capacity'
                      : 'Confirm Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
