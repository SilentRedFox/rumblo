import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://dagtrivztwpdnhinalbd.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhZ3RyaXZ6dHdwZG5oaW5hbGJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTkzODMsImV4cCI6MjA4ODc5NTM4M30.iMtn4q3LfkmZLtaP54C-PFICEIgC_cTAOCFu5AAp_gM'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)