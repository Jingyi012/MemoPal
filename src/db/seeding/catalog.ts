export type PalaceSeed = {
  id: string;
  name: string;
  description: string;
  theme: 'home' | 'market' | 'campus' | 'travel' | 'nature';
  requiredXp: number;
  isLocked: boolean;
  thumbnail: string;
};

export type LessonWordSeed = { text: string; meaning: string };
export type LessonSeed = { title: string; description: string; words: LessonWordSeed[] };

export const PALACES: PalaceSeed[] = [
  { id: 'home-haven', name: 'Home Haven Palace', description: 'Familiar home route for foundational memory training.', theme: 'home', requiredXp: 0, isLocked: false, thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800' },
  { id: 'market-route', name: 'Market Route Palace', description: 'Everyday shopping path with practical vocabulary.', theme: 'market', requiredXp: 250, isLocked: false, thumbnail: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800' },
  { id: 'campus-trail', name: 'Campus Trail Palace', description: 'Academic journey for study and communication vocabulary.', theme: 'campus', requiredXp: 600, isLocked: true, thumbnail: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800' },
  { id: 'travel-circuit', name: 'Travel Circuit Palace', description: 'Airport-to-hotel scenarios for travel fluency.', theme: 'travel', requiredXp: 1000, isLocked: true, thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800' },
  { id: 'nature-sanctum', name: 'Nature Sanctum Palace', description: 'Outdoor-themed route with advanced descriptive language.', theme: 'nature', requiredXp: 1500, isLocked: true, thumbnail: 'https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=800' },
];

export const LOCATION_NAMES_BY_THEME: Record<PalaceSeed['theme'], string[]> = {
  home: ['Front Gate', 'Shoe Rack', 'Sofa', 'TV Console', 'Dining Table', 'Kitchen Sink', 'Fridge', 'Study Desk', 'Wardrobe', 'Bathroom Mirror'],
  market: ['Parking Bay', 'Main Entrance', 'Fruit Stall', 'Vegetable Stall', 'Bakery Shelf', 'Dairy Chiller', 'Snacks Aisle', 'Checkout Lane', 'Receipt Counter', 'Exit Door'],
  campus: ['Main Gate', 'Notice Board', 'Library Door', 'Reading Desk', 'Lab Entrance', 'Lecture Hall', 'Cafeteria', 'Study Bench', 'Sports Court', 'Dorm Lobby'],
  travel: ['Airport Entrance', 'Check-in Counter', 'Security Gate', 'Departure Lounge', 'Boarding Gate', 'Cabin Seat', 'Baggage Claim', 'Taxi Stand', 'Hotel Lobby', 'Hotel Room'],
  nature: ['Trailhead', 'Map Board', 'Forest Path', 'River Bank', 'Stone Bridge', 'Waterfall View', 'Hill Climb', 'Camping Spot', 'Night Sky Deck', 'Cabin Porch'],
};

export const LESSON_LIBRARY: Record<PalaceSeed['theme'], LessonSeed[]> = {
  home: [
    { title: 'Home Essentials', description: 'Core objects around the house.', words: [
      { text: 'doorbell', meaning: 'A button that rings when pressed at the door' }, { text: 'slippers', meaning: 'Soft shoes worn indoors' }, { text: 'cushion', meaning: 'A soft pillow for support' }, { text: 'remote', meaning: 'A handheld device to control TV' }, { text: 'plate', meaning: 'A flat dish for serving food' },
      { text: 'faucet', meaning: 'A tap that controls water flow' }, { text: 'freezer', meaning: 'Compartment for very cold storage' }, { text: 'notebook', meaning: 'Book for writing notes' }, { text: 'hanger', meaning: 'Item used to hang clothes' }, { text: 'toothbrush', meaning: 'Brush for cleaning teeth' },
    ]},
    { title: 'Daily Actions', description: 'Verbs used in home routines.', words: [
      { text: 'unlock', meaning: 'Open a lock with a key or code' }, { text: 'arrange', meaning: 'Put things in order' }, { text: 'stretch', meaning: 'Extend your body or limbs' }, { text: 'watch', meaning: 'Look at carefully over time' }, { text: 'serve', meaning: 'Provide food or drink' },
      { text: 'rinse', meaning: 'Wash quickly with water' }, { text: 'store', meaning: 'Keep for future use' }, { text: 'review', meaning: 'Look back over notes' }, { text: 'fold', meaning: 'Bend something over itself' }, { text: 'gargle', meaning: 'Clean throat or mouth with liquid' },
    ]},
    { title: 'Comfort & Habits', description: 'Words tied to wellbeing at home.', words: [
      { text: 'welcome', meaning: 'A greeting for someone arriving' }, { text: 'cozy', meaning: 'Comfortably warm and pleasant' }, { text: 'routine', meaning: 'A regular sequence of actions' }, { text: 'balance', meaning: 'A stable and healthy proportion' }, { text: 'portion', meaning: 'An amount of food served' },
      { text: 'hygiene', meaning: 'Practices that maintain health and cleanliness' }, { text: 'nutrition', meaning: 'The process of taking in food for health' }, { text: 'focus', meaning: 'Concentrated attention' }, { text: 'rest', meaning: 'A period of relaxation or sleep' }, { text: 'refresh', meaning: 'Make someone feel less tired' },
    ]},
  ],
  market: [
    { title: 'Shopping Basics', description: 'Common nouns in a store.', words: [
      { text: 'basket', meaning: 'Container used while shopping' }, { text: 'entrance', meaning: 'A way into a place' }, { text: 'apple', meaning: 'A sweet round fruit' }, { text: 'cabbage', meaning: 'A leafy green vegetable' }, { text: 'baguette', meaning: 'A long thin loaf of bread' },
      { text: 'yogurt', meaning: 'A dairy food made by fermentation' }, { text: 'chips', meaning: 'Thin crispy potato snack' }, { text: 'cashier', meaning: 'Person processing payment' }, { text: 'receipt', meaning: 'Proof of purchase' }, { text: 'checkout', meaning: 'Final payment point in a store' },
    ]},
    { title: 'Money & Quantity', description: 'Payment and amount vocabulary.', words: [
      { text: 'budget', meaning: 'Planned amount of money to spend' }, { text: 'discount', meaning: 'Reduction in price' }, { text: 'currency', meaning: 'System of money in use' }, { text: 'kilogram', meaning: 'A unit of weight equal to 1000 grams' }, { text: 'dozen', meaning: 'A group of twelve' },
      { text: 'barcode', meaning: 'Machine-readable code on products' }, { text: 'subtotal', meaning: 'Amount before extra charges' }, { text: 'total', meaning: 'Final amount after all calculations' }, { text: 'change', meaning: 'Money returned after payment' }, { text: 'invoice', meaning: 'Document listing goods and prices' },
    ]},
    { title: 'Customer Phrases', description: 'Useful verbs and interaction words.', words: [
      { text: 'compare', meaning: 'Examine differences or similarities' }, { text: 'select', meaning: 'Choose from available options' }, { text: 'queue', meaning: 'Line of people waiting' }, { text: 'confirm', meaning: 'Establish as true or correct' }, { text: 'recommend', meaning: 'Suggest as a good option' },
      { text: 'replace', meaning: 'Take the place of another item' }, { text: 'refund', meaning: 'Repayment for a returned purchase' }, { text: 'package', meaning: 'Wrap or box goods for handling' }, { text: 'deliver', meaning: 'Bring goods to destination' }, { text: 'satisfied', meaning: 'Content with what was received' },
    ]},
  ],
  campus: [
    { title: 'Academic Nouns', description: 'Foundational school vocabulary.', words: [
      { text: 'syllabus', meaning: 'Outline of a course and topics' }, { text: 'notice', meaning: 'Public announcement or information' }, { text: 'catalog', meaning: 'Organized list of resources' }, { text: 'journal', meaning: 'Academic periodical publication' }, { text: 'microscope', meaning: 'Instrument to view tiny objects' },
      { text: 'lecture', meaning: 'Instructional talk by a teacher' }, { text: 'cafeteria', meaning: 'Self-service dining area' }, { text: 'assignment', meaning: 'Task given to students' }, { text: 'teamwork', meaning: 'Collaborative group effort' }, { text: 'dormitory', meaning: 'Building where students live' },
    ]},
    { title: 'Study Verbs', description: 'Action words for learning.', words: [
      { text: 'register', meaning: 'Officially enroll in a class' }, { text: 'observe', meaning: 'Watch carefully for details' }, { text: 'borrow', meaning: 'Take and use temporarily' }, { text: 'summarize', meaning: 'State main points briefly' }, { text: 'experiment', meaning: 'Test ideas through procedure' },
      { text: 'debate', meaning: 'Discuss opposing views formally' }, { text: 'revise', meaning: 'Study again to improve understanding' }, { text: 'analyze', meaning: 'Examine in detail' }, { text: 'compete', meaning: 'Try to win against others' }, { text: 'graduate', meaning: 'Complete course of study' },
    ]},
    { title: 'Project Language', description: 'Words used in presentations and planning.', words: [
      { text: 'proposal', meaning: 'Formal suggestion or plan' }, { text: 'timeline', meaning: 'Schedule of events over time' }, { text: 'milestone', meaning: 'Important project checkpoint' }, { text: 'prototype', meaning: 'Early model for testing' }, { text: 'dataset', meaning: 'Collection of related data' },
      { text: 'citation', meaning: 'Reference to source material' }, { text: 'feedback', meaning: 'Responses for improvement' }, { text: 'iteration', meaning: 'Repeated cycle of refinement' }, { text: 'presentation', meaning: 'Talk given to an audience' }, { text: 'conclusion', meaning: 'Final result or judgment' },
    ]},
  ],
  travel: [
    { title: 'Airport Flow', description: 'Vocabulary from arrival to boarding.', words: [
      { text: 'passport', meaning: 'Official travel identification document' }, { text: 'checkin', meaning: 'Process of confirming travel details' }, { text: 'security', meaning: 'Safety screening area' }, { text: 'gate', meaning: 'Boarding area for a flight' }, { text: 'boarding', meaning: 'Entering a plane before departure' },
      { text: 'ticket', meaning: 'Document granting travel access' }, { text: 'luggage', meaning: 'Bags and suitcases for travel' }, { text: 'customs', meaning: 'Border control for goods and declarations' }, { text: 'arrival', meaning: 'Reaching destination' }, { text: 'terminal', meaning: 'Airport building for passengers' },
    ]},
    { title: 'City Navigation', description: 'Words for transport and movement.', words: [
      { text: 'transfer', meaning: 'Change from one transport to another' }, { text: 'shuttle', meaning: 'Vehicle running back and forth' }, { text: 'avenue', meaning: 'A broad city street' }, { text: 'landmark', meaning: 'Well-known place used for navigation' }, { text: 'intersection', meaning: 'Point where roads cross' },
      { text: 'fare', meaning: 'Price paid for transportation' }, { text: 'detour', meaning: 'Alternative route around blockage' }, { text: 'direction', meaning: 'Instruction on where to go' }, { text: 'map', meaning: 'Visual representation of locations' }, { text: 'destination', meaning: 'Final place of arrival' },
    ]},
    { title: 'Hotel & Safety', description: 'Hospitality and emergency terms.', words: [
      { text: 'reservation', meaning: 'Advance booking arrangement' }, { text: 'reception', meaning: 'Front desk area in a hotel' }, { text: 'keycard', meaning: 'Electronic card to unlock room' }, { text: 'amenities', meaning: 'Convenient facilities provided for guests' }, { text: 'housekeeping', meaning: 'Cleaning service for rooms' },
      { text: 'emergency', meaning: 'Serious urgent situation' }, { text: 'clinic', meaning: 'Place for medical treatment' }, { text: 'insurance', meaning: 'Financial protection against risk' }, { text: 'contact', meaning: 'Person to communicate with in need' }, { text: 'assistance', meaning: 'Help or support provided' },
    ]},
  ],
  nature: [
    { title: 'Landscape Terms', description: 'Descriptive words for outdoor environments.', words: [
      { text: 'valley', meaning: 'Low land between hills or mountains' }, { text: 'summit', meaning: 'Highest point of a hill or mountain' }, { text: 'meadow', meaning: 'Open field with grass and flowers' }, { text: 'stream', meaning: 'Small narrow river' }, { text: 'cliff', meaning: 'Steep rock face' },
      { text: 'waterfall', meaning: 'Water dropping from height' }, { text: 'ridge', meaning: 'Long narrow elevated landform' }, { text: 'canyon', meaning: 'Deep gorge with steep sides' }, { text: 'horizon', meaning: 'Line where earth and sky appear to meet' }, { text: 'canopy', meaning: 'Upper layer of tree branches' },
    ]},
    { title: 'Outdoor Actions', description: 'Verbs used in exploration and hiking.', words: [
      { text: 'hike', meaning: 'Walk long distance in nature' }, { text: 'climb', meaning: 'Go up using hands and feet' }, { text: 'navigate', meaning: 'Plan and follow a route' }, { text: 'observe', meaning: 'Watch carefully' }, { text: 'camp', meaning: 'Stay outdoors in temporary shelter' },
      { text: 'ignite', meaning: 'Set something on fire' }, { text: 'pack', meaning: 'Put items into a bag' }, { text: 'filter', meaning: 'Remove unwanted particles' }, { text: 'signal', meaning: 'Send information using signs or devices' }, { text: 'descend', meaning: 'Move downward' },
    ]},
    { title: 'Nature & Wellness', description: 'Mindfulness and environment vocabulary.', words: [
      { text: 'breathe', meaning: 'Take air into and out of lungs' }, { text: 'silence', meaning: 'Complete absence of sound' }, { text: 'sunrise', meaning: 'Time when sun appears in morning' }, { text: 'starlight', meaning: 'Light coming from stars' }, { text: 'ecosystem', meaning: 'Community of interacting organisms and environment' },
      { text: 'conserve', meaning: 'Protect from loss or waste' }, { text: 'restore', meaning: 'Bring back to good condition' }, { text: 'balance', meaning: 'State of stability and harmony' }, { text: 'gratitude', meaning: 'Feeling of thankfulness' }, { text: 'resilience', meaning: 'Ability to recover quickly from difficulty' },
    ]},
  ],
};
