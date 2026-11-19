import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  SCHEMA_LIMITS,
  type CampusEvent,
  type EventFormInput,
  type UserProfile,
} from '@/src/types/eventhub';
import { db, handleFirestoreError, OperationType } from './firebase';

export function computeStartAtMs(eventDate: string, eventTime: string): number {
  const isoLocal = `${eventDate}T${eventTime}:00`;
  const parsed = new Date(isoLocal).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function validateEventInput(input: EventFormInput): string | null {
  const title = input.title.trim();
  const description = input.description.trim();
  const venue = input.venue.trim();
  const organizerName = input.organizerName.trim();

  if (title.length < SCHEMA_LIMITS.TITLE_MIN || title.length > SCHEMA_LIMITS.TITLE_MAX) {
    return `Event title must be between ${SCHEMA_LIMITS.TITLE_MIN} and ${SCHEMA_LIMITS.TITLE_MAX} characters.`;
  }
  if (
    description.length < SCHEMA_LIMITS.DESCRIPTION_MIN ||
    description.length > SCHEMA_LIMITS.DESCRIPTION_MAX
  ) {
    return `Description must be between ${SCHEMA_LIMITS.DESCRIPTION_MIN} and ${SCHEMA_LIMITS.DESCRIPTION_MAX} characters.`;
  }
  if (venue.length < SCHEMA_LIMITS.VENUE_MIN || venue.length > SCHEMA_LIMITS.VENUE_MAX) {
    return `Venue must be between ${SCHEMA_LIMITS.VENUE_MIN} and ${SCHEMA_LIMITS.VENUE_MAX} characters.`;
  }
  if (!SCHEMA_LIMITS.DATE_REGEX.test(input.eventDate)) {
    return 'Please select a valid date (YYYY-MM-DD).';
  }
  if (!SCHEMA_LIMITS.TIME_REGEX.test(input.eventTime)) {
    return 'Please select a valid time (HH:MM).';
  }
  if (
    !Number.isInteger(input.capacity) ||
    input.capacity < SCHEMA_LIMITS.CAPACITY_MIN ||
    input.capacity > SCHEMA_LIMITS.CAPACITY_MAX
  ) {
    return `Capacity must be a whole number between ${SCHEMA_LIMITS.CAPACITY_MIN} and ${SCHEMA_LIMITS.CAPACITY_MAX}.`;
  }
  if (
    organizerName.length < SCHEMA_LIMITS.ORGANIZER_NAME_MIN ||
    organizerName.length > SCHEMA_LIMITS.ORGANIZER_NAME_MAX
  ) {
    return `Organizer name must be between ${SCHEMA_LIMITS.ORGANIZER_NAME_MIN} and ${SCHEMA_LIMITS.ORGANIZER_NAME_MAX} characters.`;
  }
  return null;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const displayName = (user.displayName || user.email?.split('@')[0] || 'Campus Member').slice(
      0,
      SCHEMA_LIMITS.DISPLAY_NAME_MAX
    );
    const email = (user.email || '').slice(0, 150);
    const photoURL = (user.photoURL || '').slice(0, 500);

    if (!snap.exists()) {
      const payload = {
        uid: user.uid,
        displayName,
        email,
        photoURL,
        department: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, payload);
      const created = await getDoc(userRef);
      return created.data() as UserProfile;
    }

    const existingData = snap.data() as UserProfile;
    if (existingData.displayName !== displayName || existingData.photoURL !== photoURL) {
      await updateDoc(userRef, {
        displayName,
        photoURL,
        department: existingData.department || '',
        updatedAt: serverTimestamp(),
      });
    }
    return existingData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function updateUserDepartment(uid: string, department: string): Promise<void> {
  const userPath = `users/${uid}`;
  const trimmed = department.trim().slice(0, SCHEMA_LIMITS.DEPARTMENT_MAX);
  try {
    await updateDoc(doc(db, 'users', uid), {
      department: trimmed,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export async function createCampusEvent(user: User, input: EventFormInput): Promise<string> {
  const validationError = validateEventInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  const newEventRef = doc(collection(db, 'events'));
  const startAtMs = computeStartAtMs(input.eventDate, input.eventTime);

  const payload = {
    title: input.title.trim().slice(0, SCHEMA_LIMITS.TITLE_MAX),
    description: input.description.trim().slice(0, SCHEMA_LIMITS.DESCRIPTION_MAX),
    category: input.category,
    venue: input.venue.trim().slice(0, SCHEMA_LIMITS.VENUE_MAX),
    eventDate: input.eventDate,
    eventTime: input.eventTime,
    startAtMs,
    capacity: Math.trunc(input.capacity),
    registeredCount: 0,
    organizerId: user.uid,
    organizerName: input.organizerName.trim().slice(0, SCHEMA_LIMITS.ORGANIZER_NAME_MAX),
    status: 'published' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(newEventRef, payload);
    return newEventRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `events/${newEventRef.id}`);
  }
}

export async function updateCampusEvent(
  eventId: string,
  currentRegisteredCount: number,
  input: EventFormInput
): Promise<void> {
  const validationError = validateEventInput(input);
  if (validationError) {
    throw new Error(validationError);
  }
  if (input.capacity < currentRegisteredCount) {
    throw new Error(
      `Capacity cannot be lowered below the ${currentRegisteredCount} already registered participants.`
    );
  }

  const eventRef = doc(db, 'events', eventId);
  const startAtMs = computeStartAtMs(input.eventDate, input.eventTime);

  try {
    await updateDoc(eventRef, {
      title: input.title.trim().slice(0, SCHEMA_LIMITS.TITLE_MAX),
      description: input.description.trim().slice(0, SCHEMA_LIMITS.DESCRIPTION_MAX),
      category: input.category,
      venue: input.venue.trim().slice(0, SCHEMA_LIMITS.VENUE_MAX),
      eventDate: input.eventDate,
      eventTime: input.eventTime,
      startAtMs,
      capacity: Math.trunc(input.capacity),
      organizerName: input.organizerName.trim().slice(0, SCHEMA_LIMITS.ORGANIZER_NAME_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `events/${eventId}`);
  }
}

export async function deleteCampusEvent(eventId: string, organizerId: string): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  try {
    const regQuery = query(
      collection(db, 'registrations'),
      where('organizerId', '==', organizerId),
      where('eventId', '==', eventId)
    );
    const regSnap = await getDocs(regQuery);

    const batch = writeBatch(db);
    regSnap.forEach((regDoc) => {
      batch.delete(regDoc.ref);
    });
    batch.delete(eventRef);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `events/${eventId}`);
  }
}

export async function registerForEvent(
  event: CampusEvent,
  user: User,
  department: string,
  notes: string
): Promise<void> {
  const regId = `${event.id}_${user.uid}`;
  const eventRef = doc(db, 'events', event.id);
  const regRef = doc(db, 'registrations', regId);

  const studentName = (user.displayName || user.email?.split('@')[0] || 'Student').slice(
    0,
    SCHEMA_LIMITS.DISPLAY_NAME_MAX
  );
  const studentEmail = (user.email || '').slice(0, 150);
  const cleanDepartment = department.trim().slice(0, SCHEMA_LIMITS.DEPARTMENT_MAX);
  const cleanNotes = notes.trim().slice(0, SCHEMA_LIMITS.NOTES_MAX);

  try {
    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('This event no longer exists.');
      }
      const eventData = eventSnap.data() as Omit<CampusEvent, 'id'>;
      const existingReg = await transaction.get(regRef);
      if (existingReg.exists()) {
        throw new Error('You are already registered for this event.');
      }
      if (eventData.registeredCount >= eventData.capacity) {
        throw new Error('This event has reached maximum capacity.');
      }

      transaction.set(regRef, {
        eventId: event.id,
        studentId: user.uid,
        organizerId: eventData.organizerId,
        studentName,
        studentEmail,
        department: cleanDepartment,
        notes: cleanNotes,
        registeredAt: serverTimestamp(),
      });

      transaction.update(eventRef, {
        registeredCount: eventData.registeredCount + 1,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('already registered') ||
        error.message.includes('maximum capacity') ||
        error.message.includes('no longer exists'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `registrations/${regId}`);
  }
}

export async function unregisterFromEvent(eventId: string, user: User): Promise<void> {
  const regId = `${eventId}_${user.uid}`;
  const eventRef = doc(db, 'events', eventId);
  const regRef = doc(db, 'registrations', regId);

  try {
    await runTransaction(db, async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (!eventSnap.exists()) {
        throw new Error('This event no longer exists.');
      }
      const regSnap = await transaction.get(regRef);
      if (!regSnap.exists()) {
        throw new Error('Registration record not found.');
      }
      const eventData = eventSnap.data() as Omit<CampusEvent, 'id'>;
      const nextCount = Math.max(0, eventData.registeredCount - 1);

      transaction.delete(regRef);
      transaction.update(eventRef, {
        registeredCount: nextCount,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('not found') || error.message.includes('no longer exists'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.DELETE, `registrations/${regId}`);
  }
}

function formatIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function seedSampleCampusEvents(user: User): Promise<void> {
  const organizerName = (user.displayName || user.email?.split('@')[0] || 'Campus Organizer').slice(
    0,
    SCHEMA_LIMITS.ORGANIZER_NAME_MAX
  );

  const samples: EventFormInput[] = [
    {
      title: 'Annual Campus Hackathon & Systems Expo',
      description:
        'A 24-hour student engineering sprint building campus sustainability tools, accessible web platforms, and embedded hardware prototypes with faculty mentorship and live project demos.',
      category: 'Technology',
      venue: 'Engineering Innovation Atrium',
      eventDate: formatIsoDate(4),
      eventTime: '09:30',
      capacity: 160,
      organizerName,
    },
    {
      title: 'Fall Research Colloquium: Urban Architecture',
      description:
        'Visiting faculty and graduate fellows present adaptive reuse case studies, structural material research, and open Q&A sessions for undergraduate and postgraduate students.',
      category: 'Academic',
      venue: 'Main Lecture Theater 204',
      eventDate: formatIsoDate(7),
      eventTime: '14:00',
      capacity: 120,
      organizerName,
    },
    {
      title: 'Twilight Amphitheater Acoustic Showcase',
      description:
        'Student bands, classical ensembles, and spoken-word performers take the open-air stone amphitheater stage for an evening campus arts celebration.',
      category: 'Cultural',
      venue: 'University Stone Amphitheater',
      eventDate: formatIsoDate(11),
      eventTime: '18:30',
      capacity: 240,
      organizerName,
    },
    {
      title: 'Inter-Department Basketball Championship',
      description:
        'Semi-finals and finals of the inter-department varsity tournament featuring Engineering, Business, Sciences, and Arts squads.',
      category: 'Sports',
      venue: 'Athletics Pavilion Court A',
      eventDate: formatIsoDate(14),
      eventTime: '16:00',
      capacity: 300,
      organizerName,
    },
    {
      title: 'Spring Career & Internship Readiness Forum',
      description:
        'Portfolio critiques, technical mock interviews, and alumni panel discussions preparing students for summer internships and full-time graduate roles.',
      category: 'Career',
      venue: 'Student Union Ballroom',
      eventDate: formatIsoDate(-6),
      eventTime: '11:00',
      capacity: 140,
      organizerName,
    },
  ];

  const batch = writeBatch(db);
  for (const sample of samples) {
    const eventRef = doc(collection(db, 'events'));
    batch.set(eventRef, {
      title: sample.title,
      description: sample.description,
      category: sample.category,
      venue: sample.venue,
      eventDate: sample.eventDate,
      eventTime: sample.eventTime,
      startAtMs: computeStartAtMs(sample.eventDate, sample.eventTime),
      capacity: sample.capacity,
      registeredCount: 0,
      organizerId: user.uid,
      organizerName: sample.organizerName,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'events');
  }
}
