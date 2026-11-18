import {
  DiagnosticCentre,
  PatientReview,
  SampleBooking,
} from '../types/medicompare';

export const STORAGE_KEYS = {
  centres: 'medicompare_centres_v2',
  reviews: 'medicompare_reviews_v2',
  bookings: 'medicompare_bookings_v2',
  session: 'medicompare_session_v2',
} as const;

export const TEST_CATEGORIES = [
  'General Diagnostics',
  'Cardiology',
  'Radiology & Imaging',
  'Serology & Immunology',
  'Endoscopy & GI',
  'Packages & Services',
] as const;

export const POPULAR_TEST_SHORTCUTS = [
  'ECG',
  'CBC (Complete Blood Count)',
  'HbA1c (Glycated Hemoglobin)',
  'Lipid Profile (Fasting)',
  'MRI of Brain (Plain)',
  'Dengue NS1 Antigen',
] as const;

interface BaseTestItem {
  code: string;
  name: string;
  category: string;
  basePrice: number;
  prep: string;
}

const BASE_TEST_CATALOG: BaseTestItem[] = [
  { code: '001', name: 'ECG', category: 'Cardiology', basePrice: 350, prep: 'No fasting needed · Report in 30 mins' },
  { code: '002', name: 'Blood Screening+Grouping', category: 'General Diagnostics', basePrice: 400, prep: 'No preparation · Same-day report' },
  { code: '003', name: 'CLO Test (DFARUQUE)', category: 'Endoscopy & GI', basePrice: 1200, prep: 'Performed during upper GI endoscopy' },
  { code: '004', name: 'Anesthesia for MRI of Brain', category: 'Radiology & Imaging', basePrice: 4500, prep: '6 hrs fasting required · Doctor order needed' },
  { code: '005', name: 'Holter ECG 120hrs', category: 'Cardiology', basePrice: 5500, prep: 'Wear portable monitor · Report in 24 hrs' },
  { code: '006', name: 'CBC (Complete Blood Count)', category: 'General Diagnostics', basePrice: 450, prep: 'No fasting · Report in 3–4 hrs' },
  { code: '007', name: 'ESR (Erythrocyte Sedimentation Rate)', category: 'General Diagnostics', basePrice: 200, prep: 'No fasting · Same-day report' },
  { code: '008', name: 'HbA1c (Glycated Hemoglobin)', category: 'General Diagnostics', basePrice: 1000, prep: 'No fasting needed · Same-day report' },
  { code: '009', name: 'Fasting Blood Glucose (FBG)', category: 'General Diagnostics', basePrice: 180, prep: '8–10 hrs overnight fasting' },
  { code: '010', name: '2 Hours After Breakfast Glucose', category: 'General Diagnostics', basePrice: 180, prep: 'Collect exactly 2 hrs after meal' },
  { code: '011', name: 'Lipid Profile (Fasting)', category: 'Cardiology', basePrice: 1100, prep: '10–12 hrs fasting required' },
  { code: '012', name: 'Liver Function Test (LFT / SGPT & SGOT)', category: 'General Diagnostics', basePrice: 1050, prep: 'Same-day digital report' },
  { code: '013', name: 'Serum Creatinine (Kidney Function)', category: 'General Diagnostics', basePrice: 400, prep: 'No fasting · Same-day report' },
  { code: '014', name: 'Serum Electrolytes (Na, K, Cl)', category: 'General Diagnostics', basePrice: 900, prep: 'No fasting · Report in 4 hrs' },
  { code: '015', name: 'Urine R/E (Routine Examination)', category: 'General Diagnostics', basePrice: 250, prep: 'Mid-stream clean catch sample' },
  { code: '016', name: 'Thyroid Stimulating Hormone (TSH)', category: 'Serology & Immunology', basePrice: 800, prep: 'Morning sample preferred' },
  { code: '017', name: 'Full Thyroid Panel (TSH, FT3, FT4)', category: 'Serology & Immunology', basePrice: 2200, prep: 'Same-day evening report' },
  { code: '018', name: 'Vitamin D (25-OH Total)', category: 'Serology & Immunology', basePrice: 2400, prep: 'Report within 24 hrs' },
  { code: '019', name: 'Vitamin B12', category: 'Serology & Immunology', basePrice: 1800, prep: 'Morning sample preferred' },
  { code: '020', name: 'Dengue NS1 Antigen', category: 'Serology & Immunology', basePrice: 500, prep: 'Best within day 1–5 of fever' },
  { code: '021', name: 'CRP (C-Reactive Protein)', category: 'Serology & Immunology', basePrice: 700, prep: 'No fasting · Same-day report' },
  { code: '022', name: 'HBsAg (Hepatitis B Screening)', category: 'Serology & Immunology', basePrice: 650, prep: 'Same-day report' },
  { code: '023', name: 'Anti-HCV (Hepatitis C)', category: 'Serology & Immunology', basePrice: 1100, prep: 'Same-day report' },
  { code: '024', name: 'Widal Test (Typhoid)', category: 'Serology & Immunology', basePrice: 450, prep: 'Same-day report' },
  { code: '025', name: 'Serum Ferritin', category: 'Serology & Immunology', basePrice: 1400, prep: 'Report in 24 hrs' },
  { code: '026', name: 'Troponin-I (Cardiac Marker)', category: 'Cardiology', basePrice: 1500, prep: 'Urgent report in 1–2 hrs' },
  { code: '027', name: 'Echocardiogram (2D & Color Doppler)', category: 'Cardiology', basePrice: 2400, prep: 'Prior slot recommended' },
  { code: '028', name: 'ETT (Exercise Tolerance Test)', category: 'Cardiology', basePrice: 2800, prep: 'Wear comfortable walking shoes' },
  { code: '029', name: 'Chest X-Ray (PA View Digital)', category: 'Radiology & Imaging', basePrice: 550, prep: 'Remove metallic objects · 1 hr report' },
  { code: '030', name: 'Ultrasound Whole Abdomen', category: 'Radiology & Imaging', basePrice: 1400, prep: '6 hrs fasting & full bladder' },
  { code: '031', name: 'Ultrasound Pregnancy Profile', category: 'Radiology & Imaging', basePrice: 1300, prep: 'Full bladder recommended' },
  { code: '032', name: 'CT Scan of Brain (Plain)', category: 'Radiology & Imaging', basePrice: 4200, prep: 'Report within 3–4 hrs' },
  { code: '033', name: 'MRI of Brain (Plain)', category: 'Radiology & Imaging', basePrice: 8200, prep: 'Remove all metal implants/jewelry' },
  { code: '034', name: 'MRI of Lumbar Spine', category: 'Radiology & Imaging', basePrice: 8500, prep: 'Appointment required · 24 hr report' },
  { code: '035', name: 'Bilateral Mammography', category: 'Radiology & Imaging', basePrice: 2600, prep: 'Avoid deodorant on exam day' },
  { code: '036', name: 'Upper GI Endoscopy', category: 'Endoscopy & GI', basePrice: 3500, prep: '8 hrs overnight fasting required' },
  { code: '037', name: 'Colonoscopy (Diagnostic)', category: 'Endoscopy & GI', basePrice: 6500, prep: 'Bowel prep kit 24 hrs prior' },
  { code: '038', name: 'Stool R/E & Occult Blood', category: 'Endoscopy & GI', basePrice: 350, prep: 'Fresh container sample' },
  { code: '039', name: 'Helicobacter Pylori Stool Ag', category: 'Endoscopy & GI', basePrice: 1600, prep: 'Stop PPI 7 days prior if advised' },
  { code: '040', name: 'Serum Amylase & Lipase', category: 'Endoscopy & GI', basePrice: 1500, prep: 'Same-day report' },
  { code: '041', name: 'Serum Uric Acid', category: 'General Diagnostics', basePrice: 350, prep: 'Same-day report' },
  { code: '042', name: 'Serum Calcium', category: 'General Diagnostics', basePrice: 450, prep: 'Same-day report' },
  { code: '043', name: 'D-Dimer', category: 'Cardiology', basePrice: 1800, prep: 'Same-day urgent report' },
  { code: '044', name: 'PSA (Prostate Specific Antigen)', category: 'Serology & Immunology', basePrice: 1300, prep: 'Report in 24 hrs' },
  { code: '045', name: 'Pap Smear (Liquid Based Cytology)', category: 'General Diagnostics', basePrice: 1500, prep: 'Report in 3 working days' },
  { code: '046', name: 'DEXA Bone Mineral Density', category: 'Radiology & Imaging', basePrice: 3200, prep: 'Appointment required' },
  { code: '047', name: 'Basic Health Checkup Package', category: 'Packages & Services', basePrice: 2900, prep: '10 hrs fasting · CBC, FBG, Lipid, Creatinine' },
  { code: '048', name: 'Diabetes Monitoring Package', category: 'Packages & Services', basePrice: 2400, prep: 'Fasting · HbA1c, FBG, Creatinine, Urine R/E' },
  { code: '049', name: 'Executive Cardiac Screening', category: 'Packages & Services', basePrice: 5200, prep: 'Fasting · ECG, Echo, Lipid, Troponin, CBC' },
  { code: '050', name: 'Senior Citizen Annual Wellness', category: 'Packages & Services', basePrice: 6400, prep: '10 hrs fasting · Full blood, TSH, USG & ECG' },
];

