import React, { useState } from 'react';
import { LogOut, Menu, Shield, User, X } from 'lucide-react';
import { SessionState } from '../types/medicompare';

interface HeaderProps {
  session: SessionState;
  canUseAdmin: boolean;
  isTempAdmin: boolean;
  savedCount: number;
  onOpenAccount: () => void;
  onOpenTempAdmin: () => void;
  onExitTempAdmin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  canUseAdmin,
  isTempAdmin,
  savedCount,
  onOpenAccount,
  onOpenTempAdmin,
  onExitTempAdmin,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = session.role !== 'guest';
  const showAdminControl = !isLoggedIn || canUseAdmin;
  const firstName = session.name ? session.name.split(' ')[0] : 'Account';

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          MediCompare BD
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#compare-tests"
            className="whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
          >
            Compare Tests
          </a>
          <a
            href="#centres-directory"
            className="whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
          >
            Diagnostic Centres
          </a>
          <a
            href="#patient-reviews"
            className="whitespace-nowrap shrink-0 hover:text-slate-900 hover:underline underline-offset-4 transition-colors"
          >
            Patient Reviews
          </a>
          {isLoggedIn && (
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer font-semibold text-teal-800 hover:underline underline-offset-4 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              {firstName} ({savedCount})
            </button>
          )}
          {showAdminControl && (
            <button
              type="button"
              onClick={onOpenTempAdmin}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer font-semibold hover:underline underline-offset-4 transition-colors ${
                isTempAdmin ? 'text-amber-800' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              {isTempAdmin ? 'Admin Panel' : 'Admin'}
            </button>
          )}
        </nav>

        {/* Zone 3: Primary CTA (Sign In when guest, Exit Temp Admin / Logout when signed in) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isLoggedIn ? (
            <>
              {canUseAdmin && isTempAdmin && (
                <button
                  type="button"
                  onClick={onExitTempAdmin}
                  className="hidden sm:inline-flex items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  Exit Temp Admin
                </button>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAccount}
              className="hidden sm:inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
            <a
              href="#compare-tests"
              onClick={closeMobile}
              className="rounded-md px-2 py-2 hover:bg-slate-50"
            >
              Compare Tests
            </a>
            <a
              href="#centres-directory"
              onClick={closeMobile}
              className="rounded-md px-2 py-2 hover:bg-slate-50"
            >
              Diagnostic Centres
            </a>
            <a
              href="#patient-reviews"
              onClick={closeMobile}
              className="rounded-md px-2 py-2 hover:bg-slate-50"
            >
              Patient Reviews
            </a>

            <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {isLoggedIn ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onOpenAccount();
                    }}
                    className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 cursor-pointer"
                  >
                    My Account ({session.name})
                  </button>
                  {canUseAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        closeMobile();
                        onOpenTempAdmin();
                      }}
                      className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                    >
                      {isTempAdmin ? 'Open Admin Panel' : 'Admin Panel'}
                    </button>
                  )}
                  {canUseAdmin && isTempAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        closeMobile();
                        onExitTempAdmin();
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                    >
                      Exit Temp Admin
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onLogout();
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onOpenAccount();
                    }}
                    className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 cursor-pointer"
                  >
                    Sign In / Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      onOpenTempAdmin();
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 cursor-pointer"
                  >
                    Admin Panel
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
