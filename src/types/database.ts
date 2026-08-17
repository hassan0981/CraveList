/**
 * Database definitions matching Supabase PostgreSQL tables:
 * - profiles
 * - restaurants
 * - saved_places
 * - visits
 * - friend_requests
 * - friendships
 * - shared_cravings
 * - messages
 */

export interface ProfileRow {
  id: string; // Primary key, references auth.users.id
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RestaurantRow {
  id: string;
  name: string;
  category: string;
  address?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface SavedPlaceRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  category?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
  restaurant?: RestaurantRow;
}

export interface VisitRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  saved_place_id?: string | null;
  note?: string | null;
  photo_url?: string | null;
  visited_at?: string | null;
  created_at?: string;
  restaurant?: RestaurantRow;
}

export interface FriendRequestRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
  updated_at?: string;
  requester_profile?: ProfileRow;
  addressee_profile?: ProfileRow;
}

export interface FriendshipRow {
  id: string;
  user_id: string;
  friend_id: string;
  created_at?: string;
  friend_profile?: ProfileRow;
}

export interface SharedCravingRow {
  id: string;
  saved_place_id?: string | null;
  shared_by: string;
  shared_with: string;
  created_at?: string;
  saved_place?: SavedPlaceRow;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  is_read?: boolean;
  created_at?: string;
  sender_profile?: ProfileRow;
  receiver_profile?: ProfileRow;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: 'friend_request' | 'plan_invite' | 'plan_update' | 'proximity' | 'friend_save';
  title: string;
  body?: string | null;
  reference_id?: string | null;
  is_read?: boolean;
  created_at?: string;
}

export interface PlanMemberRow {
  id: string;
  plan_id: string;
  user_id: string;
  rsvp_status: 'pending' | 'accepted' | 'declined';
  created_at?: string;
  user_profile?: ProfileRow;
}

export interface PlanRow {
  id: string;
  creator_id: string;
  restaurant_id?: string | null;
  title: string;
  description?: string | null;
  planned_at?: string | null;
  status?: 'upcoming' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  creator_profile?: ProfileRow;
  restaurant?: RestaurantRow;
  members?: PlanMemberRow[];
}
