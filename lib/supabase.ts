
import { createClient } from '@supabase/supabase-js';

// Access environment variables with provided keys as fallbacks
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://qgfktfjwnpycremegeme.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZmt0Zmp3bnB5Y3JlbWVnZW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzQyMjcsImV4cCI6MjA3OTI1MDIyN30.cSPW-OROIwQiN8hCY6Ecl_g79Y2bOP_mKgc76bkmh00';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
