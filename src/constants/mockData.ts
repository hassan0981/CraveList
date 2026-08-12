export interface Restaurant {
  id: string;
  name: string;
  category: string;
  priority: 'high' | 'normal';
  priceLevel: string;
  distance: string;
  distanceKm: number;
  address: string;
  image: string;
  saved: boolean;
  visited: boolean;
  savedDate?: string;
  visitedDate?: string;
  description: string;
  personalNote?: string;
  openingStatus: string;
  latitude: number;
  longitude: number;
  tags: string[];
  recommendedBy?: string;
}

export interface UserFriend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  mutualSaved: number;
  statusText: string;
  lastActive: string;
}

export interface DiningPlan {
  id: string;
  title: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  location: string;
  participants: { name: string; avatar: string }[];
  status: 'upcoming' | 'completed' | 'canceled';
  note?: string;
}

export interface Memory {
  id: string;
  restaurantId: string;
  restaurantName: string;
  category: string;
  date: string;
  satisfactionTag: string;
  photo: string;
  personalNote: string;
  location: string;
}

export interface NotificationItem {
  id: string;
  type: 'proximity' | 'friend_save' | 'plan_invite' | 'memory_reminder';
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  targetId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  sharedRestaurant?: Restaurant;
}

export const mockCurrentUser = {
  id: 'user_me',
  name: 'Alexander Wright',
  username: '@alexwright',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Chasing subterranean speakeasies, artisan espresso & slow-cooked ramen.',
  stats: {
    savedPlaces: 12,
    highPriority: 4,
    visitedPlaces: 8,
    memories: 6,
    friends: 18,
  },
};

export const mockRestaurants: Restaurant[] = [
  {
    id: 'rest_1',
    name: 'Osteria Del Corso',
    category: 'Italian & Natural Wine',
    priority: 'high',
    priceLevel: '$$$',
    distance: '250m away',
    distanceKm: 0.25,
    address: '428 Via Garibaldi, Downtown',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    saved: true,
    visited: true,
    savedDate: 'May 12',
    visitedDate: 'June 04',
    description: 'Hand-rolled pici pasta, dry-aged Bistecca, and obscure organic Tuscan wines in a warm stone cellar.',
    personalNote: 'Found this on Instagram reels. Need to try the cacio e pepe and ask for Lorenzo’s private cellar reserve.',
    openingStatus: 'Open now • Closes 11 PM',
    latitude: 37.7749,
    longitude: -122.4194,
    tags: ['Pasta', 'Romantic', 'Natural Wine'],
    recommendedBy: 'Sophia Chen',
  },
  {
    id: 'rest_2',
    name: 'Kuro Artisan Ramen',
    category: 'Japanese Tonkotsu',
    priority: 'high',
    priceLevel: '$$',
    distance: '600m away',
    distanceKm: 0.6,
    address: '89 North Market St',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
    saved: true,
    visited: false,
    savedDate: 'June 20',
    description: '24-hour simmered pork bone broth with hand-crafted alkalized noodles and spicy black garlic oil.',
    personalNote: 'Marcus recommended this for late-night ramen cravings. Order extra chashu pork belly.',
    openingStatus: 'Open now • Closes 10:30 PM',
    latitude: 37.778,
    longitude: -122.415,
    tags: ['Ramen', 'Cozy', 'Late Night'],
    recommendedBy: 'Marcus Vance',
  },
  {
    id: 'rest_3',
    name: 'L’Atelier du Pain',
    category: 'French Bakery & Bistro',
    priority: 'normal',
    priceLevel: '$$',
    distance: '1.2 km away',
    distanceKm: 1.2,
    address: '154 Saint-Germain Ave',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    saved: true,
    visited: true,
    savedDate: 'April 02',
    visitedDate: 'April 15',
    description: 'Artisanal sourdough, butter laminations, cardamom buns, and single-origin pour-over coffees.',
    personalNote: 'Weekend morning coffee & croissant spot. Arrive early before 9:30 AM.',
    openingStatus: 'Opens tomorrow at 7:00 AM',
    latitude: 37.771,
    longitude: -122.425,
    tags: ['Breakfast', 'Pastry', 'Coffee'],
  },
  {
    id: 'rest_4',
    name: 'Noche Mezcaleria',
    category: 'Oaxacan Tacos & Mezcal',
    priority: 'high',
    priceLevel: '$$$',
    distance: '850m away',
    distanceKm: 0.85,
    address: '77 Calle del Sol',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    saved: true,
    visited: false,
    savedDate: 'July 10',
    description: 'Heirloom masa tortillas made to order, birria de chivo, and small-batch ancestral mezcals.',
    personalNote: 'Great patio seating at sundown for Friday drinks with Elena.',
    openingStatus: 'Open now • Closes 1:00 AM',
    latitude: 37.78,
    longitude: -122.41,
    tags: ['Tacos', 'Cocktails', 'Vibrant'],
    recommendedBy: 'Elena Rostova',
  },
  {
    id: 'rest_5',
    name: 'Le Feu Woodfire',
    category: 'Modern Steakhouse & Hearth',
    priority: 'normal',
    priceLevel: '$$$$',
    distance: '2.4 km away',
    distanceKm: 2.4,
    address: '302 Grand Promenade',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    saved: false,
    visited: true,
    visitedDate: 'May 30',
    description: 'Oak-charred prime steaks, roasted bone marrow, and seasonal root vegetables roasted over open fire.',
    personalNote: 'Special celebration spot. Smoked old fashioned was top tier.',
    openingStatus: 'Open now • Closes 11:00 PM',
    latitude: 37.765,
    longitude: -122.43,
    tags: ['Steakhouse', 'Fine Dining', 'Hearth'],
  },
];

