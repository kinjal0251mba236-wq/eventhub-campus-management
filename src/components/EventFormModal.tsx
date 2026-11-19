import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { validateEventInput } from '@/src/lib/eventService';
import {
  EVENT_CATEGORIES,
  SCHEMA_LIMITS,
  type CampusEvent,
  type EventCategory,
  type EventFormInput,
} from '@/src/types/eventhub';

interface EventFormModalProps {
  open: boolean;
  editingEvent: CampusEvent | null;
  defaultOrganizerName: string;
  onClose: () => void;
  onSubmit: (input: EventFormInput, editingEvent: CampusEvent | null) => Promise<void>;
}

function getDefaultDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

export function EventFormModal({
  open,
  editingEvent,
  defaultOrganizerName,
  onClose,
  onSubmit,
}: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Technology');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState(getDefaultDate());
  const [eventTime, setEventTime] = useState('14:00');
  const [capacity, setCapacity] = useState(100);
  const [organizerName, setOrganizerName] = useState(defaultOrganizerName);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingEvent) {
      setTitle(editingEvent.title);
      setCategory(editingEvent.category);
      setVenue(editingEvent.venue);
      setEventDate(editingEvent.eventDate);
      setEventTime(editingEvent.eventTime);
      setCapacity(editingEvent.capacity);
      setOrganizerName(editingEvent.organizerName);
      setDescription(editingEvent.description);
    } else {
      setTitle('');
      setCategory('Technology');
      setVenue('');
      setEventDate(getDefaultDate());
      setEventTime('14:00');
      setCapacity(100);
      setOrganizerName(defaultOrganizerName);
      setDescription('');
    }
  }, [open, editingEvent, defaultOrganizerName]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: EventFormInput = {
      title,
      description,
      category,
      venue,
      eventDate,
      eventTime,
      capacity: Number(capacity),
      organizerName,
    };

    const validationError = validateEventInput(input);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    if (editingEvent && input.capacity < editingEvent.registeredCount) {
      setErrorMsg(
        `Capacity cannot be less than ${editingEvent.registeredCount} (already registered students).`
      );
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmit(input, editingEvent);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="event-form-title" className="font-display text-lg font-bold text-[#0B1B3B]">
              {editingEvent ? 'Edit Campus Event' : 'Create Campus Event'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingEvent
                ? 'Update schedule, venue, or capacity for your event.'
                : 'Publish a new campus event for students to discover and join.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close form"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="ev-title" className="block text-xs font-medium text-slate-700 mb-1">
              Event Title
            </label>
            <input
              id="ev-title"
              type="text"
              required
              minLength={SCHEMA_LIMITS.TITLE_MIN}
              maxLength={SCHEMA_LIMITS.TITLE_MAX}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spring Robotics & AI Demo Day"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-category" className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                id="ev-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ev-capacity" className="block text-xs font-medium text-slate-700 mb-1">
                Seat Capacity
              </label>
              <input
                id="ev-capacity"
                type="number"
                required
                min={editingEvent ? Math.max(1, editingEvent.registeredCount) : SCHEMA_LIMITS.CAPACITY_MIN}
                max={SCHEMA_LIMITS.CAPACITY_MAX}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-date" className="block text-xs font-medium text-slate-700 mb-1">
                Event Date
              </label>
              <input
                id="ev-date"
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ev-time" className="block text-xs font-medium text-slate-700 mb-1">
                Start Time
              </label>
              <input
                id="ev-time"
                type="time"
                required
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg tabular-nums focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ev-venue" className="block text-xs font-medium text-slate-700 mb-1">
                Campus Venue
              </label>
              <input
                id="ev-venue"
                type="text"
                required
                minLength={SCHEMA_LIMITS.VENUE_MIN}
                maxLength={SCHEMA_LIMITS.VENUE_MAX}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Science Hall Auditorium"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label htmlFor="ev-org" className="block text-xs font-medium text-slate-700 mb-1">
                Organizer / Club Name
              </label>
              <input
                id="ev-org"
                type="text"
                required
                minLength={SCHEMA_LIMITS.ORGANIZER_NAME_MIN}
                maxLength={SCHEMA_LIMITS.ORGANIZER_NAME_MAX}
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="e.g. Engineering Student Council"
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="ev-desc" className="block text-xs font-medium text-slate-700 mb-1">
              Event Description &amp; Agenda
            </label>
            <textarea
              id="ev-desc"
              required
              rows={4}
              minLength={SCHEMA_LIMITS.DESCRIPTION_MIN}
              maxLength={SCHEMA_LIMITS.DESCRIPTION_MAX}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide agenda highlights, speaker details, and registration instructions..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editingEvent
                  ? 'Save Changes'
                  : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
