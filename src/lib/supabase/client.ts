import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ceicslawfqwpuzwdkvor.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaWNzbGF3ZnF3cHV6d2Rrdm9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NDQ5MjgsImV4cCI6MjEwNDEyMDkyOH0.zbW_MLpsiADOg4NpKnfgBhxMz5-Ljh9hEZJ-uMwF9SI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
