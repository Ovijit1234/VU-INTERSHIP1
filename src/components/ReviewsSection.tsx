import React, { useEffect, useState } from 'react';
import { Lock, Star } from 'lucide-react';
import { DiagnosticCentre, FeedbackMessage, PatientReview, SessionState } from '../types/medicompare';

interface ReviewsSectionProps {
  centres: DiagnosticCentre[];
  reviews: PatientReview[];
  session: SessionState;
  onAddReview: (centreId: string, rating: number, author: string, comment: string) => void;
  onOpenAccount: () => void;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  centres,
  reviews,
  session,
  onAddReview,
  onOpenAccount,
}) => {
  const [selectedCentreId, setSelectedCentreId] = useState(centres[0]?.id || '');
  const [starRating, setStarRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [filterCentreId, setFilterCentreId] = useState('all');
  const [feedback, setFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  useEffect(() => {
    if (!centres.some((c) => c.id === selectedCentreId) && centres[0]) {
      setSelectedCentreId(centres[0].id);
    }
  }, [centres, selectedCentreId]);

  useEffect(() => {
    if (session.role === 'visitor' && session.name && !authorName.trim()) {
      setAuthorName(session.name);
    }
  }, [session.role, session.name, authorName]);

  const filteredReviews = reviews.filter(
    (r) => filterCentreId === 'all' || r.centreId === filterCentreId
  );

  const isSignedInUser = session.role !== 'guest';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedInUser) {
      setFeedback({ text: 'Please sign in to post a rating or comment.', type: 'error' });
      return;
    }
    if (!starRating) {
      setFeedback({ text: 'Please select a 1–5 star rating.', type: 'error' });
      return;
    }
    const finalAuthor = authorName.trim() || session.name;
    if (!finalAuthor || !comment.trim()) {
      setFeedback({ text: 'Please enter a short review comment.', type: 'error' });
      return;
    }
    onAddReview(selectedCentreId, starRating, finalAuthor, comment.trim());
    setComment('');
    setStarRating(0);
    setFeedback({ text: 'Thank you! Your review has been posted.', type: 'success' });
  };

  return (
    <section id="patient-reviews" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Patient Reviews &amp; Ratings
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {isSignedInUser
            ? `Signed in as ${session.name}. Rate centres and share your laboratory experience.`
            : 'Read verified patient feedback below. Sign in to your personal account to leave a rating or comment.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Write Review Form (Signed-in Users Only) */}
        <div className="lg:col-span-5">
          {!isSignedInUser ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Sign In to Rate &amp; Comment
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Only signed-in users can submit star ratings and review comments. Create a personal account in seconds to share your feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAccount}
                className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer transition-colors"
              >
                Sign In or Create Account
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">Write a Patient Review</h3>
                <span className="text-xs font-medium text-teal-800">
                  {session.name}
                </span>
              </div>

            <div>
              <label htmlFor="reviewCentreSelect" className="block text-xs font-medium text-slate-700 mb-1">
                Diagnostic Centre
              </label>
              <select
                id="reviewCentreSelect"
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.area})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 mb-1.5">
                Star Rating
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const active = val <= starRating;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStarRating(val)}
                      aria-label={`Rate ${val} out of 5 stars`}
                      className="rounded-md p-1.5 hover:bg-slate-100 cursor-pointer transition-colors"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          active
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-medium text-slate-600 tabular-nums">
                  {starRating > 0 ? `${starRating} of 5 stars` : 'Select rating'}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="reviewerNameInput" className="block text-xs font-medium text-slate-700 mb-1">
                Your Name
              </label>
              <input
                id="reviewerNameInput"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Full Name"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="reviewCommentInput" className="block text-xs font-medium text-slate-700 mb-1">
                Review Comment
              </label>
              <textarea
                id="reviewCommentInput"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share waiting time, report speed, and pricing transparency..."
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
              />
            </div>

            {feedback.text && (
              <p
                aria-live="polite"
                className={`text-xs font-medium ${
                  feedback.type === 'error' ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 cursor-pointer transition-colors"
            >
              Submit Patient Review
            </button>
          </form>
          )}
        </div>

        {/* Right: Reviews Feed */}
        <div className="lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-900">
              Recent Patient Feedback ({filteredReviews.length})
            </span>
            <select
              aria-label="Filter reviews by centre"
              value={filterCentreId}
              onChange={(e) => setFilterCentreId(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800"
            >
              <option value="all">All Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.area})
                </option>
              ))}
            </select>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              No patient reviews yet for this centre.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReviews.map((rev) => {
                const centre = centres.find((c) => c.id === rev.centreId);
                return (
                  <article
                    key={rev.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {rev.author}
                        {rev.verifiedVisitor && (
                          <span className="ml-1.5 text-xs font-normal text-teal-700">
                            · Verified Member
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-0.5 text-amber-500"
                        aria-label={`${rev.rating} out of 5 stars`}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`h-3.5 w-3.5 ${
                              n <= rev.rating
                                ? 'fill-amber-400 text-amber-500'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      {centre ? `${centre.name} (${centre.area})` : 'Diagnostic Centre'} ·{' '}
                      <span className="font-mono">{rev.createdAt}</span>
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-700">
                      {rev.comment}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
