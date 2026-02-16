// server/_core/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

if (!ENV.supabaseUrl || !ENV.supabaseServiceKey) {
  throw new Error("Faltam variáveis de ambiente do Supabase no arquivo .env");
}

export const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceKey);