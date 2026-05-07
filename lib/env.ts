const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const appScheme = "livewithms" as const;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
const isRevenueCatConfigured = !!revenueCatIosApiKey;

if (!isSupabaseConfigured) {
  console.warn(
    "[livewithms] Supabase env missing. Running in dev-only mock auth mode.",
    {
      missingUrl: !supabaseUrl,
      missingAnonKey: !supabaseAnonKey,
    },
  );
}

const env = {
  supabaseUrl,
  supabaseAnonKey,
  revenueCatIosApiKey,
  isSupabaseConfigured,
  isRevenueCatConfigured,
  appScheme,
  resetPasswordRedirectUrl: `${appScheme}://reset-password`,
};

export default env;
