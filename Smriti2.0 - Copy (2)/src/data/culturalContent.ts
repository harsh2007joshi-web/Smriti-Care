import { MemoryWeaveCard, RoutineStep, SoundItem, MarketItem, LandmarkNode, GameMetadata } from '../types/games.types';

export const ALL_GAMES_METADATA: GameMetadata[] = [
  {
    id: 'memory-weave',
    title: 'Memory Weave',
    subtitle: 'Threads of My Life',
    shortDesc: 'Connect memories and familiar things.',
    iconName: 'Sparkles',
    category: 'Memory',
    route: '/games/memory-weave',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
    themeColor: '#d97706',
    recommendedTime: '3-5 mins',
  },
  {
    id: 'daily-routine',
    title: 'Daily Routine Builder',
    subtitle: 'What Comes Next?',
    shortDesc: 'Organize comforting daily habits step by step.',
    iconName: 'CalendarCheck',
    category: 'Routine',
    route: '/games/daily-routine',
    color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    themeColor: '#059669',
    recommendedTime: '3-4 mins',
  },
  {
    id: 'sensory-soundscape',
    title: 'Sensory Soundscape',
    subtitle: 'Sound Tracker',
    shortDesc: 'Listen to calming nature and familiar home sounds.',
    iconName: 'Volume2',
    category: 'Sensory',
    route: '/games/sensory-soundscape',
    color: 'bg-sky-100 text-sky-900 border-sky-300',
    themeColor: '#0284c7',
    recommendedTime: '2-4 mins',
  },
  {
    id: 'rhythm-weaver',
    title: 'Rhythm Weaver',
    subtitle: 'Rhythm Together',
    shortDesc: 'Tap gently along with peaceful, steady beats.',
    iconName: 'Music',
    category: 'Rhythm',
    route: '/games/rhythm-weaver',
    color: 'bg-purple-100 text-purple-900 border-purple-300',
    themeColor: '#7c3aed',
    recommendedTime: '2-3 mins',
  },
  {
    id: 'dual-task',
    title: 'Dual-Task Journey',
    subtitle: 'Think & Tap',
    shortDesc: 'Follow a scenic road and tap when the bell rings.',
    iconName: 'Footprints',
    category: 'Coordination',
    route: '/games/dual-task',
    color: 'bg-rose-100 text-rose-900 border-rose-300',
    themeColor: '#e11d48',
    recommendedTime: '3-5 mins',
  },
  {
    id: 'living-market',
    title: 'Living Market Mission',
    subtitle: 'Weekly Bazaar Memory',
    shortDesc: 'Remember fresh groceries and shop at the village market.',
    iconName: 'ShoppingBag',
    category: 'Memory',
    route: '/games/living-market',
    color: 'bg-orange-100 text-orange-900 border-orange-300',
    themeColor: '#ea580c',
    recommendedTime: '4-6 mins',
  },
  {
    id: 'landmark-pathfinder',
    title: 'Landmark Pathfinder',
    subtitle: 'North-East Explorer',
    shortDesc: 'Find the peaceful way to North Eastern landmarks.',
    iconName: 'Compass',
    category: 'Orientation',
    route: '/games/landmark-pathfinder',
    color: 'bg-teal-100 text-teal-900 border-teal-300',
    themeColor: '#0d9488',
    recommendedTime: '3-5 mins',
  },
  {
    id: 'cognitive-test',
    title: 'Cognitive Mini-Test',
    subtitle: 'Gentle Orientation Check',
    shortDesc: 'A short, comforting day and memory reflection.',
    iconName: 'CheckCircle2',
    category: 'Orientation',
    route: '/games/cognitive-test',
    color: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    themeColor: '#4f46e5',
    recommendedTime: '3-4 mins',
  },
];

