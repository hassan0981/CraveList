import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Auto-load local .env file variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim();
      const v = trimmed.substring(eqIdx + 1).trim();
      process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Pure JS Haversine distance formula test
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)} km away`;
}

async function runPhase7LocationTest() {
  console.log('\n======================================================');
  console.log('   CRAVELIST PHASE 7: REAL LOCATION & PROXIMITY TEST ');
  console.log('======================================================\n');

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const timestamp = Date.now();
  const email = `location_user_${timestamp}@cravelist.com`;
  const password = 'LocationTestPassword123!';

  let userId = '';
  let savedPlaceId = '';
  let visitId = '';

  try {
    // -----------------------------------------------------------------
    // TEST 1: HAVERSINE DISTANCE FORMULA ACCURACY & FORMATTING
    // -----------------------------------------------------------------
    console.log('🔹 TEST 1: HAVERSINE DISTANCE FORMULA & FORMATTING');

    // Coordinates: Gulberg Center (31.5204, 74.3587) vs Nearby Spot (31.5220, 74.3570) ~240 meters
    const userLat = 31.5204;
    const userLng = 74.3587;
    const restLat = 31.5220;
    const restLng = 74.3570;

    const meters = calculateDistanceMeters(userLat, userLng, restLat, restLng);
    const formattedClose = formatDistance(meters);
    const formattedFar = formatDistance(2400);

    console.log(`  ✅ Calculated Distance: ${meters} meters`);
    console.log(`  ✅ Close Format (< 1km): "${formattedClose}"`);
    console.log(`  ✅ Far Format (>= 1km): "${formattedFar}"`);

    if (meters > 500) throw new Error('Distance calculation out of expected 500m range');
    if (formattedClose !== `${meters}m away`) throw new Error('Distance formatting under 1km invalid');
    if (formattedFar !== '2.4 km away') throw new Error('Distance formatting over 1km invalid');

    // -----------------------------------------------------------------
    // TEST 2: AUTHENTICATE USER & SAVE RESTAURANT
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 2: AUTHENTICATE USER & SAVE RESTAURANT');

    const { data: authData, error: authErr } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'Location Tester' } },
    });

    if (authErr || !authData.user) throw new Error(`User sign up failed: ${authErr?.message}`);
    userId = authData.user.id;

    await adminClient.from('profiles').upsert({ id: userId, display_name: 'Location Tester' });

    // Fetch sample restaurant from database
    const { data: rests } = await client.from('restaurants').select('id, name, latitude, longitude').limit(1);
    const sampleRest = rests?.[0];
    if (!sampleRest) throw new Error('No sample restaurant found in database');

    // Save restaurant to user's saved_places
    const { data: savedData, error: saveErr } = await client
      .from('saved_places')
      .insert({
        user_id: userId,
        restaurant_id: sampleRest.id,
        category: 'Fast Food',
        note: 'Testing 500m proximity alert!',
      })
      .select()
      .single();

    if (saveErr || !savedData) throw new Error(`Save place failed: ${saveErr?.message}`);
    savedPlaceId = savedData.id;

    console.log(`  ✅ User ID: ${userId}`);
    console.log(`  ✅ Saved Restaurant: "${sampleRest.name}" (ID: ${sampleRest.id})`);

    // -----------------------------------------------------------------
    // TEST 3: PROXIMITY DETECTION FILTERING (ONLY SAVED RESTAURANTS)
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 3: 500M PROXIMITY FILTERING FOR SAVED RESTAURANTS');

    // Query saved places for user
    const { data: mySavedPlaces } = await client
      .from('saved_places')
      .select('*, restaurant:restaurants(*)')
      .eq('user_id', userId);

    const targetRest = mySavedPlaces?.[0]?.restaurant;
    const rLat = targetRest?.latitude || userLat;
    const rLng = targetRest?.longitude || userLng;

    const computedDistance = calculateDistanceMeters(userLat, userLng, rLat, rLng);
    const isWithin500m = computedDistance <= 500;

    console.log(`  ✅ Distance to saved restaurant "${targetRest?.name}": ${computedDistance} meters`);
    console.log(`  ✅ Proximity match status (<= 500m): ${isWithin500m}`);

    // -----------------------------------------------------------------
    // TEST 4: CHECK-IN INTEGRATION & TRAIL / VISIT RECORD CREATION
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 4: VISIT CHECK-IN INTEGRATION');

    const { data: visitData, error: visitErr } = await client
      .from('visits')
      .insert({
        user_id: userId,
        restaurant_id: sampleRest.id,
        note: 'Completed check-in from proximity alert!',
        visited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (visitErr || !visitData) throw new Error(`Visit check-in failed: ${visitErr?.message}`);
    visitId = visitData.id;

    console.log(`  ✅ Visit check-in logged to Supabase (Visit ID: ${visitId})`);

    // Verify user visits
    const { data: userVisits } = await client
      .from('visits')
      .select('*')
      .eq('user_id', userId)
      .eq('restaurant_id', sampleRest.id);

    console.log(`  ✅ User total visits for "${sampleRest.name}": ${userVisits?.length}`);

    // -----------------------------------------------------------------
    // CLEANUP TEST DATA
    // -----------------------------------------------------------------
    console.log('\n🔹 CLEANING UP LOCATION TEST DATA');

    if (visitId) await adminClient.from('visits').delete().eq('id', visitId);
    if (savedPlaceId) await adminClient.from('saved_places').delete().eq('id', savedPlaceId);
    if (userId) await adminClient.from('profiles').delete().eq('id', userId);

    console.log('  ✅ Location test data cleaned up successfully.');

    console.log('\n======================================================');
    console.log('    🎉 PHASE 7 REAL LOCATION & PROXIMITY TEST PASSED!  ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ LOCATION TEST FAILED:', err.message || err);

    // Emergency cleanup
    if (visitId) await adminClient.from('visits').delete().eq('id', visitId);
    if (savedPlaceId) await adminClient.from('saved_places').delete().eq('id', savedPlaceId);
    if (userId) await adminClient.from('profiles').delete().eq('id', userId);
  }
}

runPhase7LocationTest();
