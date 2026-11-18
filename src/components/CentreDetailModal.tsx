import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DiagnosticCentre, FeedbackMessage, VisitorUser } from '../types/medicompare';
import { formatBDT } from '../data/seedData';

interface CentreDetailModalProps {
  centre: DiagnosticCentre | null;
  ratingLabel: string;
  user: VisitorUser | null;
  isTestSaved: (centreId: string, testId: string) => boolean;
  onToggleSave: (centreId: string, testId: string) => void;
  onSubmitBooking: (payload: {
    centreId: string;
    patientName: string;
    patientPhone: string;
    testName: string;
    collectionType: string;
    preferredDate: string;
  }) => void;
  onClose: () => void;
}

export const CentreDetailModal: React.FC<CentreDetailModalProps> = ({
  centre,
  ratingLabel,
  user,
  isTestSaved,
  onToggleSave,
  onSubmitBooking,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedTestName, setSelectedTestName] = useState('');
  const [collectionType, setCollectionType] = useState('Walk-in Counter');
  const [preferredDate, setPreferredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [bookingFeedback, setBookingFeedback] = useState<FeedbackMessage>({
    text: '',
    type: '',
  });

  useEffect(() => {
    if (centre) {
      setSearchQuery('');
      setSelectedCategory('all');
      setPatientName(user ? user.name : '');
      setPatientPhone('');
      setSelectedTestName(centre.tests[0]?.name || '');
      setCollectionType('Walk-in Counter');
      setPreferredDate(new Date().toISOString().split('T')[0]);
      setBookingFeedback({ text: '', type: '' });
    }
  }, [centre, user]);

  if (!centre) return null;

  const categories = [...new Set(centre.tests.map((t) => t.category))].sort();
  const filteredTests = centre.tests.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    const q = searchQuery.trim().toLowerCase();
    if (q && !`${t.name} ${t.testId} ${t.prep}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      setBookingFeedback({
        text: 'Please enter your name and mobile number.',
        type: 'error',
      });
      return;
    }

    onSubmitBooking({
      centreId: centre.id,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      testName: selectedTestName || centre.tests[0]?.name || 'Diagnostic Test',
      collectionType,
      preferredDate,
    });

    setBookingFeedback({
      text: user
        ? 'Request submitted! Track your request status in My Personal Account.'
        : 'Request submitted! Sign in or create a personal account to track request status.',
      type: 'success',
    });
    setPatientPhone('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="detailModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-medium text-teal-800">
              {centre.area} · Reference Diagnostic Profile
            </p>
            <h2 id="detailModalTitle" className="text-xl font-bold text-slate-900">
              {centre.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close hospital details"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Summary Grid */}
          <dl className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-900">Address</dt>
              <dd className="mt-0.5">{centre.address}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Phone</dt>
              <dd className="mt-0.5 font-mono">{centre.phone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Hours</dt>
              <dd className="mt-0.5">{centre.hours}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Home Collection</dt>
              <dd className="mt-0.5">
                {centre.homeCollection ? 'Available' : 'Walk-in Only'}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Patient Rating</dt>
              <dd className="mt-0.5 tabular-nums">★ {ratingLabel}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Tests Listed</dt>
              <dd className="mt-0.5 tabular-nums">{centre.tests.length} procedures</dd>
            </div>
          </dl>

          <p className="text-sm text-slate-600">
            <strong className="text-slate-900">Service Information:</strong> {centre.notes}
          </p>

          {/* Test Price Schedule */}
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Test Price Schedule (৳ BDT)
            </h3>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter tests inside ${centre.name}...`}
                className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 sm:w-56"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Code</th>
                    <th className="px-3.5 py-2.5">Medical Test</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5 text-right">Fee (৳)</th>
                    <th className="px-3.5 py-2.5 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                        No matching tests found.
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((t) => {
                      const saved = isTestSaved(centre.id, t.testId);
                      return (
                        <tr key={t.testId} className="hover:bg-slate-50/70">
                          <td className="px-3.5 py-2.5 font-mono text-xs text-slate-600 tabular-nums">
                            {t.testId}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-slate-900">{t.name}</div>
                            <div className="text-xs text-slate-500">{t.prep}</div>
                          </td>
                          <td className="px-3.5 py-2.5 text-xs text-slate-600">
                            {t.category}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatBDT(t.price)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => onToggleSave(centre.id, t.testId)}
                              className={`rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                                saved
                                  ? 'border-amber-600 bg-amber-50 text-amber-900'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {saved ? 'Saved ★' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sample Collection Booking Inquiry */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-base font-semibold text-slate-900">
              Request Test Slot / Sample Collection
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {user
                ? `Booking as ${user.name} — tracked in your Personal Account.`
                : 'Submit an appointment inquiry (sign in or create a personal account to track status).'}
            </p>

            <form onSubmit={handleBookingSubmit} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="bookingPatientName"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Patient Name
                  </label>
                  <input
                    id="bookingPatientName"
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Full Name"
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="bookingPatientPhone"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Mobile Number
                  </label>
                  <input
                    id="bookingPatientPhone"
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="bookingTestSelect"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Select Test
                  </label>
                  <select
                    id="bookingTestSelect"
                    value={selectedTestName}
                    onChange={(e) => setSelectedTestName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
                  >
                    {centre.tests.map((t) => (
                      <option key={t.testId} value={t.name}>
                        {t.name} ({formatBDT(t.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bookingCollectionSelect"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Collection Mode
                  </label>
                  <select
                    id="bookingCollectionSelect"
                    value={collectionType}
                    onChange={(e) => setCollectionType(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
                  >
                    <option value="Walk-in Counter">Walk-in Counter</option>
                    {centre.homeCollection && (
                      <option value="Home Sample Collection">
                        Home Sample Collection
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bookingDateInput"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Preferred Date
                  </label>
                  <input
                    id="bookingDateInput"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                  />
                </div>
              </div>

              {bookingFeedback.text && (
                <p
                  aria-live="polite"
                  className={`text-xs font-medium ${
                    bookingFeedback.type === 'error'
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {bookingFeedback.text}
                </p>
              )}

              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 cursor-pointer transition-colors"
              >
                Submit Booking Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