const HOSPITAL_TEMPLATES = [
  {
    id: 'centre-popular',
    prefix: 'POP',
    name: 'Popular Diagnostic Centre',
    area: 'Dhanmondi',
    address: 'House 16, Road 2, Dhanmondi, Dhaka 1205',
    phone: '+880 9613-787801',
    hours: '7:00 AM – 11:00 PM (Daily)',
    homeCollection: true,
    notes: 'High-throughput automated lab with SMS/online report portal and home sample collection across Dhanmondi.',
    multiplier: 1.05,
  },
  {
    id: 'centre-islami',
    prefix: 'IBH',
    name: 'Islami Bank Hospital',
    area: 'Kakrail / Motijheel',
    address: '24/B Outer Circular Road, Motijheel, Dhaka 1000',
    phone: '+880 2-9336421',
    hours: '7:30 AM – 10:30 PM (Daily)',
    homeCollection: true,
    notes: 'Known for affordable reference rates on routine pathology, radiology, and cardiac diagnostics.',
    multiplier: 0.85,
  },
  {
    id: 'centre-labaid',
    prefix: 'LAB',
    name: 'Labaid Specialized Hospital',
    area: 'Dhanmondi',
    address: 'House 06, Road 04, Dhanmondi, Dhaka 1205',
    phone: '+880 1766-662111',
    hours: '24 Hours Diagnostic Wing',
    homeCollection: true,
    notes: 'Dedicated 24/7 imaging, cardiac diagnostics, and priority digital reporting desk.',
    multiplier: 1.15,
  },
  {
    id: 'centre-ibnsina',
    prefix: 'IBS',
    name: 'Ibn Sina Diagnostic & Imaging',
    area: 'Mirpur',
    address: 'House 11, Road 1, Block A, Mirpur 10, Dhaka 1216',
    phone: '+880 9610-010615',
    hours: '7:30 AM – 11:00 PM (Daily)',
    homeCollection: true,
    notes: 'Popular for transparent pricing, digital X-Ray/MRI units, and weekend sample collection.',
    multiplier: 0.92,
  },
  {
    id: 'centre-medipath',
    prefix: 'MED',
    name: 'Medipath Diagnostic Complex',
    area: 'Matikata',
    address: 'Matikata Main Road, Cantonment Area, Dhaka 1206',
    phone: '+880 1711-002233',
    hours: '8:00 AM – 10:00 PM (Sat–Thu)',
    homeCollection: false,
    notes: 'Neighbourhood diagnostic facility serving Matikata & Mirpur DOHS with fast same-day reporting.',
    multiplier: 0.88,
  },
  {
    id: 'centre-amana',
    prefix: 'AMA',
    name: 'Amana Hospital',
    area: 'Laxmipur',
    address: 'Hospital Road, Laxmipur Sadar / Regional Hub',
    phone: '+880 1722-004455',
    hours: '7:30 AM – 10:00 PM (Daily)',
    homeCollection: true,
    notes: 'Regional multi-unit hospital offering budget-friendly diagnostic packages and endoscopy services.',
    multiplier: 0.82,
  },
];

