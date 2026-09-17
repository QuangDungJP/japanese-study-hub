import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length > 0) {
    env[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCoinsColumn() {
  console.log("Adding coins column...");
  // Use a hacky RPC or just try updating it, if it fails because column doesn't exist, we can't easily add it via REST.
  // Wait, Supabase REST API cannot execute DDL commands (ALTER TABLE).
  // We have to use an RPC function if one exists.
  const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query: 'ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;' });
  console.log("RPC exec_sql result:", rpcData, rpcError);
}

addCoinsColumn();
