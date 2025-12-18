
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvvrcejnornwkimvyglz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dnJjZWpub3Jud2tpbXZ5Z2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDkzODIsImV4cCI6MjA4MTYyNTM4Mn0.06wbkXD678wMchdVFadAg6pgNm4cKNikBg1JbPpDWEQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