export function buildDefaultCentres(): DiagnosticCentre[] {
  return HOSPITAL_TEMPLATES.map((hosp, hIdx) => {
    const tests = BASE_TEST_CATALOG.map((item, tIdx) => {
      const variance = ((hIdx * 7 + tIdx * 3) % 5) * 10 - 20;
      const computedPrice = Math.max(
        100,
        Math.round((item.basePrice * hosp.multiplier + variance) / 10) * 10
      );
      return {
        testId: `${hosp.prefix}-${item.code}`,
        name: item.name,
        category: item.category,
        price: computedPrice,
        prep: item.prep,
      };
    });

    return {
      id: hosp.id,
      name: hosp.name,
      area: hosp.area,
      address: hosp.address,
      phone: hosp.phone,
      hours: hosp.hours,
      homeCollection: hosp.homeCollection,
      notes: hosp.notes,
      tests,
    };
  });
}

export const DEFAULT_REVIEWS: PatientReview[] = [
  {
    id: 'rev-1',
    centreId: 'centre-islami',
    author: 'Mahmudul Hasan',
    rating: 5,
    comment:
      'Very reasonable diagnostic fees compared to larger private hubs. Got my CBC and ECG report the same afternoon.',
    createdAt: '2026-10-12',
    verifiedVisitor: true,
  },
  {
    id: 'rev-2',
    centreId: 'centre-popular',
    author: 'Nusrat Jahan',
    rating: 4,
    comment:
      'Morning rush at Dhanmondi branch can be busy, but online report download worked smoothly without needing a second trip.',
    createdAt: '2026-10-19',
    verifiedVisitor: true,
  },
  {
    id: 'rev-3',
    centreId: 'centre-ibnsina',
    author: 'Tanvir Ahmed',
    rating: 5,
    comment:
      'Booked home blood collection for my father in Mirpur. Phlebotomist arrived on time and fees matched the counter list.',
    createdAt: '2026-10-25',
    verifiedVisitor: false,
  },
  {
    id: 'rev-4',
    centreId: 'centre-labaid',
    author: 'Farhana Yasmin',
    rating: 4,
    comment:
      'Clean waiting lounge and helpful cardiology technicians for Echocardiogram, though prices are slightly higher.',
    createdAt: '2026-11-02',
    verifiedVisitor: true,
  },
  {
    id: 'rev-5',
    centreId: 'centre-medipath',
    author: 'Kamrul Islam',
    rating: 4,
    comment:
      'Convenient for quick routine tests near Matikata with minimal queue time.',
    createdAt: '2026-11-06',
    verifiedVisitor: false,
  },
  {
    id: 'rev-6',
    centreId: 'centre-amana',
    author: 'Sadia Afrin',
    rating: 5,
    comment:
      'Affordable health checkup package and polite reception staff.',
    createdAt: '2026-11-10',
    verifiedVisitor: true,
  },
];

export const DEFAULT_BOOKINGS: SampleBooking[] = [
  {
    id: 'req-101',
    userId: null,
    patientName: 'Rahim Uddin',
    patientPhone: '01700-112233',
    centreId: 'centre-islami',
    testName: 'ECG',
    preferredDate: '2026-11-22',
    collectionType: 'Walk-in Counter',
    status: 'Confirmed',
    createdAt: '2026-11-15',
  },
];

export function loadFromStorage<T>(key: string, fallbackFactory: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallbackFactory();
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallbackFactory();
  } catch {
    return fallbackFactory();
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatBDT(amount: number): string {
  const num = Number(amount) || 0;
  return `৳ ${num.toLocaleString('en-US')}`;
}

export function parseCsvText(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim());
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    rows.push(obj);
  }
  return rows;
}
