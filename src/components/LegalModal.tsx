import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'disclaimer' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legalModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="legalModalTitle" className="text-base font-bold text-slate-900">
            {isPrivacy
              ? 'Privacy Policy (Demonstration)'
              : 'Medical & Pricing Disclaimer'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 text-sm leading-relaxed text-slate-600">
          {isPrivacy ? (
            <p>
              MediCompare BD runs locally in your browser using{' '}
              <strong className="text-slate-900">localStorage</strong>. Visitor
              registrations, saved tests, reviews, and booking requests stay on your device
              and are not transmitted to an external server.
            </p>
          ) : (
            <p>
              All diagnostic test fees in Bangladeshi Taka (৳), hospital schedules, and
              ratings shown in this application are reference demonstration figures.
              MediCompare BD does not provide medical advice or certify laboratory
              accreditation. Always verify official charges with the diagnostic centre
              prior to testing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
