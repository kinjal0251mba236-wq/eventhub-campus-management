import type { Timestamp } from 'firebase/firestore';

export const EVENT_CATEGORIES = [
  'Technology',
  'Academic',
  'Cultural',
  'Sports',
  'Career',
  'Workshop',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * Validation constants synchronized with firebase-blueprint.json & firestore.rules
 */
export const SCHEMA_LIMITS = {
  TITLE_MIN: 3,
  TITLE_MAX: 120,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 2000,
  VENUE_MIN: 2,
  VENUE_MAX: 150,
  ORGANIZER_NAME_MIN: 1,
  ORGANIZER_NAME_MAX: 100,
  CAPACITY_MIN: 1,
  CAPACITY_MAX: 5000,
  DISPLAY_NAME_MAX: 100,
  DEPARTMENT_MAX: 100,
  NOTES_MAX: 300,
  DATE_REGEX: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  TIME_REGEX: /^[0-9]{2}:[0-9]{2}$/,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  department: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CampusEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // HH:MM
  startAtMs: number;
  capacity: number;
  registeredCount: number;
  organizerId: string;
  organizerName: string;
  status: 'published';
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  organizerId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  notes: string;
  registeredAt?: Timestamp;
}

export interface EventFormInput {
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  eventDate: string;
  eventTime: string;
  capacity: number;
  organizerName: string;
}

export type AppSection =
  | 'dashboard'
  | 'browse'
  | 'calendar'
  | 'registrations'
  | 'organizer';
