import { supabase } from "../../lib/supabase/client";
import type { Database } from "../../lib/supabase/types";
import type { AppUpdatePlatform, RemoteAppVersion } from "./types";

type AppVersionsRow = Database["public"]["Tables"]["app_versions"]["Row"];

function mapRemoteVersion(row: AppVersionsRow): RemoteAppVersion {
  return {
    app: row.app,
    platform: row.platform as AppUpdatePlatform,
    minimumVersion: row.minimum_version,
    recommendedVersion: row.recommended_version,
    forceUpdate: Boolean(row.force_update),
    message: row.message,
    storeUrl: row.store_url,
  };
}

export async function fetchRemoteAppVersion(app: string, platform: AppUpdatePlatform) {
  const { data, error } = await supabase
    .from("app_versions")
    .select("app, platform, minimum_version, recommended_version, force_update, message, store_url")
    .eq("app", app)
    .eq("platform", platform)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRemoteVersion(data as AppVersionsRow) : null;
}
