import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { CheckCircle2, Menu, Plus, X } from 'lucide-react';
import { BrowseEventsView } from './components/BrowseEventsView';
import { CalendarSchedule } from './components/CalendarSchedule';
import { DashboardView } from './components/DashboardView';
import { EventFormModal } from './components/EventFormModal';
import { EventModal } from './components/EventModal';
import { MyRegistrationsView } from './components/MyRegistrationsView';
import { OrganizerView } from './components/OrganizerView';
import { ParticipantsModal } from './components/ParticipantsModal';
import { Sidebar } from './components/Sidebar';
import { SignInView } from './components/SignInView';
import { isPastEvent } from './lib/eventMedia';
import {
  createCampusEvent,
  deleteCampusEvent,
  ensureUserProfile,
  registerForEvent,
  seedSampleCampusEvents,
  unregisterFromEvent,
  updateCampusEvent,
  updateUserDepartment,
} from './lib/eventService';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  isFirebaseConfigured,
  OperationType,
} from './lib/firebase';
import type {
  AppSection,
  CampusEvent,
  EventFormInput,
  EventRegistration,
  UserProfile,
} from './types/eventhub';

const SECTION_META: Record<AppSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of campus events, schedule highlights, and your active registrations',
  },
  browse: {
    title: 'Browse Events',
    subtitle: 'Search and filter upcoming and past university events across departments',
  },
  calendar: {
    title: 'Campus Calendar',
    subtitle: 'Interactive monthly calendar of scheduled campus programs',
  },
  registrations: {
    title: 'My Registrations',
    subtitle: 'Track your confirmed upcoming seats and past campus participation history',
  },
  organizer: {
    title: 'Organizer Studio',
    subtitle: 'Create, update, and manage rosters exclusively for events you host',
  },
};

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<EventRegistration[]>([]);
  const [organizerRegistrations, setOrganizerRegistrations] = useState<EventRegistration[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [activeSection, setActiveSection] = useState<AppSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [participantsEventId, setParticipantsEventId] = useState<string | null>(null);

  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  if (fatalError) {
    throw fatalError;
  }

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        try {
          const profile = await ensureUserProfile(nextUser);
          setUserProfile(profile);
        } catch (err) {
          setFatalError(err instanceof Error ? err : new Error(String(err)));
        }
      } else {
        setUserProfile(null);
        setEvents([]);
        setMyRegistrations([]);
        setOrganizerRegistrations([]);
        setDataLoading(false);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authReady || !user || !isFirebaseConfigured) return;

    setDataLoading(true);
    let eventsLoaded = false;
    let regsLoaded = false;

    const markLoaded = () => {
      if (eventsLoaded && regsLoaded) setDataLoading(false);
    };

    const eventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'published')
    );

    const unsubEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const list: CampusEvent[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<CampusEvent, 'id'>),
        }));
        list.sort((a, b) => a.startAtMs - b.startAtMs);
        setEvents(list);
        eventsLoaded = true;
        markLoaded();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'events');
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    const myRegsQuery = query(
      collection(db, 'registrations'),
      where('studentId', '==', user.uid)
    );

    const unsubMyRegs = onSnapshot(
      myRegsQuery,
      (snapshot) => {
        const list: EventRegistration[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EventRegistration, 'id'>),
        }));
        setMyRegistrations(list);
        regsLoaded = true;
        markLoaded();
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'registrations');
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    const orgRegsQuery = query(
      collection(db, 'registrations'),
      where('organizerId', '==', user.uid)
    );

    const unsubOrgRegs = onSnapshot(
      orgRegsQuery,
      (snapshot) => {
        const list: EventRegistration[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EventRegistration, 'id'>),
        }));
        setOrganizerRegistrations(list);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, 'registrations');
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    const unsubProfile = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        } catch (wrapped) {
          setFatalError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
        }
      }
    );

    return () => {
      unsubEvents();
      unsubMyRegs();
      unsubOrgRegs();
      unsubProfile();
    };
  }, [authReady, user]);

  const registeredEventIds = useMemo(
    () => new Set(myRegistrations.map((r) => r.eventId)),
    [myRegistrations]
  );

  const registrationByEventId = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    for (const reg of myRegistrations) {
      map.set(reg.eventId, reg);
    }
    return map;
  }, [myRegistrations]);

  const myOrganizedEvents = useMemo(
    () => (user ? events.filter((e) => e.organizerId === user.uid) : []),
    [events, user]
  );

  const upcomingCount = useMemo(
    () => events.filter((e) => !isPastEvent(e.startAtMs)).length,
    [events]
  );

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const participantsEvent = useMemo(
    () => events.find((e) => e.id === participantsEventId) || null,
    [events, participantsEventId]
  );

  const participantsList = useMemo(
    () =>
      participantsEventId
        ? organizerRegistrations.filter((r) => r.eventId === participantsEventId)
        : [],
    [organizerRegistrations, participantsEventId]
  );

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Google Sign-In failed.';
      if (msg.includes('popup-blocked')) {
        setAuthError(
          'Your browser blocked the Google Sign-In popup. Please allow popups for this site and try again.'
        );
      } else if (msg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in was canceled before completing Google authentication.');
      } else {
        setAuthError(msg);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setActiveSection('dashboard');
    setSelectedEventId(null);
    setParticipantsEventId(null);
  };

  const handleSaveDepartment = async (department: string) => {
    if (!user) return;
    await updateUserDepartment(user.uid, department);
    setNotice({ kind: 'success', text: 'Profile department updated.' });
  };

  const handleRegister = async (event: CampusEvent, department: string, notes: string) => {
    if (!user) return;
    setBusyEventId(event.id);
    try {
      await registerForEvent(event, user, department, notes);
      setNotice({ kind: 'success', text: `Seat confirmed for "${event.title}".` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to register for event.';
      setNotice({ kind: 'error', text: msg });
      throw err;
    } finally {
      setBusyEventId(null);
    }
  };

  const handleQuickRegister = async (event: CampusEvent) => {
    await handleRegister(event, userProfile?.department || '', '');
  };

  const handleUnregister = async (event: CampusEvent) => {
    if (!user) return;
    setBusyEventId(event.id);
    try {
      await unregisterFromEvent(event.id, user);
      setNotice({ kind: 'success', text: `Registration canceled for "${event.title}".` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to cancel registration.';
      setNotice({ kind: 'error', text: msg });
      throw err;
    } finally {
      setBusyEventId(null);
    }
  };

  const handleSaveEvent = async (input: EventFormInput, targetEditing: CampusEvent | null) => {
    if (!user) return;
    if (targetEditing) {
      await updateCampusEvent(targetEditing.id, targetEditing.registeredCount, input);
      setNotice({ kind: 'success', text: `Updated "${input.title.trim()}".` });
    } else {
      await createCampusEvent(user, input);
      setNotice({ kind: 'success', text: `Published "${input.title.trim()}".` });
    }
  };

  const handleDeleteEvent = async (event: CampusEvent) => {
    if (!user) return;
    await deleteCampusEvent(event.id, user.uid);
    if (selectedEventId === event.id) setSelectedEventId(null);
    if (participantsEventId === event.id) setParticipantsEventId(null);
    setNotice({ kind: 'success', text: `Deleted "${event.title}".` });
  };

  const handleSeedSamples = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedSampleCampusEvents(user);
      setNotice({ kind: 'success', text: 'Sample campus schedule added to your portal.' });
    } finally {
      setSeeding(false);
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-display text-lg font-bold text-[#0B1B3B]">EVENTHUB</p>
          <p className="text-sm text-slate-500 mt-1">Connecting to campus portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignInView onSignIn={handleGoogleSignIn} authError={authError} />;
  }

  const currentMeta = SECTION_META[activeSection];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        user={user}
        department={userProfile?.department || ''}
        onSaveDepartment={handleSaveDepartment}
        onSignOut={handleSignOut}
        counts={{
          upcoming: upcomingCount,
          registered: myRegistrations.length,
          organized: myOrganizedEvents.length,
        }}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-bold text-[#0B1B3B] truncate">
                {currentMeta.title}
              </h1>
              <p className="hidden sm:block text-xs text-slate-500 truncate">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Create Event
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {notice && (
            <div
              role="status"
              className={`mb-6 px-4 py-3 rounded-lg border flex items-center justify-between gap-3 text-sm ${
                notice.kind === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <span className="flex items-center gap-2">
                {notice.kind === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                {notice.text}
              </span>
              <button
                type="button"
                onClick={() => setNotice(null)}
                aria-label="Dismiss message"
                className="p-1 rounded hover:bg-black/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeSection === 'dashboard' && (
            <DashboardView
              events={events}
              registeredEventIds={registeredEventIds}
              currentUserId={user.uid}
              loading={dataLoading}
              onNavigate={setActiveSection}
              onSelectEvent={(ev) => setSelectedEventId(ev.id)}
              onQuickRegister={handleQuickRegister}
              onQuickUnregister={handleUnregister}
              onCreateEvent={() => {
                setEditingEvent(null);
                setFormModalOpen(true);
              }}
              onSeedSamples={handleSeedSamples}
              seeding={seeding}
              busyEventId={busyEventId}
            />
          )}

          {activeSection === 'browse' && (
            <BrowseEventsView
              events={events}
              registeredEventIds={registeredEventIds}
              currentUserId={user.uid}
              loading={dataLoading}
              onSelectEvent={(ev) => setSelectedEventId(ev.id)}
              onQuickRegister={handleQuickRegister}
              onQuickUnregister={handleUnregister}
              busyEventId={busyEventId}
            />
          )}

          {activeSection === 'calendar' && (
            <CalendarSchedule
              events={events}
              registeredEventIds={registeredEventIds}
              onSelectEvent={(ev) => setSelectedEventId(ev.id)}
              mode="full"
            />
          )}

          {activeSection === 'registrations' && (
            <MyRegistrationsView
              events={events}
              registrations={myRegistrations}
              loading={dataLoading}
              onSelectEvent={(ev) => setSelectedEventId(ev.id)}
              onUnregister={handleUnregister}
              onBrowseEvents={() => setActiveSection('browse')}
              busyEventId={busyEventId}
            />
          )}

          {activeSection === 'organizer' && (
            <OrganizerView
              myEvents={myOrganizedEvents}
              organizerRegistrations={organizerRegistrations}
              loading={dataLoading}
              onCreateEvent={() => {
                setEditingEvent(null);
                setFormModalOpen(true);
              }}
              onEditEvent={(ev) => {
                setEditingEvent(ev);
                setFormModalOpen(true);
              }}
              onDeleteEvent={handleDeleteEvent}
              onViewParticipants={(ev) => setParticipantsEventId(ev.id)}
              onSelectEvent={(ev) => setSelectedEventId(ev.id)}
            />
          )}
        </main>
      </div>

      <EventModal
        event={selectedEvent}
        registration={selectedEvent ? registrationByEventId.get(selectedEvent.id) : undefined}
        isOrganizer={Boolean(selectedEvent && selectedEvent.organizerId === user.uid)}
        defaultDepartment={userProfile?.department || ''}
        onClose={() => setSelectedEventId(null)}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
        onOpenParticipants={(ev) => setParticipantsEventId(ev.id)}
        onEditEvent={(ev) => {
          setEditingEvent(ev);
          setFormModalOpen(true);
        }}
      />

      <EventFormModal
        open={formModalOpen}
        editingEvent={editingEvent}
        defaultOrganizerName={user.displayName || user.email?.split('@')[0] || 'Campus Organizer'}
        onClose={() => {
          setFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSaveEvent}
      />

      <ParticipantsModal
        event={participantsEvent}
        participants={participantsList}
        onClose={() => setParticipantsEventId(null)}
      />
    </div>
  );
}
