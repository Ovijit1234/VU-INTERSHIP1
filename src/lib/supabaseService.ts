import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import {
  BookingStatus,
  DiagnosticCentre,
  MedicalTest,
  PatientReview,
  SampleBooking,
  SavedTestRef,
  VisitorUser,
} from '../types/medicompare';

export interface SupabaseHydrationResult {
  tablesReady: boolean;
  seeded: boolean;
  centres?: DiagnosticCentre[];
  reviews?: PatientReview[];
  bookings?: SampleBooking[];
  error?: string;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    (error.message || '').includes('Could not find the table') ||
    (error.message || '').includes('does not exist')
  );
}

export async function fetchAppDataFromSupabase(
  fallbackCentres: () => DiagnosticCentre[],
  fallbackReviews: PatientReview[],
  fallbackBookings: SampleBooking[]
): Promise<SupabaseHydrationResult> {
  const { data: centreRows, error: centreErr } = await supabase
    .from('diagnostic_centres')
    .select('*')
    .order('name', { ascending: true });

  if (centreErr) {
    if (isMissingTableError(centreErr)) {
      return { tablesReady: false, seeded: false };
    }
    return { tablesReady: false, seeded: false, error: centreErr.message };
  }

  // Auto-seed initial 6 hospitals & 300 tests if database tables exist but are empty
  if (!centreRows || centreRows.length === 0) {
    const seedCentres = fallbackCentres();
    const seedResult = await seedAllDataToSupabase(
      seedCentres,
      fallbackReviews,
      fallbackBookings
    );
    if (seedResult.ok) {
      return {
        tablesReady: true,
        seeded: true,
        centres: seedCentres,
        reviews: fallbackReviews,
        bookings: fallbackBookings,
      };
    }
    return { tablesReady: true, seeded: false, error: seedResult.error };
  }

  const [testsRes, reviewsRes, bookingsRes] = await Promise.all([
    supabase.from('medical_tests').select('*').order('test_id', { ascending: true }),
    supabase.from('patient_reviews').select('*').order('created_at', { ascending: false }),
    supabase.from('sample_bookings').select('*').order('created_at', { ascending: false }),
  ]);

  if (testsRes.error || reviewsRes.error || bookingsRes.error) {
    const firstErr = testsRes.error || reviewsRes.error || bookingsRes.error;
    if (isMissingTableError(firstErr)) {
      return { tablesReady: false, seeded: false };
    }
    return { tablesReady: true, seeded: false, error: firstErr?.message };
  }

  const testsByCentre = new Map<string, MedicalTest[]>();
  (testsRes.data || []).forEach((row) => {
    const list = testsByCentre.get(row.centre_id) || [];
    list.push({
      testId: row.test_id,
      name: row.name,
      category: row.category,
      price: Number(row.price) || 0,
      prep: row.prep || '',
    });
    testsByCentre.set(row.centre_id, list);
  });

  const centres: DiagnosticCentre[] = centreRows.map((c) => ({
    id: c.id,
    name: c.name,
    area: c.area,
    address: c.address,
    phone: c.phone,
    hours: c.hours,
    homeCollection: Boolean(c.home_collection),
    notes: c.notes || '',
    tests: testsByCentre.get(c.id) || [],
  }));

  const reviews: PatientReview[] = (reviewsRes.data || []).map((r) => ({
    id: r.id,
    centreId: r.centre_id,
    author: r.author,
    rating: Number(r.rating) || 5,
    comment: r.comment,
    createdAt: r.created_at,
    verifiedVisitor: Boolean(r.verified_visitor),
  }));

  const bookings: SampleBooking[] = (bookingsRes.data || []).map((b) => ({
    id: b.id,
    userId: b.user_id || null,
    patientName: b.patient_name,
    patientPhone: b.patient_phone,
    centreId: b.centre_id,
    testName: b.test_name,
    preferredDate: b.preferred_date,
    collectionType: b.collection_type,
    status: (b.status as BookingStatus) || 'Pending',
    createdAt: b.created_at,
  }));

  return {
    tablesReady: true,
    seeded: false,
    centres,
    reviews,
    bookings,
  };
}