export const mockFriends: UserFriend[] = [
  {
    id: 'friend_1',
    name: 'Sophia Chen',
    username: '@sophiac',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    bio: 'Food traveler. Always searching for authentic stone-oven pizza & natural wine.',
    mutualSaved: 6,
    statusText: 'Saved Osteria Del Corso to her trail',
    lastActive: '10m ago',
  },
  {
    id: 'friend_2',
    name: 'Marcus Vance',
    username: '@marcus_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Single-origin coffee & late-night ramen fanatic.',
    mutualSaved: 4,
    statusText: 'Checked in at Kuro Ramen',
    lastActive: '2h ago',
  },
  {
    id: 'friend_3',
    name: 'Elena Rostova',
    username: '@elena_r',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    bio: 'Taco enthusiast & cocktail storyteller.',
    mutualSaved: 8,
    statusText: 'Created a plan for Friday Mezcal',
    lastActive: '1d ago',
  },
];

export const mockPlans: DiningPlan[] = [
  {
    id: 'plan_1',
    title: 'Friday Mezcal & Tacos',
    restaurantId: 'rest_4',
    restaurantName: 'Noche Mezcaleria',
    date: 'Friday, Aug 14',
    time: '8:30 PM',
    location: '77 Calle del Sol',
    participants: [
      { name: 'Alexander', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
      { name: 'Elena', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
      { name: 'Sophia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
    ],
    status: 'upcoming',
    note: 'Table reserved under Alexander. Arrive 10 mins early for patio drinks!',
  },
  {
    id: 'plan_2',
    title: 'Weekend Pastry & Pour-over',
    restaurantId: 'rest_3',
    restaurantName: 'L’Atelier du Pain',
    date: 'Sunday, Aug 16',
    time: '10:00 AM',
    location: '154 Saint-Germain Ave',
    participants: [
      { name: 'Alexander', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
      { name: 'Marcus', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
    ],
    status: 'upcoming',
    note: 'Grabbing fresh cardamom buns right when they open!',
  },
];

export const mockMemories: Memory[] = [
  {
    id: 'mem_1',
    restaurantId: 'rest_1',
    restaurantName: 'Osteria Del Corso',
    category: 'Italian & Natural Wine',
    date: 'June 04',
    satisfactionTag: 'Unforgettable Ambiance',
    photo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    personalNote: 'Candlelit evening in the stone cellar. The hand-rolled pici was cooked to al dente perfection with Chianti.',
    location: 'Downtown',
  },
  {
    id: 'mem_2',
    restaurantId: 'rest_3',
    restaurantName: 'L’Atelier du Pain',
    category: 'French Bakery',
    date: 'April 15',
    satisfactionTag: 'Exceptional Pastries',
    photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    personalNote: 'Crisp golden layers on the almond croissant. Paired with Ethiopia Yirgacheffe pour over.',
    location: 'Saint-Germain',
  },
];

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'proximity',
    title: 'Nearby Craving Alert!',
    subtitle: "You're only 250m away from Osteria Del Corso.",
    time: '5m ago',
    read: false,
    targetId: 'rest_1',
  },
  {
    id: 'notif_2',
    type: 'friend_save',
    title: 'Sophia saved a spot',
    subtitle: 'Sophia Chen added Noche Mezcaleria to her cravings.',
    time: '1h ago',
    read: false,
    targetId: 'rest_4',
  },
  {
    id: 'notif_3',
    type: 'plan_invite',
    title: 'New Dining Plan Invitation',
    subtitle: 'Elena invited you to "Friday Mezcal & Tacos".',
    time: '3h ago',
    read: true,
    targetId: 'plan_1',
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg_1',
    senderId: 'friend_1',
    senderName: 'Sophia Chen',
    text: 'Hey Alex! Did you check out that Italian place in Downtown yet?',
    timestamp: '2:15 PM',
    isMe: false,
  },
  {
    id: 'msg_2',
    senderId: 'user_me',
    senderName: 'Alexander Wright',
    text: 'Osteria Del Corso? Yes! Went last week, the hand-rolled pici was mindblowing.',
    timestamp: '2:18 PM',
    isMe: true,
  },
  {
    id: 'msg_3',
    senderId: 'friend_1',
    senderName: 'Sophia Chen',
    text: 'Awesome! I saved it to my craving trail too. Let’s do a group dinner there soon.',
    timestamp: '2:20 PM',
    isMe: false,
  },
];
