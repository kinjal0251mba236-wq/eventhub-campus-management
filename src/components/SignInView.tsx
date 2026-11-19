import { useState } from 'react';
import { Calendar, CheckCircle2, ShieldCheck, Users } from 'lucide-react';
import { isFirebaseConfigured } from '@/src/lib/firebase';

interface SignInViewProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
}

export function SignInView({ onSignIn, authError }: SignInViewProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setSubmitting(true);
    try {
      await onSignIn();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="w-full bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <span className="font-display text-xl font-bold tracking-tight text-[#0B1B3B] whitespace-nowrap shrink-0">
            EVENTHUB
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#capabilities" className="hover:text-[#0B1B3B] transition-colors whitespace-nowrap shrink-0">
              Overview
            </a>
            <a href="#campus-life" className="hover:text-[#0B1B3B] transition-colors whitespace-nowrap shrink-0">
              Campus Events
            </a>
            <a href="#security" className="hover:text-[#0B1B3B] transition-colors whitespace-nowrap shrink-0">
              Access Policy
            </a>
          </nav>
          <button
            type="button"
            onClick={handleClick}
            disabled={submitting || !isFirebaseConfigured}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0B1B3B] hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-8 lg:p-10">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-3">
                Campus Event Management Portal
              </p>
              <h1
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B1B3B] leading-tight mb-5"
                style={{ textWrap: 'balance' }}
              >
                Discover campus events, reserve seats, and manage student programs.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed max-w-xl mb-8">
                EVENTHUB connects university students, academic departments, and student organizations in one verified portal. Browse upcoming symposiums, track your registration history, and coordinate event rosters securely.
              </p>

              {!isFirebaseConfigured && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                  Firebase environment variables are not configured yet. Add your <code className="font-mono text-xs">VITE_FIREBASE_*</code> variables to <code className="font-mono text-xs">.env</code> or include <code className="font-mono text-xs">firebase-applet-config.json</code>.
                </div>
              )}

              {authError && (
                <div role="alert" className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  {authError}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={handleClick}
                  disabled={submitting || !isFirebaseConfigured}
                  className="inline-flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                    />
                  </svg>
                  {submitting ? 'Connecting Google Account...' : 'Continue with Google'}
                </button>
              </div>
            </div>

            <div id="capabilities" className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <Calendar className="w-5 h-5 text-blue-600 mb-2" />
                <h2 className="text-sm font-semibold text-[#0B1B3B] mb-1">Unified Schedule</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Filter upcoming and past campus events by category, venue, or date.
                </p>
              </div>
              <div>
                <CheckCircle2 className="w-5 h-5 text-blue-600 mb-2" />
                <h2 className="text-sm font-semibold text-[#0B1B3B] mb-1">One-Click Seats</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Reserve or release spots with live capacity tracking and personal history.
                </p>
              </div>
              <div>
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <h2 className="text-sm font-semibold text-[#0B1B3B] mb-1">Organizer Studio</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Publish events, manage rosters, and export participant lists securely.
                </p>
              </div>
            </div>
          </div>

          <div id="campus-life" className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/campus_tech_symposium_1795095778722.jpg"
                  alt="Students collaborating during an engineering hackathon in the university atrium"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">Technology · Engineering Atrium</p>
                <p className="text-sm font-semibold text-[#0B1B3B]">Student Hackathons &amp; Demos</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/campus_cultural_fest_1795095779060.jpg"
                  alt="Evening campus amphitheater cultural performance"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">Cultural · Stone Amphitheater</p>
                <p className="text-sm font-semibold text-[#0B1B3B]">Arts &amp; Acoustic Evenings</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/campus_academic_seminar_1795095777158.jpg"
                  alt="Faculty research colloquium in modern lecture theater"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">Academic · Lecture Theater</p>
                <p className="text-sm font-semibold text-[#0B1B3B]">Department Colloquiums</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/campus_sports_tournament_1795095779612.jpg"
                  alt="University athletics pavilion championship match"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-500 mb-1">Sports · Athletics Pavilion</p>
                <p className="text-sm font-semibold text-[#0B1B3B]">Inter-Department Athletics</p>
              </div>
            </div>
          </div>
        </div>

        <section
          id="security"
          className="mt-10 bg-white border border-slate-200 rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0B1B3B] shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-sm text-slate-600">
              Verified Google Sign-In protects student registration records. Organizers only view rosters for events they create.
            </p>
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            Role-scoped Firestore security rules
          </span>
        </section>
      </main>
    </div>
  );
}