// Cultural items for Memory Weave
export const MEMORY_WEAVE_GROUPS: {
  groupId: string;
  theme: string;
  instruction: string;
  cards: MemoryWeaveCard[];
}[] = [
  {
    groupId: 'assam_morning',
    theme: 'Morning Tea & Hearth',
    instruction: 'Which two memories belong to the morning tea gathering?',
    cards: [
      { id: 'c1', title: 'Grandmother', category: 'Person', imageOrEmoji: '👵', matchGroup: 'assam_morning', description: 'Brewing fresh morning tea with warm spices' },
      { id: 'c2', title: 'Clay Hearth & Teapot', category: 'Object', imageOrEmoji: '🫖', matchGroup: 'assam_morning', description: 'Warm earthen teapot with fresh Assam CTC leaves' },
      { id: 'c3', title: 'Evening Bihu Drum', category: 'Event', imageOrEmoji: '🥁', matchGroup: 'bihu_fest', description: 'Dhol playing for the springtime festival' },
      { id: 'c4', title: 'Kaziranga Forest', category: 'Place', imageOrEmoji: '🦏', matchGroup: 'kaziranga', description: 'Green tall elephant grass sanctuary' },
    ],
  },
  {
    groupId: 'garden_flowers',
    theme: 'Spring Garden & Flowers',
    instruction: 'Which two belong to planting flowers in the peaceful garden?',
    cards: [
      { id: 'g1', title: 'Granddaughter Priya', category: 'Person', imageOrEmoji: '👧', matchGroup: 'garden_flowers', description: 'Watering the seedlings with a smile' },
      { id: 'g2', title: 'Brass Water Can', category: 'Object', imageOrEmoji: '🚿', matchGroup: 'garden_flowers', description: 'Gentle sprinkling can for blooming flowers' },
      { id: 'g3', title: 'Village Bicycle', category: 'Object', imageOrEmoji: '🚲', matchGroup: 'travel', description: 'Riding down the hill road' },
      { id: 'g4', title: 'Market Bell', category: 'Object', imageOrEmoji: '🔔', matchGroup: 'bazaar', description: 'Ringing at the bazaar entrance' },
    ],
  },
  {
    groupId: 'weaving_loom',
    theme: 'Traditional Handloom',
    instruction: 'Which two belong to the handloom craft?',
    cards: [
      { id: 'w1', title: 'Muga Silk Thread', category: 'Object', imageOrEmoji: '🧵', matchGroup: 'weaving_loom', description: 'Golden Assam silk ready for weaving' },
      { id: 'w2', title: 'Wooden Handloom (Tat)', category: 'Object', imageOrEmoji: '🪵', matchGroup: 'weaving_loom', description: 'Rhythmic wooden loom on the veranda' },
      { id: 'w3', title: 'River Ferry Boat', category: 'Object', imageOrEmoji: '⛵', matchGroup: 'river_boat', description: 'Cruising across the Brahmaputra' },
      { id: 'w4', title: 'Winter Jacket', category: 'Object', imageOrEmoji: '🧥', matchGroup: 'winter', description: 'Warm woolen coat for mountain fog' },
    ],
  },
];

// Daily Routine Steps
export const ROUTINE_SETS: {
  id: string;
  name: string;
  description: string;
  steps: RoutineStep[];
}[] = [
  {
    id: 'morning_routine',
    name: 'Morning Routine',
    description: 'Starting a peaceful, healthy morning',
    steps: [
      { id: 'm1', order: 1, title: 'Wash Hands & Face', description: 'Gentle warm water to wake up freshened', iconName: 'Sparkles', illustration: '💧' },
      { id: 'm2', order: 2, title: 'Warm Morning Tea', description: 'Sip comforting herbal or ginger tea', iconName: 'Coffee', illustration: '☕' },
      { id: 'm3', order: 3, title: 'Gentle Garden Walk', description: 'Breathe clean morning air outside', iconName: 'Sun', illustration: '🌿' },
      { id: 'm4', order: 4, title: 'Healthy Breakfast', description: 'Enjoy warm nourishing breakfast', iconName: 'Utensils', illustration: '🥣' },
    ],
  },
  {
    id: 'cooking_routine',
    name: 'Preparing A Family Meal',
    description: 'Cooking a comforting home meal step-by-step',
    steps: [
      { id: 'k1', order: 1, title: 'Wash Clean Hands', description: 'Always clean hands first before cooking', iconName: 'ShieldCheck', illustration: '🧼' },
      { id: 'k2', order: 2, title: 'Prepare Fresh Veggies', description: 'Peel potatoes, ginger and greens', iconName: 'Carrot', illustration: '🥕' },
      { id: 'k3', order: 3, title: 'Gentle Simmer on Pot', description: 'Cook spices and broth with calm care', iconName: 'Flame', illustration: '🍲' },
      { id: 'k4', order: 4, title: 'Serve Warm to Family', description: 'Share food with loved ones at the table', iconName: 'Heart', illustration: '🍽️' },
    ],
  },
];

