import React, { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Building2,
  ClipboardList,
  Database,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Lock,
  LogOut,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Save,
  Shield,
  Tags,
  Upload,
  X,
} from 'lucide-react';
import {
  AdminTab,
  BookingStatus,
  DiagnosticCentre,
  FeedbackMessage,
  PatientReview,
  SampleBooking,
  SessionState,
} from '../types/medicompare';
import {
  formatBDT,
  parseCsvText,
  TEST_CATEGORIES,
} from '../data/seedData';

interface AdminModalProps {
  isOpen: boolean;
  session: SessionState;
  canUseAdmin: boolean;
  centres: DiagnosticCentre[];
  reviews: PatientReview[];
  bookings: SampleBooking[];
  categories: string[];
  onAdminSignIn: (email: string, pass: string) => Promise<FeedbackMessage>;
  onEnableTempAdmin: () => void;
  onExitTempAdmin: () => void;
  onAdminLogout: () => void;
  onSaveCentre: (payload: {
    id?: string;
    name: string;
    area: string;
    phone: string;
    address: string;
    hours: string;
    homeCollection: boolean;
    notes: string;
  }) => FeedbackMessage;
  onDeleteCentre: (centreId: string) => FeedbackMessage;
  onResetDemoData: () => FeedbackMessage;
  onAddOrUpdateTest: (payload: {
    centreId: string;
    testName: string;
    category: string;
    price: number;
    prep: string;
    applyAll: boolean;
  }) => FeedbackMessage;
  onSaveSinglePrice: (centreId: string, testId: string, price: number) => FeedbackMessage;
  onSaveBulkPrices: (updates: Record<string, number>) => FeedbackMessage;
  onDeleteTest: (centreId: string, testId: string) => FeedbackMessage;
  onApplyImportRows: (
    rows: Record<string, unknown>[]
  ) => { updated: number; added: number; error?: string };
  onReplaceAllCentres: (centres: DiagnosticCentre[]) => FeedbackMessage;
  onDeleteReview: (reviewId: string) => void;
  onUpdateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  onDeleteBooking: (bookingId: string) => void;
  supabaseTablesReady: boolean;
  onSyncToSupabase: () => Promise<FeedbackMessage>;
  onClose: () => void;
}