export async function seedAllDataToSupabase(
  centres: DiagnosticCentre[],
  reviews: PatientReview[],
  bookings: SampleBooking[]
): Promise<{ ok: boolean; error?: string }> {
  const centrePayload = centres.map((c) => ({
    id: c.id,
    name: c.name,
    area: c.area,
    address: c.address,
    phone: c.phone,
    hours: c.hours,
    home_collection: c.homeCollection,
    notes: c.notes,
  }));

  const { error: cErr } = await supabase
    .from('diagnostic_centres')
    .upsert(centrePayload, { onConflict: 'id' });
  if (cErr) return { ok: false, error: cErr.message };

  const testPayload = centres.flatMap((c) =>
    c.tests.map((t) => ({
      centre_id: c.id,
      test_id: t.testId,
      name: t.name,
      category: t.category,
      price: Math.round(Number(t.price) || 0),
      prep: t.prep || '',
    }))
  );

  // Batch upsert tests in chunks of 150
  for (let i = 0; i < testPayload.length; i += 150) {
    const chunk = testPayload.slice(i, i + 150);
    const { error: tErr } = await supabase
      .from('medical_tests')
      .upsert(chunk, { onConflict: 'centre_id,test_id' });
    if (tErr) return { ok: false, error: tErr.message };
  }

  if (reviews.length > 0) {
    const reviewPayload = reviews.map((r) => ({
      id: r.id,
      centre_id: r.centreId,
      user_id: null,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
      verified_visitor: r.verifiedVisitor,
    }));
    await supabase.from('patient_reviews').upsert(reviewPayload, { onConflict: 'id' });
  }

  if (bookings.length > 0) {
    const bookingPayload = bookings.map((b) => ({
      id: b.id,
      user_id: null,
      patient_name: b.patientName,
      patient_phone: b.patientPhone,
      centre_id: b.centreId,
      test_name: b.testName,
      preferred_date: b.preferredDate,
      collection_type: b.collectionType,
      status: b.status,
      created_at: b.createdAt,
    }));
    await supabase.from('sample_bookings').upsert(bookingPayload, { onConflict: 'id' });
  }

  return { ok: true };
}

export async function syncReplaceCentresInSupabase(centres: DiagnosticCentre[]): Promise<{ ok: boolean; error?: string }> {
  const { data: existingCentres } = await supabase.from('diagnostic_centres').select('id');
  const nextIds = new Set(centres.map((c) => c.id));
  const toDelete = (existingCentres || []).map((r) => r.id).filter((id) => !nextIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from('diagnostic_centres').delete().in('id', toDelete);
  }
  return seedAllDataToSupabase(centres, [], []);
}

export async function upsertCentreInSupabase(centre: DiagnosticCentre): Promise<void> {
  const { error } = await supabase.from('diagnostic_centres').upsert(
    {
      id: centre.id,
      name: centre.name,
      area: centre.area,
      address: centre.address,
      phone: centre.phone,
      hours: centre.hours,
      home_collection: centre.homeCollection,
      notes: centre.notes,
    },
    { onConflict: 'id' }
  );
  if (error || centre.tests.length === 0) return;

  await supabase.from('medical_tests').upsert(
    centre.tests.map((t) => ({
      centre_id: centre.id,
      test_id: t.testId,
      name: t.name,
      category: t.category,
      price: Math.round(Number(t.price) || 0),
      prep: t.prep || '',
    })),
    { onConflict: 'centre_id,test_id' }
  );
}

export async function deleteCentreInSupabase(centreId: string): Promise<void> {
  await supabase.from('diagnostic_centres').delete().eq('id', centreId);
}

export async function upsertTestInSupabase(centreId: string, test: MedicalTest): Promise<void> {
  await supabase.from('medical_tests').upsert(
    {
      centre_id: centreId,
      test_id: test.testId,
      name: test.name,
      category: test.category,
      price: Math.round(Number(test.price) || 0),
      prep: test.prep || '',
    },
    { onConflict: 'centre_id,test_id' }
  );
}

export async function deleteTestInSupabase(centreId: string, testId: string): Promise<void> {
  await supabase
    .from('medical_tests')
    .delete()
    .eq('centre_id', centreId)
    .eq('test_id', testId);
}

