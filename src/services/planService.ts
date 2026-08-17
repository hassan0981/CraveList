import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { PlanRow, PlanMemberRow } from '@/types/database';

let supabaseClient: any = null;
function getSupabaseRealtime() {
  if (!supabaseClient) {
    try {
      const { supabase } = require('@/lib/supabase');
      supabaseClient = supabase;
    } catch (e) {
      supabaseClient = null;
    }
  }
  return supabaseClient;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lqvqizbfzsplkdabgqik.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = serviceKey ? createClient(supabaseUrl, serviceKey) : supabase;

async function schedulePlanReminders(planTitle: string, plannedAtIso: string, spotName: string) {
  try {
    const Notifications = require('expo-notifications');
    const eventTime = new Date(plannedAtIso).getTime();
    const now = Date.now();
    const twelveHoursMs = 12 * 60 * 60 * 1000;
    const sixHoursMs = 6 * 60 * 60 * 1000;

    const t12Time = new Date(eventTime - twelveHoursMs);
    const t6Time = new Date(eventTime - sixHoursMs);

    if (t12Time.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ Dining Plan Reminder (12h)`,
          body: `Reminder: "${planTitle}" at ${spotName} is coming up in 12 hours!`,
        },
        trigger: { date: t12Time } as any,
      });
    }

    if (t6Time.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🍽️ Dining Plan Reminder (6h)`,
          body: `Get ready! "${planTitle}" at ${spotName} is starting in 6 hours!`,
        },
        trigger: { date: t6Time } as any,
      });
    }
  } catch (err) {
    console.warn('[planService] Error scheduling local push reminders:', err);
  }
}

