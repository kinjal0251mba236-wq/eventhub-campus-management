# EVENTHUB – Campus Event Management System

EVENTHUB is a full-stack campus event management portal built with React, TypeScript, Vite, Tailwind CSS, Firebase Authentication (Google Sign-In), and Cloud Firestore. Students can discover campus events, filter by category or search term, view upcoming calendar schedules, register or unregister for seats, and track their personal registration history. Organizers can publish events, edit or delete only the events they created, and inspect or export registered participant rosters.

## Features

- **Google Sign-In Authentication**: Secure authentication via Firebase Auth (`GoogleAuthProvider`).
- **Campus Dashboard**: Real-time counts for total events, upcoming events, past events, and personal registrations alongside a calendar-style upcoming schedule.
- **Event Discovery & Filtering**: Live search by event title, venue, or organizer; category filters (`Technology`, `Academic`, `Cultural`, `Sports`, `Career`, `Workshop`); and dedicated Upcoming vs. Past event views.
- **Interactive Campus Calendar**: Monthly calendar grid with date selection and agenda breakdown.
- **Transactional Registration**: Atomic Firestore transactions keep event `registeredCount` synchronized with student registration records (`registrations/{eventId}_{studentId}`).
- **Personal Registration History**: Dedicated student view of active upcoming registrations and past event history.
- **Organizer Studio**: Event creators can create, edit, and delete their own events, and inspect or export CSV rosters of registered students.
- **Hardened Firestore Security Rules**: Enforces authenticated verified writes, creator-only edits/deletes, atomic registration counts, and strict PII isolation on user profiles and student registrations.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend / Database**: Firebase Authentication (Google), Cloud Firestore
- **Deployment Ready**: Configured for GitHub and Vercel (`vercel.json` + `VITE_FIREBASE_*` environment variables)

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and fill in your Firebase Web App credentials:
   ```bash
   cp .env.example .env.local
   ```
   ```env
   VITE_FIREBASE_API_KEY="your-firebase-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="your-project-id"
   VITE_FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
   VITE_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
   VITE_FIREBASE_APP_ID="your-firebase-app-id"
   VITE_FIREBASE_DATABASE_ID="(default)"
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build and type-check**:
   ```bash
   npm run lint
   npm run build
   ```

## Firebase Setup Instructions

1. Open the [Firebase Console](https://console.firebase.google.com/) and create (or select) a project.
2. **Enable Authentication**:
   - Go to **Build → Authentication → Sign-in method**.
   - Enable **Google** as a sign-in provider.
   - Add your local (`localhost`) and production Vercel domain (`your-app.vercel.app`) under **Authentication → Settings → Authorized domains**.
3. **Create Cloud Firestore Database**:
   - Go to **Build → Firestore Database** and create a database.
   - Deploy the included `firestore.rules` file via Firebase CLI:
     ```bash
     firebase deploy --only firestore:rules
     ```
4. **Lint Security Rules**:
   ```bash
   npx eslint firestore.rules
   ```

## GitHub & Vercel Deployment

1. Push this repository to GitHub (ensure `.env.local` is not committed; `.gitignore` excludes `.env*` while keeping `.env.example`).
2. Import the repository in [Vercel](https://vercel.com/).
3. Vercel automatically detects Vite and `vercel.json` (build command: `npm run build`, output directory: `dist`).
4. Add all `VITE_FIREBASE_*` variables from `.env.example` under **Project Settings → Environment Variables** in Vercel.
5. Deploy, then add your Vercel deployment domain to **Firebase Authentication → Authorized domains**.
