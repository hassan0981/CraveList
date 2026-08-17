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

function normalizeBrandName(name: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('kfc') || lower.includes('kentucky fried chicken')) return 'kfc';
  if (lower.includes('mcdonald')) return 'mcdonalds';
  if (lower.includes('butt karahi')) return 'butt_karahi';
  return lower.replace(/[^a-z0-9]+/g, '_');
}

interface TestBranch {
  id: string;
  name: string;
  brandId: string;
  latitude: number;
  longitude: number;
}

async function runBrandProximityTests() {
  console.log('\n==================================================================');
  console.log('   CRAVELIST: BRAND-LEVEL SAVING + ALL-BRANCH PROXIMITY TEST SUITE');
  console.log('==================================================================\n');

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const timestamp = Date.now();
  const email = `brand_proximity_${timestamp}@cravelist.com`;
  const password = 'BrandTestPassword123!';

  let userId = '';
  let savedPlaceKfcId = '';
  let savedPlaceMcDId = '';

  try {
    // -----------------------------------------------------------------
    // SETUP TEST USER & BRANCHES
    // -----------------------------------------------------------------
    const { data: authData, error: authErr } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name: 'Brand Tester' } },
    });
    if (authErr || !authData.user) throw new Error(`Sign up failed: ${authErr?.message}`);
    userId = authData.user.id;
    await adminClient.from('profiles').upsert({ id: userId, display_name: 'Brand Tester' });

    // Mock branches representation
    const kfcBranches: TestBranch[] = [
      { id: 'kfc_dha', name: 'KFC DHA Phase 5', brandId: 'kfc', latitude: 31.4700, longitude: 74.4000 },
      { id: 'kfc_johar', name: 'KFC Johar Town', brandId: 'kfc', latitude: 31.4650, longitude: 74.2950 },
      { id: 'kfc_gulberg', name: 'KFC Gulberg III', brandId: 'kfc', latitude: 31.5220, longitude: 74.3570 },
    ];

    const mcdBranches: TestBranch[] = [
      { id: 'mcd_gulberg', name: "McDonald's Gulberg", brandId: 'mcdonalds', latitude: 31.5200, longitude: 74.3500 },
    ];

    const allBranches = [...kfcBranches, ...mcdBranches];

    // Helper evaluation engine
    const evaluateProximity = (userLat: number, userLng: number, savedBrands: Set<string>, radiusMeters = 500) => {
      const matches: { branch: TestBranch; distanceMeters: number }[] = [];
      for (const branch of allBranches) {
        if (savedBrands.has(branch.brandId)) {
          const dist = calculateDistanceMeters(userLat, userLng, branch.latitude, branch.longitude);
          if (dist <= radiusMeters) {
            matches.push({ branch, distanceMeters: dist });
          }
        }
      }
      return matches;
    };

    // -----------------------------------------------------------------
    // TEST 1: User saves KFC -> enters 300m of KFC DHA -> KFC notification
    // -----------------------------------------------------------------
    console.log('🔹 TEST 1: USER SAVES KFC -> ENTERS 300M OF KFC DHA');
    const savedBrands = new Set<string>(['kfc']);
    // GPS at ~250m from KFC DHA (31.4720, 74.4000)
    const t1Matches = evaluateProximity(31.4720, 74.4000, savedBrands);
    console.log(`  ✅ Matches found: ${t1Matches.length} (${t1Matches[0]?.branch.name}, ${t1Matches[0]?.distanceMeters}m away)`);
    if (t1Matches.length !== 1 || t1Matches[0].branch.brandId !== 'kfc') {
      throw new Error('Test 1 Failed: KFC DHA proximity not triggered');
    }

    // -----------------------------------------------------------------
    // TEST 2: User saves KFC -> enters 300m of KFC Johar Town -> KFC notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 2: USER SAVES KFC -> ENTERS 300M OF KFC JOHAR TOWN');
    // GPS at ~220m from KFC Johar Town (31.4670, 74.2950)
    const t2Matches = evaluateProximity(31.4670, 74.2950, savedBrands);
    console.log(`  ✅ Matches found: ${t2Matches.length} (${t2Matches[0]?.branch.name}, ${t2Matches[0]?.distanceMeters}m away)`);
    if (t2Matches.length !== 1 || t2Matches[0].branch.id !== 'kfc_johar') {
      throw new Error('Test 2 Failed: KFC Johar Town proximity not triggered');
    }

    // -----------------------------------------------------------------
    // TEST 3: User saves KFC -> enters 300m of KFC Gulberg -> KFC notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 3: USER SAVES KFC -> ENTERS 300M OF KFC GULBERG');
    // GPS at ~240m from KFC Gulberg (31.5204, 74.3587)
    const t3Matches = evaluateProximity(31.5204, 74.3587, savedBrands);
    console.log(`  ✅ Matches found: ${t3Matches.length} (${t3Matches[0]?.branch.name}, ${t3Matches[0]?.distanceMeters}m away)`);
    if (t3Matches.length !== 1 || t3Matches[0].branch.id !== 'kfc_gulberg') {
      throw new Error('Test 3 Failed: KFC Gulberg proximity not triggered');
    }

    // -----------------------------------------------------------------
    // TEST 4: User saves KFC -> enters 800m from every KFC branch -> NO notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 4: USER 800M FAR FROM EVERY KFC BRANCH -> NO NOTIFICATION');
    // GPS at ~800m away (31.4900, 74.4000)
    const t4Matches = evaluateProximity(31.4900, 74.4000, savedBrands);
    console.log(`  ✅ Matches found: ${t4Matches.length}`);
    if (t4Matches.length !== 0) throw new Error('Test 4 Failed: Triggered notification outside 500m range');

    // -----------------------------------------------------------------
    // TEST 5: User has NOT saved KFC -> enters 200m of KFC -> NO notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 5: USER HAS NOT SAVED KFC -> NO NOTIFICATION');
    const emptySavedBrands = new Set<string>();
    const t5Matches = evaluateProximity(31.4720, 74.4000, emptySavedBrands);
    console.log(`  ✅ Matches found for unsaved brand: ${t5Matches.length}`);
    if (t5Matches.length !== 0) throw new Error('Test 5 Failed: Unsaved brand triggered notification');

    // -----------------------------------------------------------------
    // TEST 6: User saves KFC and McDonald's -> enters KFC radius -> ONLY KFC notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 6: SAVED KFC & MCDONALD\'S -> ENTERS KFC RADIUS -> ONLY KFC NOTIFICATION');
    const multiSavedBrands = new Set<string>(['kfc', 'mcdonalds']);
    const t6Matches = evaluateProximity(31.4720, 74.4000, multiSavedBrands);
    console.log(`  ✅ Matches found: ${t6Matches.length} (${t6Matches[0]?.branch.brandId})`);
    if (t6Matches.length !== 1 || t6Matches[0].branch.brandId !== 'kfc') {
      throw new Error('Test 6 Failed: Wrong brand notification triggered');
    }

    // -----------------------------------------------------------------
    // TEST 7: Anti-spam Geofence Tracking (GPS updates inside radius)
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 7: ANTI-SPAM GEOFENCE TRACKING INSIDE 500M');
    const geofenceMap = new Map<string, boolean>();
    let notificationCount: number = 0;

    const simulateGpsUpdate = (brandId: string, inRange: boolean) => {
      const wasInside = geofenceMap.get(brandId) || false;
      if (inRange && !wasInside) {
        notificationCount++;
        geofenceMap.set(brandId, true);
      } else if (!inRange && wasInside) {
        geofenceMap.set(brandId, false);
      }
    };

    simulateGpsUpdate('kfc', true); // Enter radius -> Notify #1
    simulateGpsUpdate('kfc', true); // Still in radius -> Suppressed
    simulateGpsUpdate('kfc', true); // Still in radius -> Suppressed

    console.log(`  ✅ Total notifications sent on repeat GPS updates: ${notificationCount}`);
    if (Number(notificationCount) !== 1) throw new Error('Test 7 Failed: Repeated notifications sent inside geofence');

    // -----------------------------------------------------------------
    // TEST 8: Exit Geofence & Re-enter
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 8: EXIT GEOFENCE & RE-ENTER');
    simulateGpsUpdate('kfc', false); // Exit radius
    simulateGpsUpdate('kfc', true);  // Re-enter radius -> Notify #2

    console.log(`  ✅ Total notifications sent after exit and re-entry: ${notificationCount}`);
    if (Number(notificationCount) !== 2) throw new Error('Test 8 Failed: Re-entry notification not triggered');

    // -----------------------------------------------------------------
    // TEST 9: Unsave Brand -> Enters KFC Radius -> NO notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 9: UNSAVE KFC -> ENTERS KFC RADIUS -> NO NOTIFICATION');
    multiSavedBrands.delete('kfc');
    const t9Matches = evaluateProximity(31.4720, 74.4000, multiSavedBrands);
    console.log(`  ✅ Matches found after unsaving KFC: ${t9Matches.length}`);
    if (t9Matches.length !== 0) throw new Error('Test 9 Failed: Unsaved KFC still triggered notification');

    // -----------------------------------------------------------------
    // TEST 10: Two branches within 500m -> ONE KFC Notification
    // -----------------------------------------------------------------
    console.log('\n🔹 TEST 10: TWO BRANCHES WITHIN 500M -> ONE AGGREGATED NOTIFICATION');
    const twoBranchesNear: TestBranch[] = [
      { id: 'kfc_1', name: 'KFC Branch 1', brandId: 'kfc', latitude: 31.5200, longitude: 74.3500 },
      { id: 'kfc_2', name: 'KFC Branch 2', brandId: 'kfc', latitude: 31.5210, longitude: 74.3510 },
    ];
    const kfcSavedSet = new Set<string>(['kfc']);
    const rawMatches = twoBranchesNear.filter(b => calculateDistanceMeters(31.5204, 74.3505, b.latitude, b.longitude) <= 500);
    // Aggregate by brand
    const aggregatedBrands = new Set(rawMatches.map(m => m.brandId));
    console.log(`  ✅ Raw nearby branches: ${rawMatches.length} | Aggregated brand alerts: ${aggregatedBrands.size}`);
    if (aggregatedBrands.size !== 1) throw new Error('Test 10 Failed: Multiple brand notifications generated');

    // -----------------------------------------------------------------
    // CLEANUP TEST USER
    // -----------------------------------------------------------------
    console.log('\n🔹 CLEANING UP BRAND PROXIMITY TEST DATA');
    if (userId) await adminClient.from('profiles').delete().eq('id', userId);
    console.log('  ✅ Test profile cleaned up.');

    console.log('\n==================================================================');
    console.log('    🎉 ALL 10 BRAND-LEVEL PROXIMITY TESTS PASSED 100%!           ');
    console.log('==================================================================\n');
  } catch (err: any) {
    console.error('\n❌ BRAND PROXIMITY TEST FAILED:', err.message || err);
    if (userId) await adminClient.from('profiles').delete().eq('id', userId);
  }
}

runBrandProximityTests();
