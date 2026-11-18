import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, LogOut, Mail, Shield, User, X } from 'lucide-react';
import {
  DiagnosticCentre,
  FeedbackMessage,
  SampleBooking,
  SavedTestRef,
  VisitorUser,
} from '../types/medicompare';
import { formatBDT } from '../data/seedData';

interface VisitorAccountModalProps {
  isOpen: boolean;
  user: VisitorUser | null;
  guestSavedTests: SavedTestRef[];
  centres: DiagnosticCentre[];
  areas: string[];
  bookings: SampleBooking[];
  onSignIn: (email: string, pass: string) => Promise<FeedbackMessage>;
  onSignUp: (name: string, email: string, area: string, pass: string) => Promise<FeedbackMessage>;
  onRequestPasswordReset: (email: string) => Promise<FeedbackMessage>;
  onUpdatePassword: (newPassword: string) => Promise<FeedbackMessage>;
  isPasswordRecovery: boolean;
  onCancelPasswordRecovery: () => void;
  onUpdateArea: (area: string) => void;
  onLogout: () => void;
  onRemoveSavedTest: (centreId: string, testId: string) => void;
  onViewCentre: (centreId: string) => void;
  isTempAdmin: boolean;
  onOpenTempAdmin: () => void;
  onExitTempAdmin: () => void;
  onClose: () => void;
}

