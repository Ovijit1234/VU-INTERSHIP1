import { useEffect, useMemo, useState } from 'react';
import {
  BookingStatus,
  DiagnosticCentre,
  FeedbackMessage,
  FlattenedTestListing,
  PatientReview,
  SampleBooking,
  SavedTestRef,
  SessionState,
  SortOption,
  VisitorUser,
} from './types/medicompare';
import {
  buildDefaultCentres,
  DEFAULT_BOOKINGS,
  DEFAULT_REVIEWS,
  formatBDT,
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from './data/seedData';
import { supabase } from './lib/supabase';
import {
  deleteBookingInSupabase,
  deleteCentreInSupabase,
  deleteReviewInSupabase,
  deleteTestInSupabase,
  fetchAppDataFromSupabase,
  hydrateVisitorProfile,
  insertBookingInSupabase,
  insertReviewInSupabase,
  persistVisitorProfile,
  seedAllDataToSupabase,
  syncReplaceCentresInSupabase,
  updateBookingStatusInSupabase,
  upsertCentreInSupabase,
  upsertTestInSupabase,
} from './lib/supabaseService';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CompareSection } from './components/CompareSection';
import { CentresDirectory } from './components/CentresDirectory';
import { ReviewsSection } from './components/ReviewsSection';
import { CentreDetailModal } from './components/CentreDetailModal';
import { VisitorAccountModal } from './components/VisitorAccountModal';
import { AdminModal } from './components/AdminModal';
import { LegalModal } from './components/LegalModal';

const COMPARE_PAGE_SIZE = 12;
const VISITOR_SAVED_KEY = 'medicompare_visitor_saved_v2';

