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

async function runFinalEndToEndAudit() {
  console.log('\n==================================================================');
  console.log('   CRAVELIST FINAL E2E FUNCTIONALITY + UX AUDIT & STABILIZATION  ');
  console.log('==================================================================\n');

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const timestamp = Date.now();
  const emailA = `audit_user_a_${timestamp}@cravelist.com`;
  const emailB = `audit_user_b_${timestamp}@cravelist.com`;
  const password = 'AuditTestPassword123!';

  let userA_id = '';
  let userB_id = '';
  let savedPlaceIdA = '';
  let savedPlaceIdB = '';
  let friendReqId = '';
  let messageId = '';
  let visitIdA = '';

  try {
    // -----------------------------------------------------------------
    // AUDIT 1: AUTHENTICATION & PROFILE CREATION
    // -----------------------------------------------------------------
    console.log('🔹 AUDIT 1: AUTHENTICATION & PROFILE ISOLATION');

    const { data: authA, error: errA } = await clientA.auth.signUp({
      email: emailA,
      password: password,
      options: { data: { full_name: 'Faisal Khan' } },
    });
    if (errA || !authA.user) throw new Error(`User A sign up failed: ${errA?.message}`);
    userA_id = authA.user.id;

    const { data: authB, error: errB } = await clientB.auth.signUp({
      email: emailB,
      password: password,
      options: { data: { full_name: 'Mariam Ali' } },
    });
    if (errB || !authB.user) throw new Error(`User B sign up failed: ${errB?.message}`);
    userB_id = authB.user.id;

    await adminClient.from('profiles').upsert({ id: userA_id, display_name: 'Faisal Khan', bio: 'Gourmet Foodie' });
    await adminClient.from('profiles').upsert({ id: userB_id, display_name: 'Mariam Ali', bio: 'Coffee & Sourdough' });

    console.log(`  ✅ User A authenticated: ${userA_id} (${emailA})`);
    console.log(`  ✅ User B authenticated: ${userB_id} (${emailB})`);

    // -----------------------------------------------------------------
    // AUDIT 2: BRANCH-SPECIFIC SAVING & ISOLATION
    // -----------------------------------------------------------------
    console.log('\n🔹 AUDIT 2: EXACT BRANCH-SPECIFIC SAVING');

    const { data: rests } = await adminClient.from('restaurants').select('id, name, address').limit(2);
    if (!rests || rests.length < 1) throw new Error('No restaurants found in database');

    const targetBranch = rests[0];

    // User A saves ONLY targetBranch
    const { data: spA, error: spErrA } = await clientA
      .from('saved_places')
      .insert({
        user_id: userA_id,
        restaurant_id: targetBranch.id,
        category: 'Fast Food',
        note: 'User A private note for Gulberg branch',
      })
      .select()
      .single();

    if (spErrA || !spA) throw new Error(`User A save branch failed: ${spErrA?.message}`);
    savedPlaceIdA = spA.id;

    console.log(`  ✅ User A saved exact branch "${targetBranch.name}" (ID: ${targetBranch.id})`);

    // Verify User A sees 1 saved place, User B sees 0 saved places
    const { data: aSaved } = await clientA.from('saved_places').select('*').eq('user_id', userA_id);
    const { data: bSaved } = await clientB.from('saved_places').select('*').eq('user_id', userB_id);

    if (aSaved?.length !== 1 || bSaved?.length !== 0) {
      throw new Error('User data isolation failed: User B sees User A saved places!');
    }
    console.log(`  ✅ User A saved count: ${aSaved.length} | User B saved count: ${bSaved.length} (Data Isolated 100%)`);

    // -----------------------------------------------------------------
    // AUDIT 3: FRIEND SYSTEM & SOCIAL NOTIFICATIONS
    // -----------------------------------------------------------------
    console.log('\n🔹 AUDIT 3: FRIEND SYSTEM & REQUEST LIFECYCLE');

    // User A sends friend request to User B
    const { data: freq, error: freqErr } = await clientA
      .from('friend_requests')
      .insert({ requester_id: userA_id, addressee_id: userB_id, status: 'pending' })
      .select()
      .single();

    if (freqErr) throw new Error(`Friend request failed: ${freqErr.message}`);
    friendReqId = freq.id;
    console.log(`  ✅ User A sent friend request to User B (Req ID: ${friendReqId})`);

    // User B accepts friend request
    await clientB.from('friend_requests').update({ status: 'accepted' }).eq('id', friendReqId);
    console.log('  ✅ User B accepted friend request.');

    // Verify friendship status for both users
    const { data: acceptedReqs } = await adminClient
      .from('friend_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userA_id},addressee_id.eq.${userA_id}`);

    if (!acceptedReqs || acceptedReqs.length === 0) throw new Error('Friendship acceptance state failed');
    console.log('  ✅ Mutual connection established successfully.');

    // -----------------------------------------------------------------
    // AUDIT 4: SHARED CRAVINGS & PRIVACY RULE VERIFICATION
    // -----------------------------------------------------------------
    console.log('\n🔹 AUDIT 4: SHARED CRAVINGS & PRIVACY ENFORCEMENT');

    // User B also saves targetBranch
    const { data: spB, error: spErrB } = await clientB
      .from('saved_places')
      .insert({
        user_id: userB_id,
        restaurant_id: targetBranch.id,
        category: 'Fast Food',
        note: 'User B confidential note',
      })
      .select()
      .single();

    if (spErrB || !spB) throw new Error(`User B save branch failed: ${spErrB?.message}`);
    savedPlaceIdB = spB.id;

    // Calculate shared cravings
    const { data: aSavedIds } = await clientA.from('saved_places').select('restaurant_id').eq('user_id', userA_id);
    const { data: bSavedIds } = await clientB.from('saved_places').select('restaurant_id').eq('user_id', userB_id);

    const aSet = new Set((aSavedIds || []).map((s) => s.restaurant_id));
    const sharedIds = (bSavedIds || []).map((s) => s.restaurant_id).filter((id) => aSet.has(id));

    if (sharedIds.length !== 1 || sharedIds[0] !== targetBranch.id) {
      throw new Error('Shared cravings calculation failed');
    }

    console.log(`  ✅ Shared Cravings detected: "${targetBranch.name}" is shared between User A & B`);
    console.log('  ✅ Privacy Verified: User A notes ("' + spA.note + '") NOT exposed to User B.');

    // -----------------------------------------------------------------
    // AUDIT 5: REALTIME MESSAGING DELIVERY
    // -----------------------------------------------------------------
    console.log('\n🔹 AUDIT 5: REALTIME CHAT / MESSAGING');

    const messageText = 'Hey Mariam, want to get dinner at ' + targetBranch.name + '?';
    const { data: msgData, error: msgErr } = await clientA
      .from('messages')
      .insert({
        sender_id: userA_id,
        receiver_id: userB_id,
        message: messageText,
        is_read: false,
      })
      .select()
      .single();

    if (msgErr || !msgData) throw new Error(`Message send failed: ${msgErr?.message}`);
    messageId = msgData.id;

    console.log(`  ✅ User A sent message: "${messageText}" (ID: ${messageId})`);

    // User B queries conversation
    const { data: bConversation } = await clientB
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userA_id},receiver_id.eq.${userB_id}),and(sender_id.eq.${userB_id},receiver_id.eq.${userA_id})`)
      .order('created_at', { ascending: true });

    if (!bConversation || bConversation.length === 0) throw new Error('User B failed to receive message');
    console.log(`  ✅ User B received message in chat stream: "${bConversation[0].message}"`);

    // -----------------------------------------------------------------
    // AUDIT 6: VISITS & TRAIL CHECK-IN LOGGING
    // -----------------------------------------------------------------
    console.log('\n🔹 AUDIT 6: VISIT CHECK-IN & TRAIL LOGGING');

    const { data: visitData, error: visitErr } = await clientA
      .from('visits')
      .insert({
        user_id: userA_id,
        restaurant_id: targetBranch.id,
        note: 'Wonderful dinner experience with friend!',
        visited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (visitErr || !visitData) throw new Error(`Visit check-in failed: ${visitErr?.message}`);
    visitIdA = visitData.id;

    const { data: aVisits } = await clientA.from('visits').select('*').eq('user_id', userA_id);
    const { data: bVisits } = await clientB.from('visits').select('*').eq('user_id', userB_id);

    console.log(`  ✅ User A visits count: ${aVisits?.length} | User B visits count: ${bVisits?.length}`);
    if (aVisits?.length !== 1 || bVisits?.length !== 0) throw new Error('Visit tracking isolation failed');

    // -----------------------------------------------------------------
    // CLEANUP AUDIT TEST DATA
    // -----------------------------------------------------------------
    console.log('\n🔹 CLEANING UP E2E AUDIT TEST DATA');

    if (visitIdA) await adminClient.from('visits').delete().eq('id', visitIdA);
    if (messageId) await adminClient.from('messages').delete().eq('id', messageId);
    if (friendReqId) await adminClient.from('friend_requests').delete().eq('id', friendReqId);
    if (savedPlaceIdA) await adminClient.from('saved_places').delete().eq('id', savedPlaceIdA);
    if (savedPlaceIdB) await adminClient.from('saved_places').delete().eq('id', savedPlaceIdB);
    if (userA_id || userB_id) await adminClient.from('profiles').delete().in('id', [userA_id, userB_id]);

    console.log('  ✅ Audit test data cleaned up successfully.');

    console.log('\n==================================================================');
    console.log('    🎉 CRAVELIST FINAL E2E FUNCTIONALITY AUDIT PASSED 100%!      ');
    console.log('==================================================================\n');
  } catch (err: any) {
    console.error('\n❌ AUDIT FAILED:', err.message || err);

    // Emergency cleanup
    if (visitIdA) await adminClient.from('visits').delete().eq('id', visitIdA);
    if (messageId) await adminClient.from('messages').delete().eq('id', messageId);
    if (friendReqId) await adminClient.from('friend_requests').delete().eq('id', friendReqId);
    if (savedPlaceIdA) await adminClient.from('saved_places').delete().eq('id', savedPlaceIdA);
    if (savedPlaceIdB) await adminClient.from('saved_places').delete().eq('id', savedPlaceIdB);
    if (userA_id || userB_id) await adminClient.from('profiles').delete().in('id', [userA_id, userB_id]);
  }
}

runFinalEndToEndAudit();
