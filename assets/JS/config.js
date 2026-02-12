// 1. Import Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// 2. Your Project URL (From your earlier screenshot)
const supabaseUrl = 'https://hjvviswmiqqckijbtkpq.supabase.co'

// 3. YOUR NEW KEY (Paste the one starting with sb_publishable_... here)
const supabaseKey = 'sb_publishable_KrMiTm1qYlEMRPlqj6z35g_Rj31mooj'

// 4. Export
export const supabase = createClient(supabaseUrl, supabaseKey)