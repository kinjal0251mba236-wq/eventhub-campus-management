import { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CalendarDays,
  Check,
  ClipboardList,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Pencil,
  X,
} from 'lucide-react';
import type { AppSection } from '@/src/types/eventhub';

interface SidebarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  user: User;
  department: string;
  onSaveDepartment: (department: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  counts: {
    upcoming: number;
    registered: number;
    organized: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: {
  id: AppSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse', label: 'Browse Events', icon: Compass },
  { id: 'calendar', label: 'Campus Calendar', icon: CalendarDays },
  { id: 'registrations', label: 'My Registrations', icon: ClipboardList },
  { id: 'organizer', label: 'Organizer Studio', icon: FolderKanban },
];

export function Sidebar({
  activeSection,
  onSelectSection,
  user,
  department,
  onSaveDepartment,
  onSignOut,
  counts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [editingDept, setEditingDept] = useState(false);
  const [deptDraft, setDeptDraft] = useState(department);
  const [savingDept, setSavingDept] = useState(false);

  const handleSaveDept = async () => {
    setSavingDept(true);
    try {
      await onSaveDepartment(deptDraft);
      setEditingDept(false);
    } finally {
      setSavingDept(false);
    }
  };

  const getBadgeCount = (id: AppSection): number | null => {
    if (id === 'browse') return counts.upcoming;
    if (id === 'registrations') return counts.registered;
    if (id === 'organizer') return counts.organized;
    return null;
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#0B1B3B] text-white w-[264px]">
      <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="font-display text-lg font-bold tracking-tight text-white block whitespace-nowrap">
            EVENTHUB
          </span>
          <span className="text-xs text-blue-200/80 block mt-0.5">
            Campus Event Portal
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 text-blue-100 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const count = getBadgeCount(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </span>
              {count !== null && (
                <span
                  className={`font-mono text-xs tabular-nums ${
                    isActive ? 'text-blue-100' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 bg-[#08152F]">
        <div className="flex items-center gap-3 mb-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User profile'}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {user.displayName || 'Campus Member'}
            </p>
            <p className="text-xs text-slate-300 truncate">{user.email}</p>
          </div>
        </div>

        {editingDept ? (
          <div className="mb-3 flex items-center gap-1.5">
            <input
              type="text"
              value={deptDraft}
              onChange={(e) => setDeptDraft(e.target.value)}
              placeholder="e.g. Computer Science"
              maxLength={100}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white/10 border border-white/20 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
            />
            <button
              type="button"
              onClick={handleSaveDept}
              disabled={savingDept}
              aria-label="Save department"
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDeptDraft(department);
                setEditingDept(false);
              }}
              aria-label="Cancel department edit"
              className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-md cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDeptDraft(department);
              setEditingDept(true);
            }}
            className="w-full mb-3 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            <span className="truncate">
              {department ? department : 'Set department / club'}
            </span>
            <Pencil className="w-3 h-3 shrink-0 text-slate-400" />
          </button>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
