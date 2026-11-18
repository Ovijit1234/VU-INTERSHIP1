import React from 'react';
import { Star } from 'lucide-react';
import { DiagnosticCentre } from '../types/medicompare';
import { formatBDT } from '../data/seedData';

interface CentresDirectoryProps {
  centres: DiagnosticCentre[];
  areas: string[];
  activeArea: string;
  onAreaChange: (area: string) => void;
  getRatingStats: (centreId: string) => { avg: number; count: number; label: string };
  onViewDetails: (centreId: string) => void;
}

export const CentresDirectory: React.FC<CentresDirectoryProps> = ({
  centres,
  areas,
  activeArea,
  onAreaChange,
  getRatingStats,
  onViewDetails,
}) => {
  const safeArea = activeArea !== 'all' && !areas.includes(activeArea) ? 'all' : activeArea;
  const filteredCentres = centres.filter(
    (c) => safeArea === 'all' || c.area === safeArea
  );

  return (
    <section
      id="centres-directory"
      className="border-y border-slate-200 bg-white py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Diagnostic Centres Directory
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Explore locations, hours, home collection availability, and complete test schedules.
            </p>
          </div>
        </div>

        {/* Interactive Area Filter Segmented Tabs */}
        <div
          role="tablist"
          aria-label="Filter hospitals by area"
          className="mt-6 flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1 w-fit max-w-full"
        >
          <button
            type="button"
            role="tab"
            aria-selected={safeArea === 'all'}
            onClick={() => onAreaChange('all')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              safeArea === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Centres ({centres.length})
          </button>
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              role="tab"
              aria-selected={safeArea === area}
              onClick={() => onAreaChange(area)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                safeArea === area
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        {/* Directory Cards Grid */}
        {filteredCentres.length === 0 ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No diagnostic centres found in this area.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredCentres.map((centre) => {
              const rating = getRatingStats(centre.id);
              const sampleTests = centre.tests.slice(0, 3);

              return (
                <article
                  key={centre.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div>
                    <p className="text-xs text-slate-500">
                      {centre.area} · {centre.tests.length} Tests Listed
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">
                      {centre.name}
                    </h3>

                    <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div>
                        <dt className="inline font-semibold text-slate-700">Address: </dt>
                        <dd className="inline">{centre.address}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-slate-700">Phone: </dt>
                        <dd className="inline font-mono">{centre.phone}</dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-slate-700">Hours: </dt>
                        <dd className="inline">{centre.hours}</dd>
                      </div>
                      <div className="flex items-center gap-1">
                        <dt className="font-semibold text-slate-700">Rating:</dt>
                        <dd className="inline-flex items-center gap-1 tabular-nums">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          {rating.label}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                      {sampleTests.map((t) => (
                        <div
                          key={t.testId}
                          className="flex items-center justify-between gap-3 text-xs"
                        >
                          <span className="text-slate-700 truncate">{t.name}</span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap shrink-0">
                            {formatBDT(t.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => onViewDetails(centre.id)}
                      className="w-full rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800 cursor-pointer transition-colors"
                    >
                      View All {centre.tests.length} Tests &amp; Book
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
