import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";
const revenueCatIosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "";
const revenueCatAndroidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "";
const revenueCatApiKey = Platform.OS === "android" ? revenueCatAndroidApiKey : revenueCatIosApiKey;
const metaAppId = process.env.EXPO_PUBLIC_META_APP_ID || "2593488501121035";
const metaDisplayName = process.env.EXPO_PUBLIC_META_DISPLAY_NAME || "LiveWithMS";
const metaClientToken = process.env.EXPO_PUBLIC_META_CLIENT_TOKEN || "";
const appScheme = "com.livewithms.app" as const;
const bundleIdentifier = "com.livewithms.app" as const;

const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
const isRevenueCatConfigured = !!revenueCatApiKey;

export function getSupabaseProjectRef(url: string) {
  try {
    const hostname = new URL(url).hostname;
    const [projectRef] = hostname.split(".");
    return projectRef || null;
  } catch {
    return null;
  }
}

if (!isSupabaseConfigured) {
  console.warn(
    "[livewithms] Supabase env missing. Running in dev-only mock auth mode.",
    {
      missingUrl: !supabaseUrl,
      missingAnonKey: !supabaseAnonKey,
    },
  );
}

if (__DEV__) {
  console.info("[livewithms] Active Supabase config", {
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl || null,
    projectRef: getSupabaseProjectRef(supabaseUrl),
    anonKeyExists: Boolean(supabaseAnonKey),
    anonKeyLength: supabaseAnonKey.length,
  });
}

const env = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseProjectRef: getSupabaseProjectRef(supabaseUrl),
  revenueCatIosApiKey,
  revenueCatAndroidApiKey,
  revenueCatApiKey,
  metaAppId,
  metaDisplayName,
  metaClientToken,
  isSupabaseConfigured,
  isRevenueCatConfigured,
  appScheme,
  bundleIdentifier,
  resetPasswordRedirectUrl: `${appScheme}://reset-password`,
};

export default env;
