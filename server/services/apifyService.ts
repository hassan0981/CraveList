import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_wUArjkkP6oyvmCqEuk_tBw_0yfJgm1C';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface NormalizedRestaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  image_url: string;
  latitude: number;
  longitude: number;
}

function simpleHash128(str: string): string {
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0, h3 = 0xfae9212f ^ 0, h4 = 0x933b9340 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 3812015801);
    h4 = Math.imul(h4 ^ ch, 3349156649);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4);
}

/**
 * Generate a deterministic UUID v4 string from any text seed.
 */
function stringToUUID(str: string): string {
  const hash = simpleHash128(str);
  return (
    hash.substring(0, 8) +
    '-' +
    hash.substring(8, 12) +
    '-4' +
    hash.substring(13, 16) +
    '-a' +
    hash.substring(17, 20) +
    '-' +
    hash.substring(20, 32)
  );
}

/**
 * Server-side Apify Fallback Service.
 * Executed only when a restaurant is not found in Supabase database.
 */
export const apifyService = {
  /**
   * Search Google Maps via Apify Actor for places in Lahore.
   */
  async searchGoogleMaps(query: string): Promise<NormalizedRestaurant | null> {
    const apiToken = process.env.APIFY_API_TOKEN;
    const actorId = process.env.APIFY_ACTOR_ID || 'theguide/google-maps-scraper';

    if (!apiToken) {
      console.warn('[apifyService] APIFY_API_TOKEN environment variable is missing.');
      return null;
    }

    const searchQuery = query.toLowerCase().includes('lahore') ? query : `${query} Lahore`;

    console.log(`[apifyService] 🔍 Calling Apify fallback for query: "${searchQuery}"...`);

    try {
      const actorEndpoint = `https://api.apify.com/v2/acts/${actorId.replace('/', '~')}/run-sync-get-dataset-items?token=${apiToken}`;

      const payload = {
        query: searchQuery,
        maxResults: 1,
        language: 'en',
        skipClosedPlaces: false,
        onlyPlacesWithWebsites: false,
        extractEmails: false,
        maxReviews: 0,
        extractImages: false,
        extractAdditionalInfo: false,
        extractPopularTimes: false,
        maximumLeadsEnrichmentRecords: 0,
      };

      const response = await fetch(actorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[apifyService] Apify request failed with status: ${response.status}`);
        return null;
      }

      const items = await response.json();

      if (!Array.isArray(items) || items.length === 0) {
        console.log(`[apifyService] Apify returned 0 items for query: "${searchQuery}"`);
        return null;
      }

      const item = items[0];
      const name = (item.title || item.name || query).trim();
      const category = item.categoryName || item.category || 'Dining & Restaurant';
      const address = item.address || `${name}, Lahore, Pakistan`;
      const lat = parseFloat(item.location?.lat || item.latitude || 31.5204);
      const lng = parseFloat(item.location?.lng || item.longitude || 74.3587);

      const placeSeed = `apify_${item.placeId || item.id || name}_${lat}_${lng}`;
      const uuid = stringToUUID(placeSeed);

      const normalized: NormalizedRestaurant = {
        id: uuid,
        name,
        category,
        address,
        image_url: item.imageUrl || item.image || item.mainImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        latitude: lat,
        longitude: lng,
      };

      // STEP 7: Check Supabase AGAIN before inserting to prevent race-condition duplicates
      const { data: existing } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', uuid)
        .maybeSingle();

      if (existing) {
        console.log(`[apifyService] Restaurant already exists in Supabase: "${name}"`);
        return existing as NormalizedRestaurant;
      }

      // STEP 8: Insert newly discovered restaurant into Supabase
      console.log(`[apifyService] 📥 Inserting newly discovered restaurant into Supabase: "${name}"`);
      const { data: inserted, error: insertError } = await supabase
        .from('restaurants')
        .insert(normalized)
        .select()
        .single();

      if (insertError) {
        console.error('[apifyService] Error inserting Apify restaurant:', insertError.message);
        return normalized;
      }

      return inserted as NormalizedRestaurant;
    } catch (err) {
      console.error('[apifyService] Unexpected error during Apify fallback:', err);
      return null;
    }
  },
};