// Sensory Sounds
export const SENSORY_SOUNDS: SoundItem[] = [
  {
    id: 'rain_sound',
    title: 'Gentle Hill Rain',
    category: 'Nature',
    soundType: 'rain',
    icon: '🌧️',
    correctDescription: 'Gentle Rain Falling on Bamboo Leaves',
    distractors: ['Car Honk', 'Alarm Clock'],
  },
  {
    id: 'birds_sound',
    title: 'Morning Songbirds',
    category: 'Nature',
    soundType: 'birds',
    icon: '🐦',
    correctDescription: 'Sweet Morning Songbirds in the Garden',
    distractors: ['Loud Siren', 'Typing Keyboard'],
  },
  {
    id: 'water_sound',
    title: 'Flowing River Stream',
    category: 'Nature',
    soundType: 'water',
    icon: '🌊',
    correctDescription: 'Calm Flowing Brahmaputra River Water',
    distractors: ['Thunder Clatter', 'Factory Hammer'],
  },
  {
    id: 'doorbell_sound',
    title: 'Friendly Home Chime',
    category: 'Home',
    soundType: 'doorbell',
    icon: '🔔',
    correctDescription: 'Warm Doorbell Chime welcoming a guest',
    distractors: ['Rain Storm', 'Traffic Noise'],
  },
  {
    id: 'train_sound',
    title: 'Mountain Toy Train',
    category: 'Journey',
    soundType: 'train',
    icon: '🚂',
    correctDescription: 'Peaceful Mountain Train Whistle in the Hills',
    distractors: ['Drum Roll', 'Airplane Jet'],
  },
];

// Living Market Items
export const MARKET_STALL_ITEMS: MarketItem[] = [
  { id: 'mk1', name: 'Fresh Assam Tea Leaves', category: 'Pantry', icon: '🍃', inStock: false, alternative: 'Local Green Tea', altIcon: '🍵', price: 30 },
  { id: 'mk2', name: 'Fresh Sweet Oranges', category: 'Fruits', icon: '🍊', inStock: true, alternative: 'Wild Hill Berries', altIcon: '🫐', price: 40 },
  { id: 'mk3', name: 'Hill Red Rice', category: 'Grains', icon: '🌾', inStock: true, alternative: 'Assam Joha Rice', altIcon: '🍚', price: 50 },
  { id: 'mk4', name: 'Fresh Ginger Root', category: 'Vegetables', icon: '🫚', inStock: true, alternative: 'Fresh Garlic Cloves', altIcon: '🧄', price: 20 },
  { id: 'mk5', name: 'Pure Local Honey', category: 'Sweet', icon: '🍯', inStock: true, alternative: 'Organic Palm Jaggery', altIcon: '🪵', price: 60 },
  { id: 'mk6', name: 'Bamboo Shoots', category: 'Vegetables', icon: '🎍', inStock: false, alternative: 'Fresh Green Beans', altIcon: '🫛', price: 35 },
  { id: 'mk7', name: 'Fresh Milk', category: 'Dairy', icon: '🥛', inStock: true, alternative: 'Fresh Curd (Dahi)', altIcon: '🥣', price: 25 },
  { id: 'mk8', name: 'Red Apples', category: 'Fruits', icon: '🍎', inStock: true, alternative: 'Ripe Pears', altIcon: '🍐', price: 45 },
  { id: 'mk9', name: 'Turmeric Powder', category: 'Spices', icon: '🟡', inStock: true, alternative: 'Coriander Powder', altIcon: '🌿', price: 20 },
  { id: 'mk10', name: 'Black Pepper Seeds', category: 'Spices', icon: '⚫', inStock: true, alternative: 'Green Cardamom', altIcon: '🟢', price: 25 },
  { id: 'mk11', name: 'Mustard Greens (Lai Xaak)', category: 'Vegetables', icon: '🥬', inStock: true, alternative: 'Spinach Leaves (Paleng)', altIcon: '🌱', price: 30 },
  { id: 'mk12', name: 'Ripe Yellow Bananas', category: 'Fruits', icon: '🍌', inStock: true, alternative: 'Sweet Papaya', altIcon: '🥭', price: 30 },
];

// Landmark Pathfinder Nodes (North East Map)
export const NER_LANDMARKS: LandmarkNode[] = [
  { id: 'lm1', name: 'Guwahati Gate', state: 'Assam', description: 'Gateway by the Brahmaputra River', x: 20, y: 50, icon: '🏛️' },
  { id: 'lm2', name: 'Majuli Island', state: 'Assam', description: 'Serene world largest river island with Satras', x: 45, y: 35, icon: '🏝️' },
  { id: 'lm3', name: 'Kaziranga Forest', state: 'Assam', description: 'Home to the one-horned rhino and lush meadows', x: 40, y: 60, icon: '🦏' },
  { id: 'lm4', name: 'Cherrapunji Hills', state: 'Meghalaya', description: 'Living root bridges and cascading misty waterfalls', x: 25, y: 75, icon: '🌿' },
  { id: 'lm5', name: 'Loktak Lake', state: 'Manipur', description: 'Floating Phumdis and peaceful blue waters', x: 65, y: 75, icon: '🚣' },
  { id: 'lm6', name: 'Tawang Monastery', state: 'Arunachal Pradesh', description: 'Peaceful snow-crowned monastery in the mountains', x: 30, y: 20, icon: '🏔️' },
];
