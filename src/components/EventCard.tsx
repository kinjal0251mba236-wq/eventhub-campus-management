import { useState } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import {
  CATEGORY_IMAGE_MAP,
  formatDisplayDate,
  formatDisplayTime,
  isPastEvent,
} from '@/src/lib/eventMedia';
import type { CampusEvent } from '@/src/types/eventhub';

interface EventCardProps {
  event: CampusEvent;
  isRegistered: boolean;
  isOrganizer: boolean;
  onSelect: (event: CampusEvent) => void;
  onQuickRegister?: (event: CampusEvent) => void;
  onQuickUnregister?: (event: CampusEvent) => void;
  busyEventId?: string | null;
}

export function EventCard({
  event,
  isRegistered,
  isOrganizer,
  onSelect,
  onQuickRegister,
  onQuickUnregister,
  busyEventId,
}: EventCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const past = isPastEvent(event.startAtMs);
  const isFull = event.registeredCount >= event.capacity;
  const fillRatio = event.capacity > 0 ? event.registeredCount / event.capacity : 0;
  const isFillingFast = !isFull && !past && fillRatio >= 0.8;
  const isBusy = busyEventId === event.id;

  const statusText = past
    ? 'Completed'
    : isRegistered
      ? 'Registered'
      : isFull
        ? 'Full'
        : isFillingFast
          ? 'Filling Fast'
          : 'Open';

  const statusColorClass = past
    ? 'text-slate-500'
    : isRegistered
      ? 'text-emerald-700'
      : isFull
        ? 'text-red-700'
        : isFillingFast
          ? 'text-amber-700'
          : 'text-blue-700';

  return (
    <article className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col transition-colors hover:border-slate-300">
      <div
        onClick={() => onSelect(event)}
        className="aspect-[4/3] bg-slate-100 relative overflow-hidden cursor-pointer group"
      >
        {!imgFailed ? (
          <img
            src={CATEGORY_IMAGE_MAP[event.category]}
            alt={`${event.title} campus venue preview`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0B1B3B] via-blue-900 to-blue-700 flex flex-col items-center justify-center p-6 text-center text-white">
            <Calendar className="w-8 h-8 mb-2 text-blue-200" />
            <span className="text-sm font-semibold">{event.category}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-xs mb-2">
          <span className="text-slate-500 font-medium truncate">
            {event.category}
            {isOrganizer ? ' · Hosted by you' : ''}
          </span>
          <span className={`font-semibold whitespace-nowrap shrink-0 ${statusColorClass}`}>
            {statusText}
          </span>
        </div>

        <h3 className="font-display text-base font-bold text-[#0B1B3B] leading-snug mb-2 line-clamp-2">
          <button
            type="button"
            onClick={() => onSelect(event)}
            className="text-left hover:text-blue-700 transition-colors cursor-pointer"
          >
            {event.title}
          </button>
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
          {event.description}
        </p>

        <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tabular-nums">{formatDisplayDate(event.eventDate)}</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="tabular-nums">{formatDisplayTime(event.eventTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-slate-600 tabular-nums">
              <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {event.registeredCount} / {event.capacity} registered
            </span>
            <span className="text-slate-500 truncate max-w-[130px]">
              By {event.organizerName}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSelect(event)}
            className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            View Details
          </button>

          {!past && isRegistered && onQuickUnregister && (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onQuickUnregister(event)}
              className="flex-1 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {isBusy ? 'Updating...' : 'Unregister'}
            </button>
          )}

          {!past && !isRegistered && onQuickRegister && (
            <button
              type="button"
              disabled={isBusy || isFull}
              onClick={() => onQuickRegister(event)}
              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {isBusy ? 'Reserving...' : isFull ? 'Event Full' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