export const planService = {
  async createPlan(
    creatorId: string,
    planData: {
      title: string;
      restaurantId?: string;
      plannedAt?: string;
      description?: string;
      invitedUserIds?: string[];
    }
  ): Promise<{ data: PlanRow | null; error: string | null }> {
    if (!creatorId) return { data: null, error: 'User not authenticated' };
    if (!planData.title.trim()) return { data: null, error: 'Plan title is required' };

    try {
      const payload = {
        creator_id: creatorId,
        title: planData.title.trim(),
        restaurant_id: planData.restaurantId || null,
        planned_at: planData.plannedAt || new Date().toISOString(),
        description: planData.description || null,
        status: 'upcoming',
      };

      const { data: newPlan, error: planErr } = await adminClient
        .from('plans')
        .insert(payload)
        .select('*, restaurant:restaurants(*)')
        .single();

      if (planErr || !newPlan) {
        console.error('[planService] Error creating plan row:', planErr);
        return { data: null, error: 'Unable to create dining plan.' };
      }

      const creatorMember = {
        plan_id: newPlan.id,
        user_id: creatorId,
        rsvp_status: 'accepted',
      };

      const invitedMembers = (planData.invitedUserIds || []).map((uid) => ({
        plan_id: newPlan.id,
        user_id: uid,
        rsvp_status: 'pending',
      }));

      await adminClient.from('plan_members').insert([creatorMember, ...invitedMembers]);

      for (const uid of planData.invitedUserIds || []) {
        try {
          await adminClient.from('notifications').insert({
            user_id: uid,
            type: 'plan_invite',
            title: 'Dining Plan Invite 🍽️',
            body: `You've been invited to "${newPlan.title}"!`,
            reference_id: newPlan.id,
            is_read: false,
          });
        } catch (nErr) {
          console.warn('[planService] Note dispatching invite notification:', nErr);
        }
      }

      if (planData.plannedAt) {
        const spotName = newPlan.restaurant?.name || 'Selected Restaurant';
        await schedulePlanReminders(newPlan.title, planData.plannedAt, spotName);
      }

      return { data: newPlan as PlanRow, error: null };
    } catch (err) {
      console.error('[planService] Unexpected error in createPlan:', err);
      return { data: null, error: 'Something went wrong.' };
    }
  },

  async getMyPlans(userId: string): Promise<PlanRow[]> {
    if (!userId) return [];
    try {
      const [memberRes, creatorRes] = await Promise.all([
        adminClient.from('plan_members').select('plan_id').eq('user_id', userId),
        adminClient.from('plans').select('id').eq('creator_id', userId),
      ]);

      const planIdsSet = new Set<string>();
      (memberRes.data || []).forEach((m: { plan_id: string }) => planIdsSet.add(m.plan_id));
      (creatorRes.data || []).forEach((p: { id: string }) => planIdsSet.add(p.id));

      const planIds = Array.from(planIdsSet);
      if (planIds.length === 0) return [];

      const { data: plansData, error: planErr } = await adminClient
        .from('plans')
        .select('*, restaurant:restaurants(*), members:plan_members(*)')
        .in('id', planIds)
        .order('planned_at', { ascending: true });

      if (planErr || !plansData) {
        console.error('[planService] Error fetching plans:', planErr);
        return [];
      }

      // Collect user IDs for profile enrichment
      const userIdsSet = new Set<string>();
      plansData.forEach((p: any) => {
        if (p.creator_id) userIdsSet.add(p.creator_id);
        (p.members || []).forEach((m: any) => {
          if (m.user_id) userIdsSet.add(m.user_id);
        });
      });

      let profileMap = new Map<string, any>();
      if (userIdsSet.size > 0) {
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('*')
          .in('id', Array.from(userIdsSet));

        if (profiles) {
          profileMap = new Map(profiles.map((prof: any) => [prof.id, prof]));
        }
      }

      const enrichedPlans: PlanRow[] = plansData.map((p: any) => ({
        ...p,
        creator_profile: profileMap.get(p.creator_id) || null,
        members: (p.members || []).map((m: any) => ({
          ...m,
          user_profile: profileMap.get(m.user_id) || null,
        })),
      }));

      return enrichedPlans;
    } catch (err) {
      console.error('[planService] Error getting plans:', err);
      return [];
    }
  },

  async updateRsvpStatus(
    planId: string,
    userId: string,
    rsvpStatus: 'accepted' | 'declined'
  ): Promise<boolean> {
    if (!planId || !userId) return false;
    try {
      const { error } = await adminClient
        .from('plan_members')
        .update({ rsvp_status: rsvpStatus })
        .eq('plan_id', planId)
        .eq('user_id', userId);

      if (error) {
        console.error('[planService] Error updating RSVP status:', error.message);
        return false;
      }

      const { data: plan } = await adminClient
        .from('plans')
        .select('*, restaurant:restaurants(*)')
        .eq('id', planId)
        .single();

      if (plan && plan.creator_id && plan.creator_id !== userId) {
        if (rsvpStatus === 'accepted') {
          if (plan.planned_at) {
            const spotName = plan.restaurant?.name || 'Restaurant Spot';
            await schedulePlanReminders(plan.title, plan.planned_at, spotName);
          }
          await adminClient.from('notifications').insert({
            user_id: plan.creator_id,
            type: 'plan_invite',
            title: 'RSVP Accepted! 🎉',
            body: `A friend accepted your invitation to "${plan.title}"!`,
            reference_id: planId,
            is_read: false,
          });
        } else if (rsvpStatus === 'declined') {
          await adminClient.from('notifications').insert({
            user_id: plan.creator_id,
            type: 'plan_invite',
            title: 'RSVP Declined',
            body: `A friend declined your invitation to "${plan.title}".`,
            reference_id: planId,
            is_read: false,
          });
        }
      }

      return true;
    } catch (err) {
      console.error('[planService] Unexpected error updating RSVP status:', err);
      return false;
    }
  },

  subscribeToPlanUpdates(userId: string, onUpdate: () => void) {
    if (!userId) return () => {};
    const client = getSupabaseRealtime();
    if (!client) return () => {};
    const channel = client
      .channel(`plan_updates_${userId}_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_members' }, () => onUpdate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => onUpdate())
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  },
};

export default planService;
