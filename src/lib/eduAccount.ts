// Free Edu game (NihongoLife) account: every website user may claim exactly ONE.
// Backed by table public.edu_game_accounts + RPC claim_edu_game_account (see migration, NOT applied yet).
import { supabase } from '@/integrations/supabase/client';
export interface EduGameAccount { id: string; user_id: string; game_username: string; link_code: string; status: string; created_at: string }

export async function getMyEduAccount(): Promise<EduGameAccount | null> {
  const { data } = await (supabase as any).from('edu_game_accounts').select('*').maybeSingle();
  return data ?? null;
}
/** Idempotent: returns the existing account if already claimed. */
export async function claimEduAccount(preferredName?: string): Promise<EduGameAccount> {
  const { data, error } = await (supabase as any).rpc('claim_edu_game_account', { p_game_username: preferredName ?? null });
  if (error) throw error;
  return data as EduGameAccount;
}

/** Ask the game to wipe progress for my linked account (game checks game_progress_reset_at on next sync). */
export async function resetMyEduGameProgress(): Promise<string> {
  const { data, error } = await (supabase as any).rpc('reset_my_edu_game_progress');
  if (error) throw error;
  return data as string;
}
