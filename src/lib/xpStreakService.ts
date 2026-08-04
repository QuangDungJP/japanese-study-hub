import { supabase } from '@/integrations/supabase/client';

export interface XpStreakResult {
  totalXp: number;
  streak: number;
  dailyProgress?: number;
}

/**
 * Helper to get YYYY-MM-DD date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().slice(0, 10);
};

export const getYesterdayDateString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Award XP and update Streak for a user on completing an activity
 */
export async function awardUserXpAndStreak(
  userId: string,
  xpAmount: number,
  activityName?: string
): Promise<XpStreakResult> {
  if (!userId) {
    return { totalXp: 0, streak: 0 };
  }

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  try {
    // 1. Attempt RPC call
    const { data: rpcData, error: rpcError } = await supabase.rpc('award_user_xp_and_streak' as any, {
      p_user_id: userId,
      p_xp_amount: xpAmount,
    });

    if (!rpcError && rpcData) {
      const result = {
        totalXp: rpcData.total_xp || 0,
        streak: rpcData.streak || 0,
        dailyProgress: rpcData.daily_progress || 0,
      };
      await checkAndUnlockBadges(userId, result.totalXp, result.streak);
      return result;
    }
  } catch (err) {
    console.warn('RPC award_user_xp_and_streak not available, falling back to direct table update:', err);
  }

  // 2. Fallback to direct client-side update
  try {
    const { data: prog } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentXp = prog?.total_xp || 0;
    const currentStreak = prog?.streak || 0;
    const currentDaily = prog?.daily_progress || 0;
    const lastDate = prog?.last_activity_date;

    const newXp = Math.max(0, currentXp + xpAmount);
    
    // Daily progress calculation
    const newDaily = lastDate === todayStr ? Math.max(0, currentDaily + xpAmount) : Math.max(0, xpAmount);

    // Streak calculation
    let newStreak = currentStreak;
    if (lastDate === todayStr) {
      newStreak = Math.max(1, currentStreak);
    } else if (lastDate === yesterdayStr) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 1; // Missed days, streak resets to 1
    }

    const payload = {
      user_id: userId,
      total_xp: newXp,
      daily_progress: newDaily,
      streak: newStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    };

    if (prog) {
      await supabase.from('user_progress').update(payload).eq('user_id', userId);
    } else {
      await supabase.from('user_progress').insert(payload);
    }

    await checkAndUnlockBadges(userId, newXp, newStreak);

    return {
      totalXp: newXp,
      streak: newStreak,
      dailyProgress: newDaily,
    };
  } catch (error) {
    console.error('Error awarding XP/Streak:', error);
    return { totalXp: 0, streak: 0 };
  }
}

/**
 * Manually adjust (+ / -) XP or Streak for a student (Used by Admins & Teachers)
 */
export async function adjustUserXpAndStreak(params: {
  userId: string;
  xpDelta?: number;
  streakDelta?: number;
  streakSet?: number;
  reason?: string;
}): Promise<XpStreakResult> {
  const { userId, xpDelta = 0, streakDelta = 0, streakSet } = params;

  if (!userId) {
    return { totalXp: 0, streak: 0 };
  }

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('adjust_user_xp_and_streak' as any, {
      p_user_id: userId,
      p_xp_delta: xpDelta,
      p_streak_delta: streakDelta,
      p_streak_set: streakSet ?? null,
    });

    if (!rpcError && rpcData) {
      return {
        totalXp: rpcData.total_xp || 0,
        streak: rpcData.streak || 0,
      };
    }
  } catch (err) {
    console.warn('RPC adjust_user_xp_and_streak not available, using direct fallback:', err);
  }

  // Direct table fallback
  try {
    const { data: prog } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const currentXp = prog?.total_xp || 0;
    const currentStreak = prog?.streak || 0;

    const newXp = Math.max(0, currentXp + xpDelta);

    let newStreak = currentStreak;
    if (streakSet !== undefined && streakSet !== null) {
      newStreak = Math.max(0, streakSet);
    } else {
      newStreak = Math.max(0, currentStreak + streakDelta);
    }

    const payload = {
      user_id: userId,
      total_xp: newXp,
      streak: newStreak,
      updated_at: new Date().toISOString(),
    };

    if (prog) {
      await supabase.from('user_progress').update(payload).eq('user_id', userId);
    } else {
      await supabase.from('user_progress').insert({
        ...payload,
        last_activity_date: getTodayDateString(),
      });
    }

    return {
      totalXp: newXp,
      streak: newStreak,
    };
  } catch (error) {
    console.error('Error adjusting XP/Streak:', error);
    return { totalXp: 0, streak: 0 };
  }
}

/**
 * Check and auto-unlock eligible badges
 */
async function checkAndUnlockBadges(userId: string, currentXp: number, currentStreak: number) {
  try {
    const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
      supabase.from('badges').select('*').eq('is_active', true),
      supabase.from('user_badges').select('badge_id').eq('user_id', userId),
    ]);

    if (!allBadges) return;

    const unlockedIds = new Set((userBadges || []).map(b => b.badge_id));
    const inserts: Promise<any>[] = [];
    let bonusXpSum = 0;

    for (const b of allBadges) {
      if (unlockedIds.has(b.id)) continue;
      let conditionMet = false;
      if (b.req_type === 'total_xp' && currentXp >= b.req_value) conditionMet = true;
      if (b.req_type === 'streak_days' && currentStreak >= b.req_value) conditionMet = true;

      if (conditionMet) {
        inserts.push(
          supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: b.id,
            unlocked_by: 'system',
          }) as any
        );
        if (b.bonus_xp > 0) bonusXpSum += b.bonus_xp;
      }
    }

    if (inserts.length > 0) {
      await Promise.all(inserts);
      if (bonusXpSum > 0) {
        await supabase
          .from('user_progress')
          .update({ total_xp: currentXp + bonusXpSum })
          .eq('user_id', userId);
      }
    }
  } catch (e) {
    console.error('Error checking badges:', e);
  }
}
