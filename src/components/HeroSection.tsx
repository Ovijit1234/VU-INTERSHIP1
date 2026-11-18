import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Building2, Microscope, Scan, Search } from 'lucide-react';
import { FlattenedTestListing } from '../types/medicompare';
import { formatBDT, POPULAR_TEST_SHORTCUTS } from '../data/seedData';

interface TestOption {
  name: string;
  category: string;
}

interface HeroSectionProps {
  areas: string[];
  uniqueTests: TestOption[];
  allListings: FlattenedTestListing[];
  centresCount: number;
  totalTestsCount: number;
  reviewsCount: number;
  onSearchSubmit: (keyword: string, area: string) => void;
  onQuickTestClick: (testName: string) => void;
  onCategoryShortcut: (category: string) => void;
}

const SNAPSHOT_TESTS = [
  'ECG',
  'Blood Screening+Grouping',
  'CLO Test (DFARUQUE)',
  'MRI of Brain (Plain)',
];

const HERO_IMG_SRC = '/src/assets/images/hero_diagnostic_lab_1794995618541.jpg';
const PATHOLOGY_IMG_SRC = '/src/assets/images/card_pathology_lab_1794995620086.jpg';
const RADIOLOGY_IMG_SRC = '/src/assets/images/card_radiology_imaging_1794995620041.jpg';

