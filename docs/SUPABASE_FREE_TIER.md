# Staying on Supabase FREE tier (project mkhrv) - checked 2026-10-30

Free limits (verify on supabase.com/pricing): 500 MB database, 1 GB file storage, 5 GB egress/month,
50k monthly active users, 2 projects, project pauses after 7 days with no activity.

Current usage: database 37 MB (blog_posts 16 MB biggest), storage 191 MB. Extensions: plpgsql, pg_stat_statements,
uuid-ossp, pgcrypto, supabase_vault (all lightweight/default - keep).

Done:
- Indexed all 38 foreign-key columns (migration 20261030141500_fk_indexes_free_tier.sql) -> cheaper joins/RLS checks.
- 1000 JLPT practice papers are generated in the browser (src/data/practicePapers.ts), NOT stored in the DB.
- Mastery/IRT answer history is kept in localStorage, NOT in the DB.
- Music is generated in the browser (Web Audio), no storage objects.

Rules:
- App uses the REST API (pooled by Supabase). Scripts/psql: use the pooler host (port 6543 transaction mode for serverless).
- Realtime is published for 14 tables (bookings, class_messages, notifications, class_stream_*, ...). Remove any table the UI
  does not subscribe to: `alter publication supabase_realtime drop table public.<t>;` (not changed yet - needs a UI check).
- Images: compress before upload (WebP, <300 KB); never store video in Storage - use YouTube/Drive links.
- Always `.select('col1,col2')` + `.range()`/`.limit()`; avoid `select('*')` on blog_posts (big HTML bodies).
- Keep the site visited weekly (or a cron ping) so the free project does not pause.