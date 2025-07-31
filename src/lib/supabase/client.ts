
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseClient() {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE_URL');

    if (!isSupabaseConfigured) {
        // Return a mock or null client if not configured, to avoid errors
        return null;
    }

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
