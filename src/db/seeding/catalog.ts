export type PalaceSeed = {
  id: string;
  name: string;
  description: string;
  theme: 'home' | 'market' | 'campus' | 'travel' | 'nature';
  requiredXp: number;
  isLocked: boolean;
  thumbnail: string;
};

export const PALACES: PalaceSeed[] = [
  {
    id: 'home-haven',
    name: 'Home Haven Palace',
    description: 'Familiar home route for foundational memory training.',
    theme: 'home',
    requiredXp: 0,
    isLocked: false,
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  },
  {
    id: 'market-route',
    name: 'Market Route Palace',
    description: 'Everyday shopping path with practical vocabulary.',
    theme: 'market',
    requiredXp: 250,
    isLocked: false,
    thumbnail: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
  },
  {
    id: 'campus-trail',
    name: 'Campus Trail Palace',
    description: 'Academic journey for study and communication vocabulary.',
    theme: 'campus',
    requiredXp: 600,
    isLocked: true,
    thumbnail: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800',
  },
  {
    id: 'travel-circuit',
    name: 'Travel Circuit Palace',
    description: 'Airport-to-hotel scenarios for travel fluency.',
    theme: 'travel',
    requiredXp: 1000,
    isLocked: true,
    thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
  },
  {
    id: 'nature-sanctum',
    name: 'Nature Sanctum Palace',
    description: 'Outdoor-themed route with advanced descriptive language.',
    theme: 'nature',
    requiredXp: 1500,
    isLocked: true,
    thumbnail: 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800',
  },
];

export const LOCATION_NAMES_BY_THEME: Record<PalaceSeed['theme'], string[]> = {
  home: ['Front Gate', 'Shoe Rack', 'Sofa', 'TV Console', 'Dining Table', 'Kitchen Sink', 'Fridge', 'Study Desk', 'Wardrobe', 'Bathroom Mirror'],
  market: ['Parking Bay', 'Main Entrance', 'Fruit Stall', 'Vegetable Stall', 'Bakery Shelf', 'Dairy Chiller', 'Snacks Aisle', 'Checkout Lane', 'Receipt Counter', 'Exit Door'],
  campus: ['Main Gate', 'Notice Board', 'Library Door', 'Reading Desk', 'Lab Entrance', 'Lecture Hall', 'Cafeteria', 'Study Bench', 'Sports Court', 'Dorm Lobby'],
  travel: ['Airport Entrance', 'Check-in Counter', 'Security Gate', 'Departure Lounge', 'Boarding Gate', 'Cabin Seat', 'Baggage Claim', 'Taxi Stand', 'Hotel Lobby', 'Hotel Room'],
  nature: ['Trailhead', 'Map Board', 'Forest Path', 'River Bank', 'Stone Bridge', 'Waterfall View', 'Hill Climb', 'Camping Spot', 'Night Sky Deck', 'Cabin Porch'],
};

export const LESSON_SETS = ['Set A', 'Set B', 'Set C'];

export const TOPIC_POOL: Record<PalaceSeed['theme'], string[]> = {
  home: ['Daily Objects', 'Routine Verbs', 'Kitchen Terms', 'Family Words', 'Home Adjectives', 'Cleaning Actions', 'Comfort Vocabulary', 'Health Habits', 'Weekend Chores', 'Time Expressions'],
  market: ['Produce Names', 'Money Terms', 'Buying Verbs', 'Packaging Words', 'Quantity Terms', 'Customer Phrases', 'Store Directions', 'Taste Adjectives', 'Snack Vocabulary', 'Checkout Language'],
  campus: ['Classroom Terms', 'Study Verbs', 'Academic Nouns', 'Exam Words', 'Presentation Phrases', 'Teamwork Language', 'Library Terms', 'Research Verbs', 'Career Vocabulary', 'Project Planning'],
  travel: ['Airport Terms', 'Immigration Phrases', 'Transport Verbs', 'Hotel Services', 'Navigation Words', 'Emergency Terms', 'Cultural Etiquette', 'Booking Language', 'Weather for Travel', 'Trip Reflection'],
  nature: ['Landscape Words', 'Weather Terms', 'Wildlife Nouns', 'Movement Verbs', 'Observation Adjectives', 'Camping Gear', 'Safety Phrases', 'Environmental Terms', 'Adventure Language', 'Mindfulness Vocabulary'],
};

export const WORD_BANK: Record<PalaceSeed['theme'], string[]> = {
  home: ['lamp', 'curtain', 'broom', 'fold', 'boil', 'plate', 'comfort', 'organize', 'tidy', 'relax', 'laundry', 'pillow', 'mop', 'spoon', 'shelter', 'vacuum', 'drawer', 'blanket', 'switch', 'kettle'],
  market: ['basket', 'receipt', 'discount', 'fresh', 'weigh', 'aisle', 'cashier', 'queue', 'coupon', 'budget', 'barcode', 'refill', 'cart', 'purchase', 'total', 'vendor', 'invoice', 'stock', 'label', 'checkout'],
  campus: ['lecture', 'assignment', 'deadline', 'revise', 'analyze', 'reference', 'library', 'project', 'schedule', 'collaborate', 'present', 'summary', 'research', 'focus', 'graduate', 'seminar', 'rubric', 'thesis', 'mentor', 'syllabus'],
  travel: ['passport', 'boarding', 'itinerary', 'reservation', 'luggage', 'customs', 'transit', 'terminal', 'currency', 'landmark', 'shuttle', 'souvenir', 'hostel', 'departure', 'arrival', 'checkin', 'delay', 'route', 'guide', 'booking'],
  nature: ['trail', 'meadow', 'summit', 'breeze', 'stream', 'cliff', 'wildlife', 'canopy', 'sunrise', 'starlight', 'compass', 'backpack', 'shelter', 'terrain', 'horizon', 'footpath', 'campsite', 'thunder', 'dewdrop', 'pinecone'],
};