const ADMIN_TESTS_PAGE_SIZE = 15;

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  session,
  canUseAdmin,
  centres,
  reviews,
  bookings,
  categories,
  onAdminSignIn,
  onEnableTempAdmin,
  onExitTempAdmin,
  onAdminLogout,
  onSaveCentre,
  onDeleteCentre,
  onResetDemoData,
  onAddOrUpdateTest,
  onSaveSinglePrice,
  onSaveBulkPrices,
  onDeleteTest,
  onApplyImportRows,
  onReplaceAllCentres,
  onDeleteReview,
  onUpdateBookingStatus,
  onDeleteBooking,
  supabaseTablesReady,
  onSyncToSupabase,
  onClose,
}) => {
  const isAdmin = session.role === 'admin';
  const isSignedIn = session.role !== 'guest';

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('centres');

  // Manage Centres State
  const [editCentreId, setEditCentreId] = useState<string>('');
  const [cName, setCName] = useState('');
  const [cArea, setCArea] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cHours, setCHours] = useState('7:30 AM – 10:00 PM');
  const [cHomeCollection, setCHomeCollection] = useState(true);
  const [cNotes, setCNotes] = useState('');
  const [centreFeedback, setCentreFeedback] = useState<FeedbackMessage>({ text: '', type: '' });
  const [confirmDeleteCentreId, setConfirmDeleteCentreId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Manage Tests State
  const [testCentreId, setTestCentreId] = useState(centres[0]?.id || '');
  const [newTestName, setNewTestName] = useState('');
  const [newTestCat, setNewTestCat] = useState<string>(TEST_CATEGORIES[0]);
  const [newTestPrice, setNewTestPrice] = useState('');
  const [newTestPrep, setNewTestPrep] = useState('');
  const [applyAllCentres, setApplyAllCentres] = useState(false);
  const [testFormFeedback, setTestFormFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  // Bulk Price Editor State
  const [filterCentreId, setFilterCentreId] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [testSearch, setTestSearch] = useState('');
  const [testsPage, setTestsPage] = useState(1);
  const [modifiedPrices, setModifiedPrices] = useState<Record<string, number>>({});
  const [bulkFeedback, setBulkFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  // Import/Export State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pastedCsv, setPastedCsv] = useState('');
  const [importFeedback, setImportFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  // Bookings Filter State
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | BookingStatus>('all');
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<FeedbackMessage>({ text: '', type: '' });

  const totalTestsCount = useMemo(
    () => centres.reduce((acc, c) => acc + c.tests.length, 0),
    [centres]
  );

  const pendingBookingsCount = useMemo(
    () => bookings.filter((b) => b.status === 'Pending').length,
    [bookings]
  );

  const filteredTestRows = useMemo(() => {
    const q = testSearch.trim().toLowerCase();
    const rows: {
      centreId: string;
      centreName: string;
      area: string;
      testId: string;
      name: string;
      category: string;
      price: number;
    }[] = [];

    centres.forEach((c) => {
      if (filterCentreId !== 'all' && c.id !== filterCentreId) return;
      c.tests.forEach((t) => {
        if (filterCat !== 'all' && t.category !== filterCat) return;
        if (q && !`${t.name} ${t.testId} ${c.name}`.toLowerCase().includes(q)) return;
        rows.push({
          centreId: c.id,
          centreName: c.name,
          area: c.area,
          testId: t.testId,
          name: t.name,
          category: t.category,
          price: t.price,
        });
      });
    });

    return rows;
  }, [centres, filterCentreId, filterCat, testSearch]);

  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (b) => bookingStatusFilter === 'all' || b.status === bookingStatusFilter
      ),
    [bookings, bookingStatusFilter]
  );

  if (!isOpen) return null;

  const totalTestPages = Math.max(1, Math.ceil(filteredTestRows.length / ADMIN_TESTS_PAGE_SIZE));
  const safeTestsPage = Math.min(testsPage, totalTestPages);
  const pagedTestRows = filteredTestRows.slice(
    (safeTestsPage - 1) * ADMIN_TESTS_PAGE_SIZE,
    safeTestsPage * ADMIN_TESTS_PAGE_SIZE
  );
  const modifiedCount = Object.keys(modifiedPrices).length;

  const resetCentreForm = () => {
    setEditCentreId('');
    setCName('');
    setCArea('');
    setCPhone('');
    setCAddress('');
    setCHours('7:30 AM – 10:00 PM');
    setCHomeCollection(true);
    setCNotes('');
  };

  const handleCentreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onSaveCentre({
      id: editCentreId || undefined,
      name: cName,
      area: cArea,
      phone: cPhone,
      address: cAddress,
      hours: cHours,
      homeCollection: cHomeCollection,
      notes: cNotes,
    });
    setCentreFeedback(res);
    if (res.type === 'success') resetCentreForm();
  };

  const handleAddTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = onAddOrUpdateTest({
      centreId: testCentreId || centres[0]?.id || '',
      testName: newTestName,
      category: newTestCat,
      price: Number(newTestPrice),
      prep: newTestPrep,
      applyAll: applyAllCentres,
    });
    setTestFormFeedback(res);
    if (res.type === 'success') {
      setNewTestName('');
      setNewTestPrice('');
      setNewTestPrep('');
    }
  };

  const buildExportRows = () => {
    const rows: Record<string, string | number>[] = [];
    centres.forEach((c) => {
      c.tests.forEach((t) => {
        rows.push({
          test_id: t.testId,
          diagnostic_centre: c.name,
          branch_name: c.area,
          test_name: t.name,
          normalized_category: t.category,
          price_bdt: Number(t.price),
          prep_note: t.prep || '',
        });
      });
    });
    return rows;
  };

  const handleExportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(buildExportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MediCompare_Tests');
    XLSX.writeFile(wb, 'medicompare_bd_dataset.xlsx');
    setImportFeedback({ text: 'Downloaded Excel (.xlsx) spreadsheet.', type: 'success' });
  };

  const handleExportCsv = () => {
    const rows = buildExportRows();
    const headers = Object.keys(rows[0] || {});
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicompare_bd_dataset.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setImportFeedback({ text: 'Downloaded CSV spreadsheet.', type: 'success' });
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(centres, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medicompare_bd_backup.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setImportFeedback({ text: 'Downloaded JSON backup.', type: 'success' });
  };

  const handleRunImport = async () => {
    if (selectedFiles.length === 0 && !pastedCsv.trim()) {
      setImportFeedback({
        text: 'Select one or more .xlsx, .csv, or .json files or paste CSV rows first.',
        type: 'error',
      });
      return;
    }

    let totalUpdated = 0;
    let totalAdded = 0;

    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') {
        try {
          const parsed = JSON.parse(await file.text()) as DiagnosticCentre[];
          if (Array.isArray(parsed) && parsed[0]?.tests) {
            const res = onReplaceAllCentres(parsed);
            setImportFeedback(res);
            setSelectedFiles([]);
            return;
          }
          setImportFeedback({ text: `Invalid JSON structure in ${file.name}.`, type: 'error' });
          return;
        } catch {
          setImportFeedback({ text: `Invalid JSON file: ${file.name}`, type: 'error' });
          return;
        }
      } else if (ext === 'csv') {
        const rows = parseCsvText(await file.text());
        const res = onApplyImportRows(rows);
        if (res.error) {
          setImportFeedback({ text: res.error, type: 'error' });
          return;
        }
        totalUpdated += res.updated;
        totalAdded += res.added;
      } else if (ext === 'xlsx' || ext === 'xls') {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
        const res = onApplyImportRows(rows);
        if (res.error) {
          setImportFeedback({ text: res.error, type: 'error' });
          return;
        }
        totalUpdated += res.updated;
        totalAdded += res.added;
      }
    }

    if (pastedCsv.trim()) {
      const rows = parseCsvText(pastedCsv);
      const res = onApplyImportRows(rows);
      if (res.error) {
        setImportFeedback({ text: res.error, type: 'error' });
        return;
      }
      totalUpdated += res.updated;
      totalAdded += res.added;
    }

    setSelectedFiles([]);
    setPastedCsv('');
    setImportFeedback({
      text: `Import complete: ${totalUpdated} fee(s) updated, ${totalAdded} new test(s) added.`,
      type: 'success',
    });
  };

  const tabItems: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: 'centres', label: `Hospitals (${centres.length})`, icon: <Building2 className="h-3.5 w-3.5" /> },
    { key: 'tests', label: 'Test Pricing', icon: <Tags className="h-3.5 w-3.5" /> },
    { key: 'importExport', label: 'Import & Export', icon: <FileSpreadsheet className="h-3.5 w-3.5" /> },
    { key: 'reviews', label: `Reviews (${reviews.length})`, icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { key: 'bookings', label: `Requests (${bookings.length})`, icon: <ClipboardList className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adminModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h2 id="adminModalTitle" className="text-lg font-bold text-slate-900">
                {isAdmin ? 'Admin Management Panel' : 'Admin Panel Sign In'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? `Active as ${session.name} · Manage diagnostic centres, test fees, imports, and requests`
                  : 'Sign in with your administrator account to manage diagnostic centres and test fees'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setModifiedPrices({});
                    onExitTempAdmin();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  Exit Temp Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModifiedPrices({});
                    onAdminLogout();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close admin panel"
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {!isAdmin ? (
            canUseAdmin ? (
              <div className="mx-auto max-w-md py-6 text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-800">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-900">
                    Temporary Admin Mode Paused
                  </p>
                  <p className="text-xs text-slate-600">
                    You are currently browsing in standard user mode as {session.name}. Re-enter Admin Mode anytime without logging out.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onEnableTempAdmin}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 cursor-pointer"
                >
                  Enter Admin Panel
                </button>
              </div>
            ) : isSignedIn ? (
              <div className="mx-auto max-w-md py-6 text-center space-y-4">
                <p className="text-sm font-semibold text-slate-900">
                  Your current account ({session.name}) does not have Admin privileges.
                </p>
                <p className="text-xs text-slate-600">
                  To access the Admin Management Panel, logout and sign in with the authorized administrator account.
                </p>
                <button
                  type="button"
                  onClick={onAdminLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout &amp; Switch Account
                </button>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSigningIn(true);
                  setLoginFeedback({ text: '', type: '' });
                  try {
                    const res = await onAdminSignIn(adminEmail, adminPass);
                    setLoginFeedback(res);
                    if (res.type === 'success') {
                      setAdminEmail('');
                      setAdminPass('');
                      setShowAdminPass(false);
                    }
                  } finally {
                    setSigningIn(false);
                  }
                }}
                className="mx-auto max-w-md space-y-4 py-2"
              >
                <div>
                  <label
                    htmlFor="adminLoginEmail"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Administrator Email
                  </label>
                  <input
                    id="adminLoginEmail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Enter administrator email"
                    autoComplete="email"
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminLoginPass"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="adminLoginPass"
                      type={showAdminPass ? 'text' : 'password'}
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-3 pr-10 text-sm text-slate-900 focus:border-teal-700 focus:outline-2 focus:outline-teal-700/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass((prev) => !prev)}
                      aria-label={showAdminPass ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showAdminPass ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {loginFeedback.text && (
                  <p
                    aria-live="polite"
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      loginFeedback.type === 'error'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {loginFeedback.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={signingIn}
                  className="h-10 w-full rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60 cursor-pointer transition-colors"
                >
                  {signingIn ? 'Signing In...' : 'Sign In to Admin Panel'}
                </button>
              </form>
            )
          ) : (
            <div className="space-y-6">
              {/* Quick Summary Strip */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                    {centres.length}
                  </div>
                  <div className="text-xs text-slate-600">Hospitals</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                    {totalTestsCount}
                  </div>
                  <div className="text-xs text-slate-600">Listed Tests</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="font-mono text-xl font-bold text-slate-900 tabular-nums">
                    {reviews.length}
                  </div>
                  <div className="text-xs text-slate-600">Patient Reviews</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <div className="font-mono text-xl font-bold text-amber-700 tabular-nums">
                    {pendingBookingsCount}
                  </div>
                  <div className="text-xs text-slate-600">Pending Requests</div>
                </div>
              </div>

              {/* Admin Tab Navigation */}
              <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1">
                {tabItems.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: MANAGE HOSPITALS */}
              {activeTab === 'centres' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <form
                    onSubmit={handleCentreSubmit}
                    className="space-y-3.5 rounded-xl border border-slate-200 p-5 lg:col-span-5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <h3 className="text-sm font-bold text-slate-900">
                        {editCentreId ? `Editing: ${cName}` : 'Add New Hospital / Centre'}
                      </h3>
                      {editCentreId && (
                        <button
                          type="button"
                          onClick={resetCentreForm}
                          className="text-xs font-medium text-slate-600 hover:underline cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Hospital / Centre Name
                      </label>
                      <input
                        type="text"
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        placeholder="e.g. Dhaka Diagnostic Hub"
                        required
                        className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Area / Branch
                        </label>
                        <input
                          type="text"
                          value={cArea}
                          onChange={(e) => setCArea(e.target.value)}
                          placeholder="e.g. Dhanmondi"
                          required
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={cPhone}
                          onChange={(e) => setCPhone(e.target.value)}
                          placeholder="+880 17..."
                          required
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={cAddress}
                        onChange={(e) => setCAddress(e.target.value)}
                        placeholder="House, Road, City"
                        required
                        className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Opening Hours
                        </label>
                        <input
                          type="text"
                          value={cHours}
                          onChange={(e) => setCHours(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Home Collection
                        </label>
                        <select
                          value={String(cHomeCollection)}
                          onChange={(e) => setCHomeCollection(e.target.value === 'true')}
                          className="h-9 w-full rounded-lg border border-slate-300 px-2.5 text-sm"
                        >
                          <option value="true">Available</option>
                          <option value="false">Walk-in Only</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Service Notes
                      </label>
                      <textarea
                        rows={2}
                        value={cNotes}
                        onChange={(e) => setCNotes(e.target.value)}
                        placeholder="Optional facility details or report delivery times"
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                      />
                    </div>

                    {centreFeedback.text && (
                      <p
                        className={`text-xs font-medium ${
                          centreFeedback.type === 'error'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {centreFeedback.text}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="submit"
                        className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                      >
                        {editCentreId ? 'Save Changes' : 'Add Hospital'}
                      </button>

                      {!confirmReset ? (
                        <button
                          type="button"
                          onClick={() => setConfirmReset(true)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore Default Directory
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setModifiedPrices({});
                              const res = onResetDemoData();
                              setCentreFeedback(res);
                              resetCentreForm();
                              setConfirmReset(false);
                            }}
                            className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 cursor-pointer"
                          >
                            Confirm Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmReset(false)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </form>

                  <div className="space-y-2.5 lg:col-span-7">
                    <h3 className="text-sm font-bold text-slate-900">
                      Hospital Directory ({centres.length})
                    </h3>
                    {centres.map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3.5 hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {c.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.area} · {c.tests.length} tests ·{' '}
                            <span className="font-mono">{c.phone}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setFilterCentreId(c.id);
                              setTestsPage(1);
                              setActiveTab('tests');
                            }}
                            className="rounded-md border border-teal-200 bg-teal-50/70 px-2.5 py-1.5 text-xs font-medium text-teal-900 hover:bg-teal-100 cursor-pointer"
                          >
                            Manage Prices
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditCentreId(c.id);
                              setCName(c.name);
                              setCArea(c.area);
                              setCPhone(c.phone);
                              setCAddress(c.address);
                              setCHours(c.hours);
                              setCHomeCollection(c.homeCollection);
                              setCNotes(c.notes);
                              setCentreFeedback({ text: '', type: '' });
                            }}
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Edit
                          </button>

                          {confirmDeleteCentreId === c.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setCentreFeedback(onDeleteCentre(c.id));
                                  setConfirmDeleteCentreId(null);
                                }}
                                className="rounded-md bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCentreId(null)}
                                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-600 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCentreId(c.id)}
                              className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE TESTS & BULK PRICING */}
              {activeTab === 'tests' && (
                <div className="space-y-6">
                  {/* Add / Update Test Form */}
                  <form
                    onSubmit={handleAddTestSubmit}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
                  >
                    <h3 className="text-sm font-bold text-slate-900">
                      Add or Update a Medical Test
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Hospital
                        </label>
                        <select
                          value={testCentreId}
                          onChange={(e) => setTestCentreId(e.target.value)}
                          disabled={applyAllCentres}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm disabled:opacity-50"
                        >
                          {centres.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Test Name
                        </label>
                        <input
                          type="text"
                          value={newTestName}
                          onChange={(e) => setNewTestName(e.target.value)}
                          placeholder="e.g. ECG, CBC"
                          required
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Category
                        </label>
                        <select
                          value={newTestCat}
                          onChange={(e) => setNewTestCat(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                        >
                          {TEST_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Fee (৳ BDT)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={newTestPrice}
                          onChange={(e) => setNewTestPrice(e.target.value)}
                          placeholder="e.g. 500"
                          required
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">
                          Preparation Note
                        </label>
                        <input
                          type="text"
                          value={newTestPrep}
                          onChange={(e) => setNewTestPrep(e.target.value)}
                          placeholder="Optional prep instructions"
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={applyAllCentres}
                          onChange={(e) => setApplyAllCentres(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 accent-teal-700"
                        />
                        Apply this test &amp; fee to all {centres.length} hospitals
                      </label>

                      <button
                        type="submit"
                        className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                      >
                        Add / Update Test
                      </button>
                    </div>

                    {testFormFeedback.text && (
                      <p
                        className={`text-xs font-medium ${
                          testFormFeedback.type === 'error'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {testFormFeedback.text}
                      </p>
                    )}
                  </form>

                  {/* Bulk Price Editor Controls */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Quick Fee Editor (৳ BDT)
                        </h3>
                        <p className="text-xs text-slate-500 tabular-nums">
                          Showing {pagedTestRows.length} of {filteredTestRows.length} test rows
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {modifiedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setModifiedPrices({})}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Discard ({modifiedCount})
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={modifiedCount === 0}
                          onClick={() => {
                            const res = onSaveBulkPrices(modifiedPrices);
                            setBulkFeedback(res);
                            if (res.type === 'success') setModifiedPrices({});
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <Save className="h-3.5 w-3.5" />
                          Save All Changes ({modifiedCount})
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <select
                        value={filterCentreId}
                        onChange={(e) => {
                          setFilterCentreId(e.target.value);
                          setTestsPage(1);
                        }}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                      >
                        <option value="all">All Hospitals</option>
                        {centres.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.area})
                          </option>
                        ))}
                      </select>

                      <select
                        value={filterCat}
                        onChange={(e) => {
                          setFilterCat(e.target.value);
                          setTestsPage(1);
                        }}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={testSearch}
                        onChange={(e) => {
                          setTestSearch(e.target.value);
                          setTestsPage(1);
                        }}
                        placeholder="Search test name or ID..."
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
                      />
                    </div>

                    {bulkFeedback.text && (
                      <p
                        className={`text-xs font-medium ${
                          bulkFeedback.type === 'error'
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {bulkFeedback.text}
                      </p>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <tr>
                            <th className="px-3.5 py-2.5">Hospital</th>
                            <th className="px-3.5 py-2.5">Test</th>
                            <th className="px-3.5 py-2.5">Price (৳)</th>
                            <th className="px-3.5 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {pagedTestRows.map((row) => {
                            const key = `${row.centreId}::${row.testId}`;
                            const isMod = Object.prototype.hasOwnProperty.call(
                              modifiedPrices,
                              key
                            );
                            const currentVal = isMod ? modifiedPrices[key] : row.price;

                            return (
                              <tr key={key} className="hover:bg-slate-50/70">
                                <td className="px-3.5 py-2.5">
                                  <div className="font-medium text-slate-900">
                                    {row.centreName}
                                  </div>
                                  <div className="text-xs text-slate-500">{row.area}</div>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="font-medium text-slate-900">{row.name}</div>
                                  <div className="text-xs text-slate-500">
                                    <span className="font-mono">{row.testId}</span> ·{' '}
                                    {row.category}
                                  </div>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={currentVal}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setModifiedPrices((prev) => {
                                        const next = { ...prev };
                                        if (Number.isFinite(val) && val !== row.price) {
                                          next[key] = val;
                                        } else {
                                          delete next[key];
                                        }
                                        return next;
                                      });
                                    }}
                                    className={`h-8 w-28 rounded-md border px-2 font-mono text-sm tabular-nums ${
                                      isMod
                                        ? 'border-amber-500 bg-amber-50 font-semibold text-amber-950'
                                        : 'border-slate-300 bg-white text-slate-900'
                                    }`}
                                  />
                                </td>
                                <td className="px-3.5 py-2.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = onSaveSinglePrice(
                                          row.centreId,
                                          row.testId,
                                          currentVal
                                        );
                                        setBulkFeedback(res);
                                        setModifiedPrices((prev) => {
                                          const next = { ...prev };
                                          delete next[key];
                                          return next;
                                        });
                                      }}
                                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBulkFeedback(
                                          onDeleteTest(row.centreId, row.testId)
                                        );
                                      }}
                                      className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {totalTestPages > 1 && (
                      <div className="flex items-center justify-center gap-4 pt-2">
                        <button
                          type="button"
                          disabled={safeTestsPage <= 1}
                          onClick={() => setTestsPage((p) => Math.max(1, p - 1))}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40 cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="text-xs font-medium text-slate-600 tabular-nums">
                          Page {safeTestsPage} of {totalTestPages}
                        </span>
                        <button
                          type="button"
                          disabled={safeTestsPage >= totalTestPages}
                          onClick={() => setTestsPage((p) => Math.min(totalTestPages, p + 1))}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EXCEL / CSV / JSON IMPORT & EXPORT */}
              {activeTab === 'importExport' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-teal-800" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Step 1: Export Current Fee Sheet
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600">
                        Download all {totalTestsCount} test fees in ৳ BDT. You can update prices
                        in Excel or Google Sheets (keeping the{' '}
                        <code className="font-mono text-slate-800">test_id</code> column intact)
                        and upload the file on the right.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportXlsx}
                          className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                        >
                          Download Excel (.xlsx)
                        </button>
                        <button
                          type="button"
                          onClick={handleExportCsv}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          Download CSV
                        </button>
                        <button
                          type="button"
                          onClick={handleExportJson}
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          Download JSON Backup
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4 text-teal-800" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Step 2: Import Updated Prices
                        </h3>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                          Select Files (.xlsx, .csv, or .json)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".xlsx,.xls,.csv,.json"
                          onChange={(e) =>
                            setSelectedFiles(Array.from(e.target.files || []))
                          }
                          className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-100"
                        />
                        {selectedFiles.length > 0 && (
                          <p className="mt-1.5 text-xs text-teal-800 font-medium">
                            Ready to import: {selectedFiles.map((f) => f.name).join(', ')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Or Paste CSV Rows Directly
                        </label>
                        <textarea
                          rows={4}
                          value={pastedCsv}
                          onChange={(e) => setPastedCsv(e.target.value)}
                          placeholder="test_id,diagnostic_centre,test_name,price_bdt&#10;POP-001,Popular Diagnostic Centre,ECG,380"
                          className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-xs"
                        />
                      </div>

                      {importFeedback.text && (
                        <p
                          className={`text-xs font-medium ${
                            importFeedback.type === 'error'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {importFeedback.text}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={handleRunImport}
                        className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 cursor-pointer"
                      >
                        Import Data
                      </button>
                    </div>
                  </div>

                  {/* Cloud Database Sync */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-teal-800" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Supabase Cloud Database Sync
                        </h3>
                        <span
                          className={`text-xs font-semibold ${
                            supabaseTablesReady ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          · {supabaseTablesReady ? 'Connected & Active' : 'Schema Tables Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {supabaseTablesReady
                          ? 'Changes automatically sync to your Supabase project. You can also push the full directory manually.'
                          : 'Run the provided supabase/schema.sql script in your Supabase SQL Editor, then click Sync Now.'}
                      </p>
                      {syncFeedback.text && (
                        <p
                          className={`text-xs font-medium ${
                            syncFeedback.type === 'error'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {syncFeedback.text}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={syncingSupabase}
                      onClick={async () => {
                        setSyncingSupabase(true);
                        const res = await onSyncToSupabase();
                        setSyncFeedback(res);
                        setSyncingSupabase(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${syncingSupabase ? 'animate-spin' : ''}`} />
                      {syncingSupabase ? 'Syncing...' : 'Sync Directory to Supabase'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: MODERATE REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-600">
                      No patient reviews submitted yet.
                    </p>
                  ) : (
                    reviews.map((r) => {
                      const centre = centres.find((c) => c.id === r.centreId);
                      return (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 p-4"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {r.author} · ★ {r.rating}/5
                            </div>
                            <div className="text-xs text-slate-500">
                              {centre ? centre.name : 'Centre'} ·{' '}
                              <span className="font-mono">{r.createdAt}</span>
                            </div>
                            <p className="mt-1.5 text-sm text-slate-700">{r.comment}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteReview(r.id)}
                            className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* TAB 5: SAMPLE BOOKINGS */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      Patient Sample Collection Requests ({filteredBookings.length})
                    </span>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      {(['all', 'Pending', 'Confirmed', 'Completed'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setBookingStatusFilter(status)}
                          className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-colors ${
                            bookingStatusFilter === status
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {status === 'all' ? 'All' : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <p className="rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-600">
                      No matching sample collection requests found.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredBookings.map((b) => {
                        const centre = centres.find((c) => c.id === b.centreId);
                        return (
                          <div
                            key={b.id}
                            className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900">
                                {b.patientName}{' '}
                                <span className="font-mono text-xs font-normal text-slate-600">
                                  ({b.patientPhone})
                                </span>
                              </div>
                              <div className="text-xs text-slate-600">
                                {centre ? centre.name : 'Hospital'} ·{' '}
                                <strong>{b.testName}</strong>
                              </div>
                              <div className="text-xs text-slate-500 tabular-nums">
                                {b.collectionType} · Preferred Date: {b.preferredDate}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                aria-label="Booking status"
                                value={b.status}
                                onChange={(e) =>
                                  onUpdateBookingStatus(
                                    b.id,
                                    e.target.value as BookingStatus
                                  )
                                }
                                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Completed">Completed</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => onDeleteBooking(b.id)}
                                className="rounded-md border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
