/**
 * supabase.js - Supabase Client Initialization
 * 
 * Initializes the Supabase client for authentication and database interactions.
 * Used for:
 * - Magic Link Auth
 * - Realtime Data Sync
 * - User Data Persistence
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