export async function insertReviewInSupabase(
  review: PatientReview,
  userId: string
): Promise<void> {
  await supabase.from('patient_reviews').insert({
    id: review.id,
    centre_id: review.centreId,
    user_id: userId,
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt,
    verified_visitor: true,
  });
}

export async function deleteReviewInSupabase(reviewId: string): Promise<void> {
  await supabase.from('patient_reviews').delete().eq('id', reviewId);
}

export async function insertBookingInSupabase(booking: SampleBooking): Promise<void> {
  await supabase.from('sample_bookings').insert({
    id: booking.id,
    user_id: booking.userId,
    patient_name: booking.patientName,
    patient_phone: booking.patientPhone,
    centre_id: booking.centreId,
    test_name: booking.testName,
    preferred_date: booking.preferredDate,
    collection_type: booking.collectionType,
    status: booking.status,
    created_at: booking.createdAt,
  });
}

export async function updateBookingStatusInSupabase(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await supabase.from('sample_bookings').update({ status }).eq('id', bookingId);
}

export async function deleteBookingInSupabase(bookingId: string): Promise<void> {
  await supabase.from('sample_bookings').delete().eq('id', bookingId);
}

export const ADMIN_OWNER_EMAIL = 'ovijitsaha1517@gmail.com';

export async function hydrateVisitorProfile(
  authUser: User,
  guestSavedTests: SavedTestRef[] = []
): Promise<VisitorUser> {
  const meta = (authUser.user_metadata || {}) as {
    name?: string;
    area?: string;
    savedTests?: SavedTestRef[];
  };
  const email = authUser.email || '';
  const isOwner = email.trim().toLowerCase() === ADMIN_OWNER_EMAIL;
  const fallbackName =
    meta.name || email.split('@')[0] || 'Patient Member';
  const fallbackArea = meta.area || 'Dhanmondi';
  const metaSaved = Array.isArray(meta.savedTests) ? meta.savedTests : [];

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!error && profile) {
    const resolvedRole: 'visitor' | 'admin' =
      profile.role === 'admin' || isOwner ? 'admin' : 'visitor';
    const existingSaved = Array.isArray(profile.saved_tests)
      ? (profile.saved_tests as SavedTestRef[])
      : metaSaved;
    const mergedSaved = mergeSavedRefs(existingSaved, guestSavedTests);
    if (guestSavedTests.length > 0 && mergedSaved.length !== existingSaved.length) {
      await supabase
        .from('profiles')
        .update({ saved_tests: mergedSaved, updated_at: new Date().toISOString() })
        .eq('id', authUser.id);
    }
    return {
      id: authUser.id,
      role: resolvedRole,
      name: profile.name || fallbackName,
      email: profile.email || email,
      area: profile.area || fallbackArea,
      savedTests: mergedSaved,
    };
  }

  const resolvedRole: 'visitor' | 'admin' = isOwner ? 'admin' : 'visitor';
  const mergedSaved = mergeSavedRefs(metaSaved, guestSavedTests);
  if (!error && !profile) {
    await supabase.from('profiles').upsert(
      {
        id: authUser.id,
        name: fallbackName,
        email,
        area: fallbackArea,
        role: resolvedRole,
        saved_tests: mergedSaved,
      },
      { onConflict: 'id' }
    );
  }

  return {
    id: authUser.id,
    role: resolvedRole,
    name: fallbackName,
    email,
    area: fallbackArea,
    savedTests: mergedSaved,
  };
}

export async function persistVisitorProfile(
  user: VisitorUser
): Promise<void> {
  await Promise.allSettled([
    supabase.auth.updateUser({
      data: {
        name: user.name,
        area: user.area,
        savedTests: user.savedTests,
      },
    }),
    supabase.from('profiles').upsert(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        area: user.area,
        role: user.role,
        saved_tests: user.savedTests,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    ),
  ]);
}

function mergeSavedRefs(a: SavedTestRef[], b: SavedTestRef[]): SavedTestRef[] {
  const seen = new Set(a.map((x) => `${x.centreId}::${x.testId}`));
  const result = [...a];
  b.forEach((item) => {
    const key = `${item.centreId}::${item.testId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  });
  return result;
}
