import { Download, Users, X } from 'lucide-react';
import { formatDisplayDate, formatDisplayTime } from '@/src/lib/eventMedia';
import type { CampusEvent, EventRegistration } from '@/src/types/eventhub';

interface ParticipantsModalProps {
  event: CampusEvent | null;
  participants: EventRegistration[];
  onClose: () => void;
}

export function ParticipantsModal({
  event,
  participants,
  onClose,
}: ParticipantsModalProps) {
  if (!event) return null;

  const handleExportCsv = () => {
    const header = ['Student Name', 'Email', 'Department', 'Notes', 'Registered At'];
    const rows = participants.map((p) => {
      const regDate = p.registeredAt ? p.registeredAt.toDate().toISOString() : '';
      return [p.studentName, p.studentEmail, p.department || '-', p.notes || '-', regDate]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-participants.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="participants-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <h2 id="participants-modal-title" className="font-display text-lg font-bold text-[#0B1B3B]">
              Registered Participants
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {event.title} · {formatDisplayDate(event.eventDate)} at {formatDisplayTime(event.eventTime)} ·{' '}
              <span className="tabular-nums font-medium text-slate-700">
                {participants.length} / {event.capacity} seats filled
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {participants.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close participants dialog"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {participants.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-800">No students registered yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Confirmed student registrations will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Notes</th>
                    <th className="py-2.5 px-4 text-right">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                        {p.studentName}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {p.studentEmail}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {p.department || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 max-w-[200px] truncate">
                        {p.notes || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-slate-500 text-right tabular-nums whitespace-nowrap">
                        {p.registeredAt
                          ? p.registeredAt.toDate().toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Just now'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
