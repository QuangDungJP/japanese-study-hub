import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#') && line.includes('='))
  .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/^['"]|['"]$/g, '');
const key = (env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^['"]|['"]$/g, '');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { error } = await supabase.from('classes').select('*, courses:course_id(title_vi)').limit(1);
console.log(error ? `${error.code || 'unknown'}: ${error.message}` : 'classes query: ok');
