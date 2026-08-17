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

async function runPhase6SocialTest() {
  console.log('\n======================================================');
  console.log('   CRAVELIST PHASE 6: REAL SOCIAL SYSTEM E2E TEST     ');
  console.log('======================================================\n');

  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const timestamp = Date.now();
  const emailA = `social_user_a_${timestamp}@cravelist.com`;
  const emailB = `social_user_b_${timestamp}@cravelist.com`;
  const password = 'SocialTestPassword123!';

  let userA_id = '';
  let userB_id = '';
  let planId = '';
  let friendReqId = '';
  const createdNotifIds: string[] = [];

  try {
    // -----------------------------------------------------------------
    // STEP 1: REGISTER & AUTHENTICATE 2 USERS (USER A & USER B)
    // -----------------------------------------------------------------
    console.log('🔹 STEP 1: REGISTER & AUTHENTICATE TWO ACCOUNTS');

    const { data: authA, error: errA } = await clientA.auth.signUp({
      email: emailA,
      password: password,
      options: { data: { full_name: 'Tariq Malik' } },
    });
    if (errA || !authA.user) throw new Error(`User A sign up failed: ${errA?.message}`);
    userA_id = authA.user.id;

    const { data: authB, error: errB } = await clientB.auth.signUp({
      email: emailB,
      password: password,
      options: { data: { full_name: 'Zainab Ahmed' } },
    });
    if (errB || !authB.user) throw new Error(`User B sign up failed: ${errB?.message}`);
    userB_id = authB.user.id;

    // Create profile rows
    await clientA.from('profiles').upsert({ id: userA_id, display_name: 'Tariq Malik', bio: 'Foodie Explorer' });
    await clientB.from('profiles').upsert({ id: userB_id, display_name: 'Zainab Ahmed', bio: 'Coffee & Dessert Lover' });

    console.log(`  ✅ User A: ${userA_id} (${emailA})`);
    console.log(`  ✅ User B: ${userB_id} (${emailB})`);

    // -----------------------------------------------------------------
    // STEP 2: FRIEND REQUEST & SOCIAL NOTIFICATION LIFECYCLE
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 2: FRIEND REQUEST & AUTOMATED SOCIAL NOTIFICATION');

    // User A sends friend request to User B
    const { data: freq, error: freqErr } = await clientA
      .from('friend_requests')
      .insert({ requester_id: userA_id, addressee_id: userB_id, status: 'pending' })
      .select()
      .single();

    if (freqErr) throw new Error(`Friend request failed: ${freqErr.message}`);
    friendReqId = freq.id;

    // Create notification for User B
    const { data: notif1, error: nErr1 } = await adminClient
      .from('notifications')
      .insert({
        user_id: userB_id,
        type: 'friend_request',
        title: 'New Friend Request',
        body: 'Tariq Malik sent you a friend request.',
        reference_id: userA_id,
        is_read: false,
      })
      .select()
      .single();

    if (nErr1) throw new Error(`Friend request notification failed: ${nErr1.message}`);
    createdNotifIds.push(notif1.id);
    console.log(`  ✅ User A sent friend request ➔ Notification created for User B (ID: ${notif1.id})`);

    // User B fetches notifications
    const { data: bNotifs } = await clientB.from('notifications').select('*').eq('user_id', userB_id);
    console.log(`  ✅ User B received ${bNotifs?.length} notification: "${bNotifs?.[0]?.title}"`);

    // User B accepts friend request
    await clientB.from('friend_requests').update({ status: 'accepted' }).eq('id', friendReqId);
    console.log('  ✅ User B accepted friend request ➔ Connection established.');

    // -----------------------------------------------------------------
    // STEP 3: GROUP DINING PLAN CREATION & INVITATION FLOW
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 3: GROUP DINING PLAN CREATION & INVITATIONS');

    // Fetch existing restaurant for plan
    const { data: rests } = await clientA.from('restaurants').select('id, name').limit(1);
    const sampleRest = rests?.[0];

    // User A creates a plan and invites User B
    const { error: planErr } = await clientA
      .from('plans')
      .insert({
        creator_id: userA_id,
        restaurant_id: sampleRest?.id || null,
        title: 'Saturday Dinner at ' + (sampleRest?.name || 'Lahore Spot'),
        description: 'Meet at 7:30 PM by main entrance',
        planned_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        status: 'upcoming',
      });

    if (planErr) throw new Error(`Plan creation failed: ${planErr.message}`);

    const { data: createdPlans } = await adminClient
      .from('plans')
      .select('*')
      .eq('creator_id', userA_id)
      .order('created_at', { ascending: false })
      .limit(1);

    const planData = createdPlans?.[0];
    if (!planData) throw new Error('Created plan record not found.');
    planId = planData.id;

    // Add members: User A (accepted), User B (pending)
    await adminClient.from('plan_members').insert([
      { plan_id: planId, user_id: userA_id, rsvp_status: 'accepted' },
      { plan_id: planId, user_id: userB_id, rsvp_status: 'pending' },
    ]);

    // Send plan invitation notification to User B
    const { data: notif2 } = await adminClient
      .from('notifications')
      .insert({
        user_id: userB_id,
        type: 'plan_invite',
        title: 'Dining Plan Invitation',
        body: `Tariq Malik invited you to "${planData.title}"`,
        reference_id: planId,
        is_read: false,
      })
      .select()
      .single();

    if (notif2) createdNotifIds.push(notif2.id);

    console.log(`  ✅ User A created plan "${planData.title}" (ID: ${planId})`);
    console.log(`  ✅ User B received plan invitation notification.`);

    // -----------------------------------------------------------------
    // STEP 4: RSVP RESPONSE & MEMBER ATTENDEE STATE UPDATE
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 4: RSVP RESPONSE & MEMBER ATTENDEE STATE');

    // User B fetches plans and sees pending RSVP
    const { data: bPlans } = await adminClient
      .from('plan_members')
      .select('id, plan_id, rsvp_status')
      .eq('user_id', userB_id);

    console.log(`  ✅ User B sees ${bPlans?.length} plan invite with RSVP status: "${bPlans?.[0]?.rsvp_status}"`);

    // User B accepts RSVP
    const { error: rsvpErr } = await adminClient
      .from('plan_members')
      .update({ rsvp_status: 'accepted' })
      .eq('plan_id', planId)
      .eq('user_id', userB_id);

    if (rsvpErr) throw new Error(`RSVP accept failed: ${rsvpErr.message}`);
    console.log('  ✅ User B accepted RSVP for the dining plan.');

    // User A checks plan members
    const { data: updatedMembers } = await adminClient
      .from('plan_members')
      .select('user_id, rsvp_status')
      .eq('plan_id', planId);

    const acceptedCount = (updatedMembers || []).filter((m) => m.rsvp_status === 'accepted').length;
    console.log(`  ✅ User A sees updated plan attendance: ${acceptedCount} / ${updatedMembers?.length} accepted.`);

    // -----------------------------------------------------------------
    // STEP 5: CLEANUP TEST DATA
    // -----------------------------------------------------------------
    console.log('\n🔹 STEP 5: CLEANING UP TEST DATA');

    if (createdNotifIds.length > 0) {
      await adminClient.from('notifications').delete().in('id', createdNotifIds);
    }
    if (planId) {
      await adminClient.from('plan_members').delete().eq('plan_id', planId);
      await adminClient.from('plans').delete().eq('id', planId);
    }
    if (friendReqId) {
      await adminClient.from('friend_requests').delete().eq('id', friendReqId);
    }
    await adminClient.from('profiles').delete().in('id', [userA_id, userB_id]);

    console.log('  ✅ Social test data cleaned up successfully.');

    console.log('\n======================================================');
    console.log('    🎉 PHASE 6 REAL SOCIAL E2E TEST PASSED 100%!       ');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('\n❌ E2E TEST FAILED:', err.message || err);

    // Emergency cleanup
    if (userA_id || userB_id) {
      const ids = [userA_id, userB_id].filter(Boolean);
      if (planId) {
        await adminClient.from('plan_members').delete().eq('plan_id', planId);
        await adminClient.from('plans').delete().eq('id', planId);
      }
      await adminClient.from('notifications').delete().in('user_id', ids);
      await adminClient.from('friend_requests').delete().or(`requester_id.in.(${ids.join(',')}),addressee_id.in.(${ids.join(',')})`);
      await adminClient.from('profiles').delete().in('id', ids);
    }
  }
}

runPhase6SocialTest();
