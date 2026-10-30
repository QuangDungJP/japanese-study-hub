# Free Edu game account (NihongoLife) for website users — design (draft, not deployed)

1. User signs in on quangdungnihongo.com → Dashboard/Home card "Nhận tài khoản game miễn phí".
2. Client calls `claimEduAccount()` (src/lib/eduAccount.ts) → RPC `claim_edu_game_account` (security definer).
   `user_id UNIQUE` guarantees ONE account per website account; the call is idempotent.
3. User gets `game_username` + 8-char `link_code`. In the game (MainMenu → Account) they sign in
   with the same Supabase email (preferred) or type the link code (needs `redeem_edu_link_code`, TODO).
4. Reset: game already has a guest reset (GuestReset.ResetGuest, guest only, double-tap confirm).
   For linked accounts, add a server-side reset that stamps `game_progress_reset_at` (TODO, owner decision).
5. Migration: supabase/migrations/20261030140000_edu_game_accounts.sql — NOT applied; needs owner OK.

## Apply (one paste) - project mkhrvapbjwtwumbestjf
1. Open https://supabase.com/dashboard/project/mkhrvapbjwtwumbestjf/sql/new (or ask Lovable chat: "run this SQL migration").
2. Paste the whole file `supabase/migrations/20261030140000_edu_game_accounts.sql`, press Run. Safe to re-run except `create policy` (drop it first if re-running).
3. Verify: `select to_regclass('public.edu_game_accounts');` -> not null; `select proname from pg_proc where proname like '%edu_%';` -> claim_edu_game_account, redeem_edu_link_code, reset_my_edu_game_progress.
4. On the site (signed in) press "Nhan 1 tai khoan game mien phi" twice -> same username/code both times.

## Game side (TODO in Unity, after owner OK)
- Account screen: input link code -> POST {SUPABASE_URL}/rest/v1/rpc/redeem_edu_link_code {p_code, p_device_id: SystemInfo.deviceUniqueIdentifier} with anon key.
- On sync: if game_progress_reset_at > local last-reset, wipe local save (reuse GuestReset logic for the account slot).
