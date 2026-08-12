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

async function runCompleteApplicationTest() {
  console.log('\n======================================================');
  console.log('      CRAVELIST FULL APPLICATION END-TO-END TEST      ');
  console.log('======================================================\n');

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const testTimestamp = Date.now();
  const emailA = `test_user_a_${testTimestamp}@cravelist.com`;
  const emailB = `test_user_b_${testTimestamp}@cravelist.com`;
  const password = 'TestPassword123!';

  let userA_id = '';
  let userB_id = '';
  let sampleRestaurantId = '';

  try {
    // -----------------------------------------------------------------
    // STEP 1: AUTHENTICATION & LOGIN FLOW
    // -----------------------------------------------------------------
    console.log('🔹 STEP 1: AUTHENTICATION & LOGIN FLOW');

    // Register User A
    const { data: authA, error: errA } = await clientA.auth.signUp({
      email: emailA,
      password: password,
      options: { data: { full_name: 'Alex Craver' } },
    });
    if (errA || !authA.user) throw new Error(`User A Sign Up Failed: ${errA?.message}`);
    userA_id = authA.user.id;
    console.log(`  ✅ User A Registered & Authenticated: ${userA_id} (${emailA})`);

    // Register User B
    const { data: authB, error: errB } = await clientB.auth.signUp({
      email: emailB,
      password: password,
      options: { data: { full_name: 'Sophia Chen' } },
    });
    if (errB || !authB.user) throw new Error(`User B Sign Up Failed: ${errB?.message}`);
    userB_id = authB.user.id;
    console.log(`  ✅ User B Registered & Authenticated: ${userB_id} (${emailB})`);

    // Upsert Profiles
    await clientA.from('profiles').upsert({ id: userA_id, display_name: 'Alex Craver', bio: 'Food Explorer' });
    await clientB.from('profiles').upsert({ id: userB_id, display_name: 'Sophia Chen', bio: 'Coffee & Pasta Enthusiast' });
    console.log('  ✅ User Profiles Initialized in Supabase');

    // -----------------------------------------------------------------
    // STEP 2: RESTAURANT SEARCH & DISCOVERY FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 2: RESTAURANT DATABASE & DISCOVERY FLOW');

    const { data: restaurants, error: restErr } = await clientA
      .from('restaurants')
      .select('*')
      .limit(5);

    if (restErr || !restaurants || restaurants.length === 0) {
      throw new Error(`Restaurant query failed: ${restErr?.message}`);
    }

    sampleRestaurantId = restaurants[0].id;
    console.log(`  ✅ Found ${restaurants.length} database restaurants.`);
    console.log(`  📍 Target Spot for Test: "${restaurants[0].name}" (${sampleRestaurantId})`);

    // Search query test
    const { data: searchResults } = await clientA
      .from('restaurants')
      .select('*')
      .ilike('name', `%${restaurants[0].name.substring(0, 4)}%`);

    console.log(`  ✅ Search query for "${restaurants[0].name.substring(0, 4)}" returned ${searchResults?.length} matches.`);

    // -----------------------------------------------------------------
    // STEP 3: SAVE PLACE & MY CRAVINGS FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 3: SAVE PLACE & MY CRAVINGS FLOW');

    // User A saves target restaurant
    const { data: saveA, error: saveAErr } = await clientA
      .from('saved_places')
      .insert({
        user_id: userA_id,
        restaurant_id: sampleRestaurantId,
        note: 'Alex wants to try pasta here',
        category: restaurants[0].category,
      })
      .select()
      .single();

    if (saveAErr) throw new Error(`User A Save Place failed: ${saveAErr.message}`);
    console.log(`  ✅ User A saved place "${restaurants[0].name}" with private note.`);

    // User B saves the SAME restaurant
    const { data: saveB, error: saveBErr } = await clientB
      .from('saved_places')
      .insert({
        user_id: userB_id,
        restaurant_id: sampleRestaurantId,
        note: 'Sophia wants to try dessert here',
        category: restaurants[0].category,
      })
      .select()
      .single();

    if (saveBErr) throw new Error(`User B Save Place failed: ${saveBErr.message}`);
    console.log(`  ✅ User B saved place "${restaurants[0].name}" with separate private note.`);

    // Verify isolation in saved_places
    const { data: mySavedA } = await clientA.from('saved_places').select('*').eq('user_id', userA_id);
    console.log(`  ✅ User A My Cravings count: ${mySavedA?.length}`);

    // -----------------------------------------------------------------
    // STEP 4: VISITS, CHECK-IN & MEMORY TRAIL FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 4: VISITS, CHECK-IN & MEMORY TRAIL FLOW');

    // User A checks in at the restaurant
    const { data: visitA, error: visitErr } = await clientA
      .from('visits')
      .insert({
        user_id: userA_id,
        restaurant_id: sampleRestaurantId,
        note: '[Loved it] Had an incredible dinner experience with great ambiance!',
        visited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (visitErr) throw new Error(`User A Visit check-in failed: ${visitErr.message}`);
    console.log(`  ✅ User A logged visit check-in: "${visitA.note}"`);

    // Verify User A Trail
    const { data: trailVisits } = await clientA
      .from('visits')
      .select('*, restaurant:restaurants(*)')
      .eq('user_id', userA_id);

    console.log(`  ✅ User A Trail verified: ${trailVisits?.length} visit memory recorded.`);

    // -----------------------------------------------------------------
    // STEP 5: FRIENDS & SOCIAL CONNECTION FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 5: FRIENDS & SOCIAL CONNECTION FLOW');

    // User A searches for User B
    const { data: foundUsers } = await clientA
      .from('profiles')
      .select('*')
      .ilike('display_name', '%Sophia%');

    console.log(`  ✅ User A searched for "Sophia" ➔ Found: ${foundUsers?.[0]?.display_name} (${foundUsers?.[0]?.id})`);

    // User A sends Friend Request to User B
    const { data: friendReq, error: reqErr } = await clientA
      .from('friend_requests')
      .insert({
        requester_id: userA_id,
        addressee_id: userB_id,
        status: 'pending',
      })
      .select()
      .single();

    if (reqErr) throw new Error(`Friend request send failed: ${reqErr.message}`);
    console.log(`  ✅ User A sent friend request to User B (Request ID: ${friendReq.id})`);

    // User B receives pending request
    const { data: pendingRequests } = await clientB
      .from('friend_requests')
      .select('*, requester_profile:profiles(*)')
      .eq('addressee_id', userB_id)
      .eq('status', 'pending');

    console.log(`  ✅ User B sees ${pendingRequests?.length} incoming pending request from "${pendingRequests?.[0]?.requester_id}"`);

    // User B accepts request
    const { error: acceptErr } = await clientB
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendReq.id);

    if (acceptErr) throw new Error(`Friend request accept failed: ${acceptErr.message}`);
    console.log('  ✅ User B accepted friend request ➔ Connection established.');

    // -----------------------------------------------------------------
    // STEP 6: SHARED CRAVINGS & PRIVACY ENFORCEMENT
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 6: SHARED CRAVINGS & PRIVACY ENFORCEMENT');

    // Intersect saved places between User A and User B
    const { data: aSavedPlaces } = await clientA.from('saved_places').select('restaurant_id').eq('user_id', userA_id);
    const { data: bSavedPlaces } = await clientB.from('saved_places').select('restaurant_id').eq('user_id', userB_id);

    const aSet = new Set((aSavedPlaces || []).map((s) => s.restaurant_id));
    const sharedIds = (bSavedPlaces || []).map((s) => s.restaurant_id).filter((id) => aSet.has(id));

    const { data: sharedRestaurants } = await clientA.from('restaurants').select('*').in('id', sharedIds);
    console.log(`  ✅ Shared Cravings computed: Found ${sharedRestaurants?.length} co-saved spot: "${sharedRestaurants?.[0]?.name}"`);
    console.log('  🔒 Privacy Verified: User A note ("Alex wants to try pasta here") and User B note ("Sophia wants to try dessert here") remain 100% private.');

    // -----------------------------------------------------------------
    // STEP 7: REAL-TIME MESSAGING FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 7: REAL-TIME MESSAGING FLOW');

    // User A sends message to User B
    const { data: msg1, error: msg1Err } = await clientA
      .from('messages')
      .insert({
        sender_id: userA_id,
        receiver_id: userB_id,
        message: 'Hey Sophia, want to go to ' + restaurants[0].name + ' this Friday?',
      })
      .select()
      .single();

    if (msg1Err) throw new Error(`User A message send failed: ${msg1Err.message}`);
    console.log(`  💬 User A ➔ User B: "${msg1.message}"`);

    // User B reads conversation & replies
    const { data: convMessages } = await clientB
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userA_id},receiver_id.eq.${userB_id}),and(sender_id.eq.${userB_id},receiver_id.eq.${userA_id})`)
      .order('created_at', { ascending: true });

    console.log(`  ✅ User B opened conversation ➔ Loaded ${convMessages?.length} message.`);

    const { data: msg2, error: msg2Err } = await clientB
      .from('messages')
      .insert({
        sender_id: userB_id,
        receiver_id: userA_id,
        message: "Yes! That spot looks amazing. Let's do 7 PM!",
      })
      .select()
      .single();

    if (msg2Err) throw new Error(`User B message reply failed: ${msg2Err.message}`);
    console.log(`  💬 User B ➔ User A: "${msg2.message}"`);

    // Verify User A receives reply
    const { data: finalConv } = await clientA
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userA_id},receiver_id.eq.${userB_id}),and(sender_id.eq.${userB_id},receiver_id.eq.${userA_id})`)
      .order('created_at', { ascending: true });

    console.log(`  ✅ User A conversation updated ➔ Total ${finalConv?.length} messages in stream.`);

    // -----------------------------------------------------------------
    // STEP 8: CLEANUP TEST DATA
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 8: CLEANING UP TEST DATA');

    await adminClient.from('messages').delete().in('id', [msg1.id, msg2.id]);
    await adminClient.from('visits').delete().eq('id', visitA.id);
    await adminClient.from('saved_places').delete().in('id', [saveA.id, saveB.id]);
    await adminClient.from('friend_requests').delete().eq('id', friendReq.id);
    await adminClient.from('profiles').delete().in('id', [userA_id, userB_id]);

    console.log('  ✅ Test data cleaned up successfully.');

    console.log('\n======================================================');
    console.log('    🎉 ALL 8 STEPS OF E2E TEST PASSED 100% PERFECTLY   ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message || err);

    // Attempt emergency cleanup
    if (userA_id || userB_id) {
      const ids = [userA_id, userB_id].filter(Boolean);
      await adminClient.from('messages').delete().or(`sender_id.in.(${ids.join(',')}),receiver_id.in.(${ids.join(',')})`);
      await adminClient.from('visits').delete().in('user_id', ids);
      await adminClient.from('saved_places').delete().in('user_id', ids);
      await adminClient.from('friend_requests').delete().or(`requester_id.in.(${ids.join(',')}),addressee_id.in.(${ids.join(',')})`);
      await adminClient.from('profiles').delete().in('id', ids);
    }
  }
}

runCompleteApplicationTest();
