/**
 * Active database service.
 * - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set → SupabaseService (real DB)
 * - env vars absent                                 → LocalService (in-memory)
 *
 * To migrate to Express + PostgreSQL:
 *   1. Create ApiService implementing IDBService (fetch calls to /api/*)
 *   2. Replace `new SupabaseService(...)` with `new ApiService(apiBaseUrl)` below
 *   3. No component changes needed — all mutations go through EMRContext action helpers
 */
import type { IDBService } from './IDBService';
import { SupabaseService } from './SupabaseService';
import { LocalService } from './LocalService';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const db: IDBService =
  supabaseUrl && supabaseKey
    ? new SupabaseService(supabaseUrl, supabaseKey)
    : new LocalService();