export const VisitorAccountModal: React.FC<VisitorAccountModalProps> = ({
  isOpen,
  user,
  guestSavedTests,
  centres,
  areas,
  bookings,
  onSignIn,
  onSignUp,
  onRequestPasswordReset,
  onUpdatePassword,
  isPasswordRecovery,
  onCancelPasswordRecovery,
  onUpdateArea,
  onLogout,
  onRemoveSavedTest,
  onViewCentre,
  isTempAdmin,
  onOpenTempAdmin,
  onExitTempAdmin,
  onClose,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [signInFeedback, setSignInFeedback] = useState<FeedbackMessage>({
    text: '',
    type: '',
  });

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetFeedback, setResetFeedback] = useState<FeedbackMessage>({
    text: '',
    type: '',
  });

  // Set / Change Password state
  const [showChangePassForm, setShowChangePassForm] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [updatePassFeedback, setUpdatePassFeedback] = useState<FeedbackMessage>({
    text: '',
    type: '',
  });

  // Sign Up state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regArea, setRegArea] = useState(areas[0] || 'Dhanmondi');
  const [regPass, setRegPass] = useState('');
  const [regConfirmPass, setRegConfirmPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [signUpFeedback, setSignUpFeedback] = useState<FeedbackMessage>({
    text: '',
    type: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isPasswordRecovery) {
      setUpdatePassFeedback({ text: '', type: '' });
      setNewPass('');
      setConfirmNewPass('');
    }
  }, [isPasswordRecovery]);

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSignInFeedback({ text: '', type: '' });
    try {
      const res = await onSignIn(loginEmail, loginPass);
      setSignInFeedback(res);
      if (res.type === 'success') {
        setLoginEmail('');
        setLoginPass('');
        setShowLoginPass(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPass !== regConfirmPass) {
      setSignUpFeedback({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setSignUpFeedback({ text: '', type: '' });
    try {
      const res = await onSignUp(regName, regEmail, regArea, regPass);
      setSignUpFeedback(res);
      if (res.type === 'success') {
        setRegName('');
        setRegEmail('');
        setRegPass('');
        setRegConfirmPass('');
        setShowRegPass(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSavedTests = user ? user.savedTests : guestSavedTests;
  const myBookings = user
    ? bookings.filter((b) => b.userId === user.id)
    : bookings;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accountModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 id="accountModalTitle" className="text-lg font-bold text-slate-900">
                {user ? 'My Personal Account' : 'Personal Account'}
              </h2>
              <p className="text-xs text-slate-500">
                {user
                  ? `${user.email} · Saved tests & sample collection requests`
                  : 'Sign in or create a personal account to keep your saved tests & requests'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account modal"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {isPasswordRecovery ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newPass.length < 6) {
                  setUpdatePassFeedback({
                    text: 'New password must be at least 6 characters.',
                    type: 'error',
                  });
                  return;
                }
                if (newPass !== confirmNewPass) {
                  setUpdatePassFeedback({
                    text: 'Passwords do not match.',
                    type: 'error',
                  });
                  return;
                }
                setIsSubmitting(true);
                setUpdatePassFeedback({ text: '', type: '' });
                try {
                  const res = await onUpdatePassword(newPass);
                  setUpdatePassFeedback(res);
                  if (res.type === 'success') {
                    setNewPass('');
                    setConfirmNewPass('');
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50/70 p-4">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-teal-800" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Set a New Password
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-600">
                    Your email verification link was confirmed. Enter a new password below for {user?.email || 'your account'}.
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="recoveryNewPass"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    id="recoveryNewPass"
                    type={showNewPass ? 'text' : 'password'}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass((prev) => !prev)}
                    aria-label={showNewPass ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="recoveryConfirmPass"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Confirm New Password
                </label>
                <input
                  id="recoveryConfirmPass"
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  placeholder="Repeat new password"
                  minLength={6}
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                />
              </div>

              {updatePassFeedback.text && (
                <p
                  aria-live="polite"
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    updatePassFeedback.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {updatePassFeedback.text}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 flex-1 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer transition-colors"
                >
                  {isSubmitting ? 'Updating Password...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={onCancelPasswordRecovery}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : !user ? (
            <>
              {/* Auth Tabs */}
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setSignInFeedback({ text: '', type: '' });
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold cursor-pointer transition-colors ${
                    authTab === 'signin' || authTab === 'forgot'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setSignUpFeedback({ text: '', type: '' });
                  }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold cursor-pointer transition-colors ${
                    authTab === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Personal Account
                </button>
              </div>

              {authTab === 'forgot' ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmitting(true);
                    setResetFeedback({ text: '', type: '' });
                    try {
                      const res = await onRequestPasswordReset(resetEmail);
                      setResetFeedback(res);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-teal-800" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Reset Password via Email
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-600">
                        Enter your registered account email address and we will send you a password reset link.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="userResetEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Registered Email Address
                    </label>
                    <input
                      id="userResetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                    />
                  </div>

                  {resetFeedback.text && (
                    <p
                      aria-live="polite"
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        resetFeedback.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {resetFeedback.text}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-10 flex-1 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer transition-colors"
                    >
                      {isSubmitting ? 'Sending Reset Link...' : 'Send Reset Link'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('signin');
                        setResetFeedback({ text: '', type: '' });
                      }}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : authTab === 'signin' ? (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="userLoginEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="userLoginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="userLoginPass"
                        className="block text-xs font-semibold text-slate-700"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(loginEmail);
                          setResetFeedback({ text: '', type: '' });
                          setAuthTab('forgot');
                        }}
                        className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="userLoginPass"
                        type={showLoginPass ? 'text' : 'password'}
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPass((prev) => !prev)}
                        aria-label={showLoginPass ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showLoginPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {signInFeedback.text && (
                    <p
                      aria-live="polite"
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        signInFeedback.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {signInFeedback.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer transition-colors"
                  >
                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="userRegName"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="userRegName"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Ayesha Rahman"
                        required
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="userRegArea"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Preferred Area
                      </label>
                      <select
                        id="userRegArea"
                        value={regArea}
                        onChange={(e) => setRegArea(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
                      >
                        {areas.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="userRegEmail"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      id="userRegEmail"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="userRegPass"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Password (min 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          id="userRegPass"
                          type={showRegPass ? 'text' : 'password'}
                          value={regPass}
                          onChange={(e) => setRegPass(e.target.value)}
                          placeholder="Create password"
                          minLength={6}
                          required
                          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass((prev) => !prev)}
                          aria-label={showRegPass ? 'Hide password' : 'Show password'}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {showRegPass ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="userRegConfirmPass"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="userRegConfirmPass"
                        type={showRegPass ? 'text' : 'password'}
                        value={regConfirmPass}
                        onChange={(e) => setRegConfirmPass(e.target.value)}
                        placeholder="Repeat password"
                        minLength={6}
                        required
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                      />
                    </div>
                  </div>

                  {signUpFeedback.text && (
                    <p
                      aria-live="polite"
                      className={`rounded-lg px-3 py-2 text-xs font-medium ${
                        signUpFeedback.type === 'error'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {signUpFeedback.text}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 w-full rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer transition-colors"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Personal Account'}
                  </button>
                </form>
              )}

              {/* Current Browser Saved Tests Preview (for guests) */}
              {activeSavedTests.length > 0 && (
                <div className="border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Browser Shortlist ({activeSavedTests.length})
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Create a personal account or sign in to save these tests under your profile.
                  </p>
                  <div className="space-y-2">
                    {activeSavedTests.map((ref) => {
                      const centre = centres.find((c) => c.id === ref.centreId);
                      const test = centre?.tests.find((t) => t.testId === ref.testId);
                      if (!centre || !test) return null;
                      return (
                        <div
                          key={`${ref.centreId}::${ref.testId}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{test.name}</div>
                            <div className="text-slate-500">
                              {centre.name} · <span className="font-mono font-semibold text-teal-800">{formatBDT(test.price)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveSavedTest(centre.id, test.testId)}
                            className="text-rose-700 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              {/* Signed-In Personal Profile Card */}
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{user.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {user.email} · {user.role === 'admin' ? 'Owner Account' : 'Personal Account'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="profileAreaSelect" className="text-xs font-medium text-slate-600">
                      Preferred Area:
                    </label>
                    <select
                      id="profileAreaSelect"
                      value={user.area}
                      onChange={(e) => onUpdateArea(e.target.value)}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800"
                    >
                      {areas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassForm((prev) => !prev);
                        setUpdatePassFeedback({ text: '', type: '' });
                      }}
                      className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {showChangePassForm ? 'Close' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {showChangePassForm && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (newPass.length < 6) {
                        setUpdatePassFeedback({
                          text: 'Password must be at least 6 characters.',
                          type: 'error',
                        });
                        return;
                      }
                      if (newPass !== confirmNewPass) {
                        setUpdatePassFeedback({
                          text: 'Passwords do not match.',
                          type: 'error',
                        });
                        return;
                      }
                      setIsSubmitting(true);
                      setUpdatePassFeedback({ text: '', type: '' });
                      try {
                        const res = await onUpdatePassword(newPass);
                        setUpdatePassFeedback(res);
                        if (res.type === 'success') {
                          setNewPass('');
                          setConfirmNewPass('');
                          setShowChangePassForm(false);
                        }
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2"
                  >
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="New password (min 6 chars)"
                      minLength={6}
                      required
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"
                    />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      placeholder="Confirm new password"
                      minLength={6}
                      required
                      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showNewPass}
                          onChange={(e) => setShowNewPass(e.target.checked)}
                          className="h-3.5 w-3.5 accent-teal-700"
                        />
                        Show passwords
                      </label>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
                      >
                        {isSubmitting ? 'Saving...' : 'Save New Password'}
                      </button>
                    </div>
                    {updatePassFeedback.text && (
                      <p
                        className={`sm:col-span-2 text-xs font-medium ${
                          updatePassFeedback.type === 'error'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {updatePassFeedback.text}
                      </p>
                    )}
                  </form>
                )}
              </div>

              {user.role === 'admin' && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-amber-950">
                      <Shield className="h-4 w-4 text-amber-700" />
                      Temporary Admin Access
                    </div>
                    <p className="text-xs text-amber-900/80">
                      {isTempAdmin
                        ? 'Temporary Admin Mode is active. Exit anytime to return to standard user mode.'
                        : 'Enable Temporary Admin Mode from your user account to manage hospitals, test fees, and requests.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTempAdmin();
                      }}
                      className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                    >
                      {isTempAdmin ? 'Open Admin Panel' : 'Enable Temp Admin'}
                    </button>
                    {isTempAdmin && (
                      <button
                        type="button"
                        onClick={onExitTempAdmin}
                        className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                      >
                        Exit
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Tests & Live Prices */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  My Saved Tests &amp; Live Prices ({activeSavedTests.length})
                </h4>
                {activeSavedTests.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
                    No saved tests yet. Click &ldquo;Save&rdquo; on any test card to track its
                    live fee in ৳ here.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {activeSavedTests.map((ref) => {
                      const centre = centres.find((c) => c.id === ref.centreId);
                      const test = centre?.tests.find((t) => t.testId === ref.testId);
                      if (!centre || !test) return null;
                      return (
                        <div
                          key={`${ref.centreId}::${ref.testId}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {test.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {centre.name} ({centre.area}) ·{' '}
                              <span className="font-mono">{test.testId}</span>
                            </div>
                            <div className="mt-1 font-mono text-sm font-bold text-teal-800 tabular-nums">
                              {formatBDT(test.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewCentre(centre.id);
                              }}
                              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveSavedTest(centre.id, test.testId)}
                              className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* My Sample Requests */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  My Sample Requests ({myBookings.length})
                </h4>
                {myBookings.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 p-4 text-xs text-slate-600">
                    No sample requests yet. Open any diagnostic centre&apos;s Details to request a slot.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {myBookings.map((req) => {
                      const centre = centres.find((c) => c.id === req.centreId);
                      const statusColor =
                        req.status === 'Completed'
                          ? 'text-emerald-700'
                          : req.status === 'Confirmed'
                          ? 'text-teal-700'
                          : 'text-amber-700';
                      return (
                        <div
                          key={req.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {req.testName}
                            </div>
                            <div className="text-xs text-slate-500">
                              {centre ? centre.name : 'Hospital'} · {req.collectionType}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-600 tabular-nums">
                              Preferred Date: {req.preferredDate}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold ${statusColor}`}>
                            Status: {req.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
