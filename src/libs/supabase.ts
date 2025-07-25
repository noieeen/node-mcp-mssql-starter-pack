import {createClient} from "@supabase/supabase-js";

// Initialize Supabase client with error handling
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
    return (
        !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL.includes("supabase.co")
    );
};