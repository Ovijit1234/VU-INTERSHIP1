export type UserRole = 'guest' | 'visitor' | 'admin';

export interface MedicalTest {
  testId: string;
  name: string;
  category: string;
  price: number;
  prep: string;
}

export interface DiagnosticCentre {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  hours: string;
  homeCollection: boolean;
  notes: string;
  tests: MedicalTest[];
}

export interface PatientReview {
  id: string;
  centreId: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  verifiedVisitor: boolean;
}

export interface SavedTestRef {
  centreId: string;
  testId: string;
}

export interface VisitorUser {
  id: string;
  role: 'visitor' | 'admin';
  name: string;
  email: string;
  area: string;
  savedTests: SavedTestRef[];
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Completed';

export interface SampleBooking {
  id: string;
  userId: string | null;
  patientName: string;
  patientPhone: string;
  centreId: string;
  testName: string;
  preferredDate: string;
  collectionType: string;
  status: BookingStatus;
  createdAt: string;
}

export interface SessionState {
  role: UserRole;
  userId: string | null;
  name: string;
}

export interface FlattenedTestListing {
  centreId: string;
  centreName: string;
  area: string;
  address: string;
  phone: string;
  homeCollection: boolean;
  ratingAvg: number;
  ratingCount: number;
  ratingLabel: string;
  testId: string;
  testName: string;
  category: string;
  price: number;
  prep: string;
}

export type SortOption = 'price-asc' | 'price-desc' | 'rating-desc' | 'name-asc' | 'test-asc';

export type AdminTab = 'centres' | 'tests' | 'importExport' | 'reviews' | 'bookings';

export interface FeedbackMessage {
  text: string;
  type: 'error' | 'success' | '';
}