export const HeroSection: React.FC<HeroSectionProps> = ({
  areas,
  uniqueTests,
  allListings,
  centresCount,
  totalTestsCount,
  reviewsCount,
  onSearchSubmit,
  onQuickTestClick,
  onCategoryShortcut,
}) => {
  const [query, setQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);
  const [pathImgError, setPathImgError] = useState(false);
  const [radImgError, setRadImgError] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const trimmed = query.trim().toLowerCase();
  const autocompleteMatches = trimmed
    ? uniqueTests
        .filter(
          (t) =>
            t.name.toLowerCase().includes(trimmed) ||
            t.category.toLowerCase().includes(trimmed)
        )
        .slice(0, 8)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAutocomplete(false);
    onSearchSubmit(query.trim(), selectedArea);
  };

  return (
    <section id="top" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Top 2-Column Hero Split */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Left Column: Headline, Search, Quick Shortcuts */}
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <p className="text-xs font-medium text-teal-800">
                Open Public Price Guide · No Login Required · Bangladesh (৳ BDT)
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12] [text-wrap:balance]">
                Compare Medical Test Prices Across Leading Hospitals
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                Instantly browse transparent laboratory rates in Bangladeshi Taka (৳), compare
                up to three diagnostic centres side-by-side, and request sample collection slots
                with zero sign-up required.
              </p>

              {/* Search Bar with Autocomplete */}
              <form
                onSubmit={handleSubmit}
                className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-stretch"
              >
                <div ref={wrapperRef} className="relative flex-1">
                  <label htmlFor="heroTestInput" className="sr-only">
                    Search medical test name
                  </label>
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="heroTestInput"
                      type="text"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setShowAutocomplete(true);
                      }}
                      onFocus={() => {
                        if (query.trim()) setShowAutocomplete(true);
                      }}
                      placeholder="Search test (e.g. ECG, CBC, MRI, Dengue NS1)..."
                      autoComplete="off"
                      className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                    />
                  </div>

                  {showAutocomplete && autocompleteMatches.length > 0 && (
                    <ul
                      role="listbox"
                      aria-label="Test suggestions"
                      className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      {autocompleteMatches.map((item) => (
                        <li key={item.name}>
                          <button
                            type="button"
                            onClick={() => {
                              setQuery(item.name);
                              setShowAutocomplete(false);
                              onSearchSubmit(item.name, selectedArea);
                            }}
                            className="flex w-full items-center justify-between gap-4 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 cursor-pointer"
                          >
                            <span className="font-medium text-slate-900">{item.name}</span>
                            <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                              {item.category}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="sm:w-48">
                  <label htmlFor="heroAreaSelect" className="sr-only">
                    Filter by area
                  </label>
                  <select
                    id="heroAreaSelect"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                  >
                    <option value="all">All Areas (Bangladesh)</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="h-11 rounded-lg bg-teal-700 px-6 text-sm font-medium text-white hover:bg-teal-800 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  Compare Prices
                </button>
              </form>

              {/* Popular Test Shortcuts */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500 mr-1">Popular tests:</span>
                {POPULAR_TEST_SHORTCUTS.map((testName) => (
                  <button
                    key={testName}
                    type="button"
                    onClick={() => onQuickTestClick(testName)}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-teal-600 hover:bg-teal-50 hover:text-teal-900 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                  >
                    {testName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Clinical Photograph + Live Price Snapshot Scrim */}
          <div className="relative flex min-h-[340px] flex-col justify-end overflow-hidden rounded-xl border border-slate-200 bg-slate-900 lg:col-span-5 lg:h-full">
            {!heroImgError ? (
              <img
                src={HERO_IMG_SRC}
                alt="Modern clinical diagnostic laboratory reception in Dhaka"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-teal-900 via-slate-900 to-slate-800 p-6 text-slate-300">
                <Building2 className="h-10 w-10 text-teal-400" />
                <span className="mt-2 text-xs font-medium">MediCompare Diagnostic Network</span>
              </div>
            )}

            {/* Measured dark scrim for >=4.5:1 text legibility */}
            <div className="relative z-10 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent p-5 pt-16 text-white">
              <div className="flex items-baseline justify-between gap-2 border-b border-white/20 pb-2">
                <h2 className="text-sm font-semibold text-white">
                  Live Reference Price Range
                </h2>
                <span className="text-[11px] text-slate-300 font-mono">৳ BDT</span>
              </div>
              <div className="mt-2 divide-y divide-white/10">
                {SNAPSHOT_TESTS.map((testName) => {
                  const matches = allListings.filter((item) => item.testName === testName);
                  if (matches.length === 0) return null;
                  const prices = matches.map((m) => m.price);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  return (
                    <button
                      key={testName}
                      type="button"
                      onClick={() => onQuickTestClick(testName)}
                      className="flex w-full items-center justify-between gap-3 py-2 text-left hover:bg-white/10 px-1.5 rounded transition-colors cursor-pointer"
                    >
                      <span className="text-xs font-medium text-slate-100 truncate">
                        {testName}
                      </span>
                      <span className="font-mono text-xs font-semibold text-teal-300 tabular-nums whitespace-nowrap shrink-0">
                        {formatBDT(min)} – {formatBDT(max)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Summary Strip below Hero Split */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-y border-slate-200 py-5 sm:grid-cols-4">
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {centresCount}
            </div>
            <div className="text-xs text-slate-600">Diagnostic Centres</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {totalTestsCount}
            </div>
            <div className="text-xs text-slate-600">Reference Medical Tests</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {reviewsCount}
            </div>
            <div className="text-xs text-slate-600">Verified Patient Reviews</div>
          </div>
          <div>
            <div className="font-mono text-2xl font-bold text-teal-800">Open Access</div>
            <div className="text-xs text-slate-600">View-Only Without Login</div>
          </div>
        </div>

        {/* 2-Card Diagnostic Department Visual Spotlight */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100 sm:w-52">
              {!pathImgError ? (
                <img
                  src={PATHOLOGY_IMG_SRC}
                  alt="Automated clinical pathology and blood chemistry laboratory"
                  referrerPolicy="no-referrer"
                  onError={() => setPathImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                  <Microscope className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between p-5">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Pathology · Biochemistry · Serology
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Routine Blood &amp; Pathology Panels
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Compare CBC, HbA1c, Fasting Glucose, Thyroid Profile, and Dengue NS1 charges
                  across Dhaka &amp; regional hubs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCategoryShortcut('General Diagnostics')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer w-fit"
              >
                Browse Pathology Tests
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>

          <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:flex-row">
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100 sm:w-52">
              {!radImgError ? (
                <img
                  src={RADIOLOGY_IMG_SRC}
                  alt="Modern hospital MRI and radiology imaging suite"
                  referrerPolicy="no-referrer"
                  onError={() => setRadImgError(true)}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500">
                  <Scan className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between p-5">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  MRI · CT Scan · Digital X-Ray · Ultrasound
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Radiology &amp; Diagnostic Imaging
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Compare Brain MRI, Lumbar Spine MRI, CT Scan, Mammography, and Abdominal
                  Ultrasound fees before booking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onCategoryShortcut('Radiology & Imaging')}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-800 hover:text-teal-900 hover:underline cursor-pointer w-fit"
              >
                Browse Imaging Tests
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
};