export default function App() {
  // Persistent State
  const [centres, setCentres] = useState<DiagnosticCentre[]>(() =>
    loadFromStorage(STORAGE_KEYS.centres, buildDefaultCentres)
  );
  const [reviews, setReviews] = useState<PatientReview[]>(() =>
    loadFromStorage(STORAGE_KEYS.reviews, () => [...DEFAULT_REVIEWS])
  );
  const [visitorUser, setVisitorUser] = useState<VisitorUser | null>(null);
  const [isTempAdmin, setIsTempAdmin] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() =>
    typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery'))
  );
  const [supabaseTablesReady, setSupabaseTablesReady] = useState(false);
  const [guestSavedTests, setGuestSavedTests] = useState<SavedTestRef[]>(() =>
    loadFromStorage(VISITOR_SAVED_KEY, () => [])
  );
  const [bookings, setBookings] = useState<SampleBooking[]>(() =>
    loadFromStorage(STORAGE_KEYS.bookings, () => JSON.parse(JSON.stringify(DEFAULT_BOOKINGS)))
  );

  const canUseAdmin = Boolean(visitorUser && visitorUser.role === 'admin');
  const session: SessionState = useMemo(() => {
    if (!visitorUser) {
      return { role: 'guest', userId: null, name: '' };
    }
    return {
      role: visitorUser.role === 'admin' && isTempAdmin ? 'admin' : 'visitor',
      userId: visitorUser.id,
      name: visitorUser.name,
    };
  }, [visitorUser, isTempAdmin]);

  // Persist changes to localStorage as offline cache
  useEffect(() => saveToStorage(STORAGE_KEYS.centres, centres), [centres]);
  useEffect(() => saveToStorage(STORAGE_KEYS.reviews, reviews), [reviews]);
  useEffect(() => saveToStorage(VISITOR_SAVED_KEY, guestSavedTests), [guestSavedTests]);
  useEffect(() => saveToStorage(STORAGE_KEYS.bookings, bookings), [bookings]);

  // Hydrate Supabase database & auth session on mount
  useEffect(() => {
    let active = true;

    fetchAppDataFromSupabase(
      buildDefaultCentres,
      DEFAULT_REVIEWS,
      DEFAULT_BOOKINGS
    ).then((res) => {
      if (!active) return;
      setSupabaseTablesReady(res.tablesReady);
      if (res.tablesReady) {
        if (res.centres) setCentres(res.centres);
        if (res.reviews) setReviews(res.reviews);
        if (res.bookings) setBookings(res.bookings);
      }
    });

    const syncAuthSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        const profile = await hydrateVisitorProfile(data.session.user);
        if (!active) return;
        setVisitorUser(profile);
      }
    };
    void syncAuthSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        if (!active) return;
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
          setAccountModalOpen(true);
        }
        if (nextSession?.user) {
          const profile = await hydrateVisitorProfile(nextSession.user);
          if (!active) return;
          setVisitorUser(profile);
        } else {
          setVisitorUser(null);
          setIsTempAdmin(false);
        }
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // UI & Filter State
  const [centreFilter, setCentreFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [testFilter, setTestFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [keywordFilter, setKeywordFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [comparePage, setComparePage] = useState(1);
  const [compareTray, setCompareTray] = useState<SavedTestRef[]>([]);
  const [directoryArea, setDirectoryArea] = useState('all');

  // Modals State
  const [detailCentreId, setDetailCentreId] = useState<string | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(() =>
    typeof window !== 'undefined' &&
    (window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery'))
  );
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'disclaimer' | null>(null);

  // Close open modals on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDetailCentreId(null);
        setAccountModalOpen(false);
        setAdminModalOpen(false);
        setLegalModalType(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const currentUser = visitorUser;

  const activeSavedTests = currentUser ? currentUser.savedTests : guestSavedTests;

  const areas = useMemo(
    () => [...new Set(centres.map((c) => c.area).filter(Boolean))].sort(),
    [centres]
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    centres.forEach((c) => c.tests.forEach((t) => t.category && set.add(t.category)));
    return [...set].sort();
  }, [centres]);

  const uniqueTests = useMemo(() => {
    const map = new Map<string, string>();
    centres.forEach((c) => {
      c.tests.forEach((t) => {
        if (!map.has(t.name)) map.set(t.name, t.category || 'General Diagnostics');
      });
    });
    return [...map.entries()]
      .map(([name, category]) => ({ name, category }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [centres]);

  const getRatingStats = (centreId: string) => {
    const centreReviews = reviews.filter((r) => r.centreId === centreId);
    if (centreReviews.length === 0) {
      return { avg: 0, count: 0, label: 'No reviews yet' };
    }
    const sum = centreReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = sum / centreReviews.length;
    return {
      avg,
      count: centreReviews.length,
      label: `${avg.toFixed(1)} (${centreReviews.length})`,
    };
  };

  const allListings: FlattenedTestListing[] = useMemo(() => {
    const rows: FlattenedTestListing[] = [];
    centres.forEach((centre) => {
      const stats = getRatingStats(centre.id);
      centre.tests.forEach((test) => {
        rows.push({
          centreId: centre.id,
          centreName: centre.name,
          area: centre.area,
          address: centre.address,
          phone: centre.phone,
          homeCollection: centre.homeCollection,
          ratingAvg: stats.avg,
          ratingCount: stats.count,
          ratingLabel: stats.label,
          testId: test.testId,
          testName: test.name,
          category: test.category || 'General Diagnostics',
          price: Number(test.price) || 0,
          prep: test.prep || 'Standard laboratory preparation',
        });
      });
    });
    return rows;
  }, [centres, reviews]);

  const filteredListings = useMemo(() => {
    const q = keywordFilter.trim().toLowerCase();
    const list = allListings.filter((item) => {
      if (centreFilter !== 'all' && item.centreId !== centreFilter) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (testFilter !== 'all' && item.testName !== testFilter) return false;
      if (areaFilter !== 'all' && item.area !== areaFilter) return false;
      if (q) {
        const hay = `${item.testName} ${item.testId} ${item.category} ${item.centreName} ${item.area}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return b.ratingAvg - a.ratingAvg || a.price - b.price;
      if (sortBy === 'name-asc') return a.centreName.localeCompare(b.centreName) || a.price - b.price;
      if (sortBy === 'test-asc') return a.testName.localeCompare(b.testName) || a.price - b.price;
      return 0;
    });

    return list;
  }, [
    allListings,
    centreFilter,
    categoryFilter,
    testFilter,
    areaFilter,
    keywordFilter,
    sortBy,
  ]);

  const totalTestsCount = useMemo(
    () => centres.reduce((acc, c) => acc + c.tests.length, 0),
    [centres]
  );

  // Strict Role Guard for Temporary Admin mutations
  const isAdminSession = () => Boolean(visitorUser && visitorUser.role === 'admin' && isTempAdmin);

  // Handlers: Search & Compare
  const handleHeroSearch = (keyword: string, area: string) => {
    setAreaFilter(area);
    const exact = uniqueTests.find(
      (t) => t.name.toLowerCase() === keyword.toLowerCase()
    );
    if (exact) {
      setTestFilter(exact.name);
      setKeywordFilter('');
    } else {
      setTestFilter('all');
      setKeywordFilter(keyword);
    }
    setComparePage(1);
    document.getElementById('compare-tests')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuickTestClick = (testName: string) => {
    setCentreFilter('all');
    setCategoryFilter('all');
    setAreaFilter('all');
    const exact = uniqueTests.find((t) => t.name === testName);
    if (exact) {
      setTestFilter(testName);
      setKeywordFilter('');
    } else {
      setTestFilter('all');
      setKeywordFilter(testName);
    }
    setComparePage(1);
    document.getElementById('compare-tests')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCategoryShortcut = (category: string) => {
    setCentreFilter('all');
    setTestFilter('all');
    setAreaFilter('all');
    setKeywordFilter('');
    setCategoryFilter(category);
    setComparePage(1);
    document.getElementById('compare-tests')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setCentreFilter('all');
    setCategoryFilter('all');
    setTestFilter('all');
    setAreaFilter('all');
    setKeywordFilter('');
    setSortBy('price-asc');
    setComparePage(1);
  };

  const handleToggleCompare = (centreId: string, testId: string) => {
    setCompareTray((prev) => {
      const exists = prev.some((x) => x.centreId === centreId && x.testId === testId);
      if (exists) {
        return prev.filter((x) => !(x.centreId === centreId && x.testId === testId));
      }
      const next = prev.length >= 3 ? prev.slice(1) : [...prev];
      next.push({ centreId, testId });
      return next;
    });
  };

  const isTestSaved = (centreId: string, testId: string): boolean =>
    activeSavedTests.some((x) => x.centreId === centreId && x.testId === testId);

  const handleToggleSave = (centreId: string, testId: string) => {
    if (currentUser) {
      const exists = currentUser.savedTests.some(
        (x) => x.centreId === centreId && x.testId === testId
      );
      const updatedUser: VisitorUser = {
        ...currentUser,
        savedTests: exists
          ? currentUser.savedTests.filter(
              (x) => !(x.centreId === centreId && x.testId === testId)
            )
          : [...currentUser.savedTests, { centreId, testId }],
      };
      setVisitorUser(updatedUser);
      void persistVisitorProfile(updatedUser);
    } else {
      setGuestSavedTests((prev) => {
        const exists = prev.some((x) => x.centreId === centreId && x.testId === testId);
        if (exists) {
          return prev.filter((x) => !(x.centreId === centreId && x.testId === testId));
        }
        return [...prev, { centreId, testId }];
      });
    }
  };

  // Handlers: Reviews (Signed-in Users Only) & Bookings
  const handleAddReview = (
    centreId: string,
    rating: number,
    author: string,
    comment: string
  ) => {
    if (!currentUser) return;
    const newRev: PatientReview = {
      id: `rev-${Date.now()}`,
      centreId,
      author,
      rating,
      comment,
      createdAt: new Date().toISOString().split('T')[0],
      verifiedVisitor: true,
    };
    setReviews((prev) => [newRev, ...prev]);
    if (supabaseTablesReady) {
      void insertReviewInSupabase(newRev, currentUser.id);
    }
  };

  const handleSubmitBooking = (payload: {
    centreId: string;
    patientName: string;
    patientPhone: string;
    testName: string;
    collectionType: string;
    preferredDate: string;
  }) => {
    const newBooking: SampleBooking = {
      id: `req-${Date.now()}`,
      userId: currentUser ? currentUser.id : null,
      patientName: payload.patientName,
      patientPhone: payload.patientPhone,
      centreId: payload.centreId,
      testName: payload.testName,
      preferredDate: payload.preferredDate,
      collectionType: payload.collectionType,
      status: 'Pending',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings((prev) => [newBooking, ...prev]);
    if (supabaseTablesReady) {
      void insertBookingInSupabase(newBooking);
    }
  };

  // Handlers: Personal User Account via Supabase Auth
  const handleUserSignIn = async (
    email: string,
    pass: string
  ): Promise<FeedbackMessage> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error || !data.user) {
      return {
        text: error?.message || 'Invalid email or password.',
        type: 'error',
      };
    }

    const profile = await hydrateVisitorProfile(data.user, guestSavedTests);
    setVisitorUser(profile);
    if (guestSavedTests.length > 0) {
      setGuestSavedTests([]);
    }
    return { text: '', type: 'success' };
  };

  const handleUserSignUp = async (
    name: string,
    email: string,
    area: string,
    pass: string
  ): Promise<FeedbackMessage> => {
    if (!name.trim() || !email.trim() || pass.length < 6) {
      return {
        text: 'Enter your name, valid email address, and a password of at least 6 characters.',
        type: 'error',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          name: name.trim(),
          area,
          savedTests: guestSavedTests,
        },
      },
    });

    if (error) {
      return { text: error.message, type: 'error' };
    }

    if (data.session && data.user) {
      const profile = await hydrateVisitorProfile(data.user, guestSavedTests);
      setVisitorUser(profile);
      setGuestSavedTests([]);
      return { text: '', type: 'success' };
    }

    return {
      text: 'Account created! Please check your email inbox to confirm your address, then Sign In.',
      type: 'success',
    };
  };

  const handleUpdateUserArea = (area: string) => {
    if (!currentUser) return;
    const updatedUser: VisitorUser = { ...currentUser, area };
    setVisitorUser(updatedUser);
    void persistVisitorProfile(updatedUser);
  };

  const handleOpenTempAdmin = () => {
    if (visitorUser && visitorUser.role === 'admin') {
      setIsTempAdmin(true);
    }
    setAdminModalOpen(true);
  };

  const handleAdminSignIn = async (
    email: string,
    pass: string
  ): Promise<FeedbackMessage> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error || !data.user) {
      return {
        text: error?.message || 'Invalid administrator email or password.',
        type: 'error',
      };
    }

    const profile = await hydrateVisitorProfile(data.user, guestSavedTests);
    setVisitorUser(profile);
    if (guestSavedTests.length > 0) {
      setGuestSavedTests([]);
    }

    if (profile.role !== 'admin') {
      setIsTempAdmin(false);
      return {
        text: 'This account does not have administrator privileges.',
        type: 'error',
      };
    }

    setIsTempAdmin(true);
    return { text: '', type: 'success' };
  };

  const handleRequestPasswordReset = async (
    email: string
  ): Promise<FeedbackMessage> => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        text: 'Please enter a valid registered email address.',
        type: 'error',
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin,
    });
    if (error) {
      return {
        text: error.message || 'Unable to send password reset email.',
        type: 'error',
      };
    }

    return {
      text: `Password reset link sent to ${cleanEmail}. Check your email inbox (and spam folder) and click the link to set a new password.`,
      type: 'success',
    };
  };

  const handleUpdatePassword = async (
    newPassword: string
  ): Promise<FeedbackMessage> => {
    if (newPassword.length < 6) {
      return {
        text: 'Password must be at least 6 characters long.',
        type: 'error',
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return {
        text: error.message || 'Could not update password. Please try requesting a new reset link.',
        type: 'error',
      };
    }

    setIsPasswordRecovery(false);
    if (typeof window !== 'undefined' && window.location.hash) {
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
    }

    return {
      text: 'Your password has been updated successfully.',
      type: 'success',
    };
  };

  const handleExitTempAdmin = () => {
    setIsTempAdmin(false);
    setAdminModalOpen(false);
  };

  const handleLogout = () => {
    void supabase.auth.signOut();
    setVisitorUser(null);
    setIsTempAdmin(false);
    setIsPasswordRecovery(false);
    setAccountModalOpen(false);
    setAdminModalOpen(false);
  };

  const deniedFeedback: FeedbackMessage = {
    text: 'Access denied: Temporary Admin Mode must be active on an authorized account.',
    type: 'error',
  };

  const handleSaveCentre = (payload: {
    id?: string;
    name: string;
    area: string;
    phone: string;
    address: string;
    hours: string;
    homeCollection: boolean;
    notes: string;
  }): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    if (!payload.name.trim() || !payload.area.trim() || !payload.phone.trim() || !payload.address.trim()) {
      return { text: 'Please fill all required hospital fields.', type: 'error' };
    }

    if (payload.id) {
      let updatedCentre: DiagnosticCentre | null = null;
      setCentres((prev) =>
        prev.map((c) => {
          if (c.id !== payload.id) return c;
          updatedCentre = {
            ...c,
            name: payload.name.trim(),
            area: payload.area.trim(),
            phone: payload.phone.trim(),
            address: payload.address.trim(),
            hours: payload.hours.trim(),
            homeCollection: payload.homeCollection,
            notes: payload.notes.trim(),
          };
          return updatedCentre;
        })
      );
      if (supabaseTablesReady && updatedCentre) {
        void upsertCentreInSupabase(updatedCentre);
      }
      return { text: 'Hospital information updated.', type: 'success' };
    }

    const newCentre: DiagnosticCentre = {
      id: `centre-${Date.now()}`,
      name: payload.name.trim(),
      area: payload.area.trim(),
      phone: payload.phone.trim(),
      address: payload.address.trim(),
      hours: payload.hours.trim() || '7:30 AM – 10:00 PM',
      homeCollection: payload.homeCollection,
      notes: payload.notes.trim() || 'Diagnostic testing centre.',
      tests: [
        {
          testId: `NEW-001`,
          name: 'ECG',
          category: 'Cardiology',
          price: 350,
          prep: 'No fasting needed · Report in 30 mins',
        },
      ],
    };
    setCentres((prev) => [...prev, newCentre]);
    if (supabaseTablesReady) {
      void upsertCentreInSupabase(newCentre);
    }
    return { text: 'New diagnostic centre added.', type: 'success' };
  };

  const handleDeleteCentre = (centreId: string): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    if (centres.length <= 1) {
      return { text: 'At least one hospital must remain.', type: 'error' };
    }
    setCentres((prev) => prev.filter((c) => c.id !== centreId));
    setReviews((prev) => prev.filter((r) => r.centreId !== centreId));
    if (supabaseTablesReady) {
      void deleteCentreInSupabase(centreId);
    }
    return { text: 'Hospital removed.', type: 'success' };
  };

  const handleResetDemoData = (): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    const defaults = buildDefaultCentres();
    setCentres(defaults);
    setReviews([...DEFAULT_REVIEWS]);
    if (supabaseTablesReady) {
      void syncReplaceCentresInSupabase(defaults);
    }
    return {
      text: 'Restored default 6 hospitals and 300 reference tests.',
      type: 'success',
    };
  };

  const handleAddOrUpdateTest = (payload: {
    centreId: string;
    testName: string;
    category: string;
    price: number;
    prep: string;
    applyAll: boolean;
  }): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    if (!payload.testName.trim() || !Number.isFinite(payload.price) || payload.price < 0) {
      return { text: 'Enter a valid test name and price in ৳.', type: 'error' };
    }

    const cleanName = payload.testName.trim();
    const cleanPrice = Math.round(payload.price);
    const cleanPrep = payload.prep.trim() || 'Standard lab prep · Same-day report';

    const nextCentres = centres.map((centre) => {
      if (!payload.applyAll && centre.id !== payload.centreId) return centre;
      const existingIdx = centre.tests.findIndex(
        (t) => t.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existingIdx >= 0) {
        const updatedTests = [...centre.tests];
        const nextTest = {
          ...updatedTests[existingIdx],
          price: cleanPrice,
          category: payload.category,
          prep: cleanPrep,
        };
        updatedTests[existingIdx] = nextTest;
        if (supabaseTablesReady) {
          void upsertTestInSupabase(centre.id, nextTest);
        }
        return { ...centre, tests: updatedTests };
      }
      const newTest = {
        testId: `${centre.name.slice(0, 3).toUpperCase()}-${centre.tests.length + 101}`,
        name: cleanName,
        category: payload.category,
        price: cleanPrice,
        prep: cleanPrep,
      };
      if (supabaseTablesReady) {
        void upsertTestInSupabase(centre.id, newTest);
      }
      return {
        ...centre,
        tests: [newTest, ...centre.tests],
      };
    });
    setCentres(nextCentres);

    return {
      text: payload.applyAll
        ? `Added/updated "${cleanName}" across all ${centres.length} hospitals.`
        : `Saved "${cleanName}" at ${formatBDT(cleanPrice)}.`,
      type: 'success',
    };
  };

  const handleSaveSinglePrice = (
    centreId: string,
    testId: string,
    price: number
  ): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    if (!Number.isFinite(price) || price < 0) {
      return { text: 'Enter a valid numeric price.', type: 'error' };
    }
    const rounded = Math.round(price);
    let updatedName = 'test';

    setCentres((prev) =>
      prev.map((c) => {
        if (c.id !== centreId) return c;
        return {
          ...c,
          tests: c.tests.map((t) => {
            if (t.testId !== testId) return t;
            updatedName = t.name;
            const nextTest = { ...t, price: rounded };
            if (supabaseTablesReady) {
              void upsertTestInSupabase(centreId, nextTest);
            }
            return nextTest;
          }),
        };
      })
    );

    return { text: `Updated ${updatedName} to ${formatBDT(rounded)}.`, type: 'success' };
  };

  const handleSaveBulkPrices = (updates: Record<string, number>): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return { text: 'No modified prices to save.', type: 'error' };
    }

    let count = 0;
    setCentres((prev) =>
      prev.map((c) => ({
        ...c,
        tests: c.tests.map((t) => {
          const key = `${c.id}::${t.testId}`;
          if (!Object.prototype.hasOwnProperty.call(updates, key)) return t;
          const val = Number(updates[key]);
          if (!Number.isFinite(val) || val < 0) return t;
          count++;
          const nextTest = { ...t, price: Math.round(val) };
          if (supabaseTablesReady) {
            void upsertTestInSupabase(c.id, nextTest);
          }
          return nextTest;
        }),
      }))
    );

    return {
      text: `Saved ${count || keys.length} updated price${keys.length === 1 ? '' : 's'} successfully.`,
      type: 'success',
    };
  };

  const handleDeleteTest = (centreId: string, testId: string): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    setCentres((prev) =>
      prev.map((c) =>
        c.id === centreId
          ? { ...c, tests: c.tests.filter((t) => t.testId !== testId) }
          : c
      )
    );
    if (supabaseTablesReady) {
      void deleteTestInSupabase(centreId, testId);
    }
    return { text: 'Test removed.', type: 'success' };
  };

  const handleApplyImportRows = (
    rawRows: Record<string, unknown>[]
  ): { updated: number; added: number; error?: string } => {
    if (!isAdminSession()) {
      return { updated: 0, added: 0, error: deniedFeedback.text };
    }

    let updated = 0;
    let added = 0;
    const nextCentres: DiagnosticCentre[] = JSON.parse(JSON.stringify(centres));

    rawRows.forEach((row) => {
      const norm: Record<string, unknown> = {};
      Object.keys(row).forEach((k) => {
        norm[k.toLowerCase().trim()] = row[k];
      });

      const testId = String(norm.test_id || norm.testid || '').trim();
      const centreName = String(
        norm.diagnostic_centre || norm.hospital || norm.centre || ''
      ).trim();
      const branch = String(norm.branch_name || norm.area || 'Dhaka').trim();
      const testName = String(norm.test_name || norm.test || '').trim();
      const category = String(
        norm.normalized_category || norm.category || 'General Diagnostics'
      ).trim();
      const price = Number(norm.price_bdt ?? norm.price ?? NaN);
      const prep = String(
        norm.prep_note || norm.prep || 'Standard laboratory preparation'
      ).trim();

      if (!Number.isFinite(price) || price < 0) return;

      if (testId) {
        let matched = false;
        for (const c of nextCentres) {
          const existing = c.tests.find(
            (t) => t.testId.toLowerCase() === testId.toLowerCase()
          );
          if (existing) {
            existing.price = Math.round(price);
            if (testName) existing.name = testName;
            if (category) existing.category = category;
            if (norm.prep_note) existing.prep = prep;
            updated++;
            matched = true;
            break;
          }
        }
        if (matched) return;
      }

      if (!centreName || !testName) return;
      let targetCentre = nextCentres.find(
        (c) => c.name.toLowerCase() === centreName.toLowerCase()
      );
      if (!targetCentre) {
        targetCentre = {
          id: `centre-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: centreName,
          area: branch,
          address: `${branch}, Bangladesh`,
          phone: '+880 1700-000000',
          hours: '8:00 AM – 10:00 PM',
          homeCollection: true,
          notes: 'Added via Admin dataset import.',
          tests: [],
        };
        nextCentres.push(targetCentre);
      }

      const existingByName = targetCentre.tests.find(
        (t) => t.name.toLowerCase() === testName.toLowerCase()
      );
      if (existingByName) {
        existingByName.price = Math.round(price);
        if (category) existingByName.category = category;
        updated++;
      } else {
        targetCentre.tests.push({
          testId: testId || `IMP-${targetCentre.tests.length + 1}`,
          name: testName,
          category,
          price: Math.round(price),
          prep,
        });
        added++;
      }
    });

    setCentres(nextCentres);
    if (supabaseTablesReady) {
      void syncReplaceCentresInSupabase(nextCentres);
    }
    return { updated, added };
  };

  const handleReplaceAllCentres = (
    parsed: DiagnosticCentre[]
  ): FeedbackMessage => {
    if (!isAdminSession()) return deniedFeedback;
    setCentres(parsed);
    if (supabaseTablesReady) {
      void syncReplaceCentresInSupabase(parsed);
    }
    return {
      text: `Restored full JSON backup (${parsed.length} hospitals).`,
      type: 'success',
    };
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!isAdminSession()) return;
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (supabaseTablesReady) {
      void deleteReviewInSupabase(reviewId);
    }
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    if (!isAdminSession()) return;
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    if (supabaseTablesReady) {
      void updateBookingStatusInSupabase(bookingId, status);
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    if (!isAdminSession()) return;
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    if (supabaseTablesReady) {
      void deleteBookingInSupabase(bookingId);
    }
  };

  const handleSyncToSupabase = async (): Promise<FeedbackMessage> => {
    if (!isAdminSession()) return deniedFeedback;
    const res = await seedAllDataToSupabase(centres, reviews, bookings);
    if (res.ok) {
      setSupabaseTablesReady(true);
      return {
        text: `Synced ${centres.length} hospitals, ${totalTestsCount} tests, ${reviews.length} reviews, and ${bookings.length} requests to Supabase.`,
        type: 'success',
      };
    }
    return {
      text: res.error || 'Could not sync. Ensure supabase/schema.sql has been executed in Supabase SQL Editor.',
      type: 'error',
    };
  };

  const detailCentre = detailCentreId
    ? centres.find((c) => c.id === detailCentreId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        session={session}
        canUseAdmin={canUseAdmin}
        isTempAdmin={isTempAdmin}
        savedCount={activeSavedTests.length}
        onOpenAccount={() => setAccountModalOpen(true)}
        onOpenTempAdmin={handleOpenTempAdmin}
        onExitTempAdmin={handleExitTempAdmin}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <HeroSection
          areas={areas}
          uniqueTests={uniqueTests}
          allListings={allListings}
          centresCount={centres.length}
          totalTestsCount={totalTestsCount}
          reviewsCount={reviews.length}
          onSearchSubmit={handleHeroSearch}
          onQuickTestClick={handleQuickTestClick}
          onCategoryShortcut={handleCategoryShortcut}
        />

        <CompareSection
          centres={centres}
          categories={categories}
          uniqueTests={uniqueTests}
          areas={areas}
          centreFilter={centreFilter}
          categoryFilter={categoryFilter}
          testFilter={testFilter}
          areaFilter={areaFilter}
          keywordFilter={keywordFilter}
          sortBy={sortBy}
          onCentreFilterChange={(v) => {
            setCentreFilter(v);
            setComparePage(1);
          }}
          onCategoryFilterChange={(v) => {
            setCategoryFilter(v);
            setComparePage(1);
          }}
          onTestFilterChange={(v) => {
            setTestFilter(v);
            setComparePage(1);
          }}
          onAreaFilterChange={(v) => {
            setAreaFilter(v);
            setComparePage(1);
          }}
          onKeywordFilterChange={(v) => {
            setKeywordFilter(v);
            setComparePage(1);
          }}
          onSortChange={(v) => {
            setSortBy(v);
            setComparePage(1);
          }}
          onResetFilters={handleResetFilters}
          filteredListings={filteredListings}
          allListings={allListings}
          compareTray={compareTray}
          onToggleCompare={handleToggleCompare}
          onRemoveCompare={(cId, tId) =>
            setCompareTray((prev) =>
              prev.filter((x) => !(x.centreId === cId && x.testId === tId))
            )
          }
          onClearCompareTray={() => setCompareTray([])}
          isTestSaved={isTestSaved}
          onToggleSave={handleToggleSave}
          onViewDetails={(cId) => setDetailCentreId(cId)}
          currentPage={comparePage}
          pageSize={COMPARE_PAGE_SIZE}
          onPageChange={setComparePage}
        />

        <CentresDirectory
          centres={centres}
          areas={areas}
          activeArea={directoryArea}
          onAreaChange={setDirectoryArea}
          getRatingStats={getRatingStats}
          onViewDetails={(cId) => setDetailCentreId(cId)}
        />

        <ReviewsSection
          centres={centres}
          reviews={reviews}
          session={session}
          onAddReview={handleAddReview}
          onOpenAccount={() => setAccountModalOpen(true)}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 px-4 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6">
          <div>
            <span className="font-semibold text-slate-800">MediCompare BD</span> · Reference
            diagnostic pricing directory ({new Date().getFullYear()}). Always confirm final
            charges directly with the hospital.
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              className="hover:text-slate-900 hover:underline cursor-pointer"
            >
              {currentUser ? `My Account (${currentUser.name})` : 'Sign In / Create Account'}
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="hover:text-slate-900 hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('disclaimer')}
              className="hover:text-slate-900 hover:underline cursor-pointer"
            >
              Medical &amp; Pricing Disclaimer
            </button>
            {(!currentUser || canUseAdmin) && (
              <button
                type="button"
                onClick={handleOpenTempAdmin}
                className="hover:text-slate-900 hover:underline cursor-pointer"
              >
                Admin Panel
              </button>
            )}
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="font-medium text-rose-700 hover:underline cursor-pointer"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CentreDetailModal
        centre={detailCentre}
        ratingLabel={detailCentre ? getRatingStats(detailCentre.id).label : ''}
        user={currentUser}
        isTestSaved={isTestSaved}
        onToggleSave={handleToggleSave}
        onSubmitBooking={handleSubmitBooking}
        onClose={() => setDetailCentreId(null)}
      />

      <VisitorAccountModal
        isOpen={accountModalOpen}
        user={currentUser}
        guestSavedTests={guestSavedTests}
        centres={centres}
        areas={areas}
        bookings={bookings}
        onSignIn={handleUserSignIn}
        onSignUp={handleUserSignUp}
        onRequestPasswordReset={handleRequestPasswordReset}
        onUpdatePassword={handleUpdatePassword}
        isPasswordRecovery={isPasswordRecovery}
        onCancelPasswordRecovery={() => setIsPasswordRecovery(false)}
        onUpdateArea={handleUpdateUserArea}
        onLogout={handleLogout}
        onRemoveSavedTest={handleToggleSave}
        onViewCentre={(cId) => setDetailCentreId(cId)}
        isTempAdmin={isTempAdmin}
        onOpenTempAdmin={handleOpenTempAdmin}
        onExitTempAdmin={handleExitTempAdmin}
        onClose={() => setAccountModalOpen(false)}
      />

      <AdminModal
        isOpen={adminModalOpen}
        session={session}
        canUseAdmin={canUseAdmin}
        centres={centres}
        reviews={reviews}
        bookings={bookings}
        categories={categories}
        onAdminSignIn={handleAdminSignIn}
        onRequestPasswordReset={handleRequestPasswordReset}
        onEnableTempAdmin={() => setIsTempAdmin(true)}
        onExitTempAdmin={handleExitTempAdmin}
        onAdminLogout={handleLogout}
        onSaveCentre={handleSaveCentre}
        onDeleteCentre={handleDeleteCentre}
        onResetDemoData={handleResetDemoData}
        onAddOrUpdateTest={handleAddOrUpdateTest}
        onSaveSinglePrice={handleSaveSinglePrice}
        onSaveBulkPrices={handleSaveBulkPrices}
        onDeleteTest={handleDeleteTest}
        onApplyImportRows={handleApplyImportRows}
        onReplaceAllCentres={handleReplaceAllCentres}
        onDeleteReview={handleDeleteReview}
        onUpdateBookingStatus={handleUpdateBookingStatus}
        onDeleteBooking={handleDeleteBooking}
        supabaseTablesReady={supabaseTablesReady}
        onSyncToSupabase={handleSyncToSupabase}
        onClose={() => setAdminModalOpen(false)}
      />

      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
}
