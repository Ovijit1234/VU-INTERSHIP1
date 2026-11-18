import React from 'react';
import { ArrowUpDown, RotateCcw, Star } from 'lucide-react';
import {
  DiagnosticCentre,
  FlattenedTestListing,
  SavedTestRef,
  SortOption,
} from '../types/medicompare';
import { formatBDT } from '../data/seedData';

interface CompareSectionProps {
  centres: DiagnosticCentre[];
  categories: string[];
  uniqueTests: { name: string; category: string }[];
  areas: string[];
  centreFilter: string;
  categoryFilter: string;
  testFilter: string;
  areaFilter: string;
  keywordFilter: string;
  sortBy: SortOption;
  onCentreFilterChange: (val: string) => void;
  onCategoryFilterChange: (val: string) => void;
  onTestFilterChange: (val: string) => void;
  onAreaFilterChange: (val: string) => void;
  onKeywordFilterChange: (val: string) => void;
  onSortChange: (val: SortOption) => void;
  onResetFilters: () => void;
  filteredListings: FlattenedTestListing[];
  allListings: FlattenedTestListing[];
  compareTray: SavedTestRef[];
  onToggleCompare: (centreId: string, testId: string) => void;
  onRemoveCompare: (centreId: string, testId: string) => void;
  onClearCompareTray: () => void;
  isTestSaved: (centreId: string, testId: string) => boolean;
  onToggleSave: (centreId: string, testId: string) => void;
  onViewDetails: (centreId: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const CompareSection: React.FC<CompareSectionProps> = ({
  centres,
  categories,
  uniqueTests,
  areas,
  centreFilter,
  categoryFilter,
  testFilter,
  areaFilter,
  keywordFilter,
  sortBy,
  onCentreFilterChange,
  onCategoryFilterChange,
  onTestFilterChange,
  onAreaFilterChange,
  onKeywordFilterChange,
  onSortChange,
  onResetFilters,
  filteredListings,
  allListings,
  compareTray,
  onToggleCompare,
  onRemoveCompare,
  onClearCompareTray,
  isTestSaved,
  onToggleSave,
  onViewDetails,
  currentPage,
  pageSize,
  onPageChange,
}) => {
  const total = filteredListings.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageItems = filteredListings.slice(startIdx, startIdx + pageSize);

  const trayListings = compareTray
    .map((ref) =>
      allListings.find((l) => l.centreId === ref.centreId && l.testId === ref.testId)
    )
    .filter((item): item is FlattenedTestListing => Boolean(item));

  const lowestTrayPrice =
    trayListings.length > 1 ? Math.min(...trayListings.map((t) => t.price)) : null;

  return (
    <section id="compare-tests" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Section Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Compare Diagnostic Test Prices
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Filter across {centres.length} hospitals, sort by lowest fee in ৳, or select up to 3
            listings for side-by-side comparison.
          </p>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label htmlFor="compareCentreSelect" className="block text-xs font-medium text-slate-600 mb-1">
            Hospital
          </label>
          <select
            id="compareCentreSelect"
            value={centreFilter}
            onChange={(e) => onCentreFilterChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
          >
            <option value="all">All Hospitals ({centres.length})</option>
            {centres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.area})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compareCategorySelect" className="block text-xs font-medium text-slate-600 mb-1">
            Category
          </label>
          <select
            id="compareCategorySelect"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compareTestSelect" className="block text-xs font-medium text-slate-600 mb-1">
            Medical Test
          </label>
          <select
            id="compareTestSelect"
            value={testFilter}
            onChange={(e) => onTestFilterChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
          >
            <option value="all">All Tests ({uniqueTests.length})</option>
            {uniqueTests.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compareAreaSelect" className="block text-xs font-medium text-slate-600 mb-1">
            Area
          </label>
          <select
            id="compareAreaSelect"
            value={areaFilter}
            onChange={(e) => onAreaFilterChange(e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
          >
            <option value="all">All Areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="compareKeywordInput" className="block text-xs font-medium text-slate-600 mb-1">
            Keyword / Code
          </label>
          <input
            id="compareKeywordInput"
            type="text"
            value={keywordFilter}
            onChange={(e) => onKeywordFilterChange(e.target.value)}
            placeholder="Search name or code..."
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div>
          <label htmlFor="compareSortSelect" className="block text-xs font-medium text-slate-600 mb-1">
            Sort By
          </label>
          <div className="relative">
            <select
              id="compareSortSelect"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-800"
            >
              <option value="price-asc">Lowest Price (৳)</option>
              <option value="price-desc">Highest Price (৳)</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="name-asc">Hospital A–Z</option>
              <option value="test-asc">Test Name A–Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Tray */}
      {trayListings.length > 0 && (
        <div className="mt-6 rounded-xl border border-teal-700/30 bg-teal-50/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-teal-800" />
              <h3 className="text-base font-semibold text-slate-900">
                Side-by-Side Comparison ({trayListings.length} of 3 selected)
              </h3>
            </div>
            <button
              type="button"
              onClick={onClearCompareTray}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Clear Comparison
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-2.5">Hospital</th>
                  <th className="px-4 py-2.5">Area</th>
                  <th className="px-4 py-2.5">Medical Test</th>
                  <th className="px-4 py-2.5 text-right">Fee (৳)</th>
                  <th className="px-4 py-2.5">Rating</th>
                  <th className="px-4 py-2.5">Home Sample</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {trayListings.map((item) => {
                  const isLowest = lowestTrayPrice !== null && item.price === lowestTrayPrice;
                  return (
                    <tr key={`${item.centreId}::${item.testId}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.centreName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.area}</td>
                      <td className="px-4 py-3 text-slate-800">{item.testName}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatBDT(item.price)}
                        {isLowest && (
                          <span className="block text-[11px] font-sans font-medium text-teal-700">
                            Lowest Fee
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700 tabular-nums">
                        ★ {item.ratingLabel}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.homeCollection ? 'Available' : 'Walk-in Only'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {item.phone}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveCompare(item.centreId, item.testId)}
                          className="text-xs font-medium text-rose-700 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Count Row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span className="font-medium text-slate-800 tabular-nums">
          Showing {total} matching test listing{total === 1 ? '' : 's'}
        </span>
        {total > 0 && (
          <span className="tabular-nums">
            Displaying {startIdx + 1}–{startIdx + pageItems.length} of {total}
          </span>
        )}
      </div>

      {/* Results Grid */}
      {pageItems.length === 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-900">
            No matching diagnostic test listings found.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Try resetting your filters or searching with a broader test keyword.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((item) => {
            const inTray = compareTray.some(
              (x) => x.centreId === item.centreId && x.testId === item.testId
            );
            const saved = isTestSaved(item.centreId, item.testId);

            return (
              <article
                key={`${item.centreId}::${item.testId}`}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300"
              >
                <div>
                  <p className="text-xs text-slate-500 truncate">
                    {item.area} · {item.category} · <span className="font-mono">{item.testId}</span>
                  </p>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900">
                    {item.centreName}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-teal-800">{item.testName}</p>

                  <div className="mt-4 flex items-baseline justify-between gap-3 border-y border-slate-100 py-3">
                    <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                      {formatBDT(item.price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      {item.ratingLabel}
                    </span>
                  </div>

                  <dl className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div>
                      <dt className="inline font-semibold text-slate-700">Prep: </dt>
                      <dd className="inline">{item.prep}</dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Home Sample: </dt>
                      <dd className="inline">
                        {item.homeCollection ? 'Available' : 'Walk-in Only'}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-semibold text-slate-700">Phone: </dt>
                      <dd className="inline font-mono">{item.phone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onToggleCompare(item.centreId, item.testId)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      inTray
                        ? 'border-teal-700 bg-teal-50 text-teal-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {inTray ? 'Compared ✓' : '+ Compare'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSave(item.centreId, item.testId)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      saved
                        ? 'border-amber-600 bg-amber-50 text-amber-900'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {saved ? 'Saved ★' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewDetails(item.centreId)}
                    className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-teal-800 whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-slate-600 tabular-nums">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};
