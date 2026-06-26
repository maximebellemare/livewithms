(function () {
  var SUPABASE_URL = "https://tmvpabvztdekmfsgoazx.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qWqkelTv9lbhHNZwOGKKBQ_pl7jpkk7";
  var STORAGE_KEY = "livewithms_affiliate_ref";
  var COOKIE_KEY = "livewithms_affiliate_ref";
  var COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
  var STORE_LINK_SELECTOR = 'a[href*="apps.apple.com"],a[href*="play.google.com"],a[href*="market://"]';
  var APP_STORE_FALLBACK_URL = "";
  var GOOGLE_PLAY_FALLBACK_URL = "https://play.google.com/store/apps/details?id=com.livewithms.app";
  var REFERRAL_MATCH_KEYS = ["slug", "code", "ref", "referral_code", "short_code", "path_slug", "handle", "promo_code"];

  function log(message, details) {
    if (typeof details === "undefined") {
      console.log("[LiveWithMS Affiliate] " + message);
      return;
    }
    console.log("[LiveWithMS Affiliate] " + message, details);
  }

  function normalizeReferral(value) {
    return String(value || "").trim().toLowerCase();
  }

  function readCookie() {
    try {
      var cookieValue = document.cookie
        .split(";")
        .map(function (cookie) {
          return cookie.trim();
        })
        .find(function (cookie) {
          return cookie.indexOf(COOKIE_KEY + "=") === 0;
        });

      if (!cookieValue) return null;
      return decodeURIComponent(cookieValue.split("=").slice(1).join("="));
    } catch (error) {
      log("cookie read failure", error);
      return null;
    }
  }

  function getStoredReferral() {
    var localValue = null;

    try {
      localValue = window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      log("localStorage read failure", error);
    }

    return localValue || readCookie();
  }

  function detectReferralFromQuery() {
    var searchParams = new URLSearchParams(window.location.search || "");
    var refValue = searchParams.get("ref");
    var affiliateValue = searchParams.get("affiliate");

    if (refValue) return normalizeReferral(refValue);
    if (affiliateValue) return normalizeReferral(affiliateValue);
    return "";
  }

  function getCampaignContext() {
    var searchParams = new URLSearchParams(window.location.search || "");

    return {
      source: searchParams.get("utm_source") || null,
      medium: searchParams.get("utm_medium") || null,
      campaign: searchParams.get("utm_campaign") || null,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
      landingPath: window.location.pathname + window.location.search + window.location.hash,
    };
  }

  function storeReferral(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) {
      log("store skipped: empty referral");
      return false;
    }

    var localStorageOk = false;
    var cookieOk = false;

    try {
      window.localStorage.setItem(STORAGE_KEY, normalizedReferral);
      localStorageOk = window.localStorage.getItem(STORAGE_KEY) === normalizedReferral;
      log("localStorage write " + (localStorageOk ? "success" : "failure"), {
        key: STORAGE_KEY,
        value: normalizedReferral,
      });
    } catch (error) {
      log("localStorage write failure", error);
    }

    try {
      document.cookie =
        COOKIE_KEY +
        "=" +
        encodeURIComponent(normalizedReferral) +
        "; path=/; max-age=" +
        COOKIE_MAX_AGE +
        "; SameSite=Lax";
      cookieOk = readCookie() === normalizedReferral;
      log("cookie write " + (cookieOk ? "success" : "failure"), {
        key: COOKIE_KEY,
        value: normalizedReferral,
      });
    } catch (error) {
      log("cookie write failure", error);
    }

    return localStorageOk || cookieOk;
  }

  function appendReferralToUrl(url, referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!url || !normalizedReferral) return url;

    try {
      var resolvedUrl = new URL(url, window.location.origin);
      resolvedUrl.searchParams.set("ref", normalizedReferral);
      return resolvedUrl.toString();
    } catch (error) {
      log("link append failure", { url: url, error: error });
      return url;
    }
  }

  function updateStoreLinks(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) return;

    document.querySelectorAll(STORE_LINK_SELECTOR).forEach(function (node) {
      if (!(node instanceof HTMLAnchorElement)) return;
      node.href = appendReferralToUrl(node.href, normalizedReferral);
    });

    document.querySelectorAll("[data-livewithms-app-store]").forEach(function (node) {
      if (!(node instanceof HTMLAnchorElement)) return;
      var baseHref = node.getAttribute("href") || APP_STORE_FALLBACK_URL;
      if (baseHref) node.href = appendReferralToUrl(baseHref, normalizedReferral);
    });

    document.querySelectorAll("[data-livewithms-google-play]").forEach(function (node) {
      if (!(node instanceof HTMLAnchorElement)) return;
      var baseHref = node.getAttribute("href") || GOOGLE_PLAY_FALLBACK_URL;
      if (baseHref) node.href = appendReferralToUrl(baseHref, normalizedReferral);
    });
  }

  async function fetchRows(table) {
    var response = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?select=*&limit=200", {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(table + " lookup failed with " + response.status);
    }

    return response.json();
  }

  function findReferralMatch(rows, referral) {
    var normalizedReferral = normalizeReferral(referral);

    return rows.find(function (row) {
      if (!row || typeof row !== "object") return false;

      return REFERRAL_MATCH_KEYS.some(function (key) {
        return typeof row[key] === "string" && normalizeReferral(row[key]) === normalizedReferral;
      });
    }) || null;
  }

  async function resolveAffiliateRecord(referral) {
    try {
      var referralLinks = await fetchRows("referral_links");
      var referralLinkMatch = findReferralMatch(referralLinks, referral);
      if (referralLinkMatch) {
        log("Supabase lookup result", {
          table: "referral_links",
          referral: referral,
          match: referralLinkMatch,
        });
        return referralLinkMatch;
      }
    } catch (error) {
      log("Supabase lookup result", {
        table: "referral_links",
        referral: referral,
        error: String(error),
      });
    }

    try {
      var affiliates = await fetchRows("affiliates");
      var affiliateMatch = findReferralMatch(affiliates, referral);
      log("Supabase lookup result", {
        table: "affiliates",
        referral: referral,
        match: affiliateMatch,
      });
      return affiliateMatch;
    } catch (error) {
      log("Supabase lookup result", {
        table: "affiliates",
        referral: referral,
        error: String(error),
      });
      return null;
    }
  }

  function buildClickPayloads(match, referral, context) {
    var referralLinkId =
      match && typeof match.id === "string"
        ? match.id
        : match && typeof match.referral_link_id === "string"
          ? match.referral_link_id
          : null;
    var affiliateId =
      match && typeof match.affiliate_id === "string"
        ? match.affiliate_id
        : match && typeof match.id === "string"
          ? match.id
          : null;
    var metadata = {
      source: "shopify",
      landing_path: context.landingPath,
      referrer_url: context.referrer,
      user_agent: context.userAgent,
      captured_at: new Date().toISOString(),
      utm_source: context.source,
      utm_medium: context.medium,
      utm_campaign: context.campaign,
    };

    return [
      {
        referral_link_id: referralLinkId,
        affiliate_id: affiliateId,
        slug: referral,
        source: context.source,
        medium: context.medium,
        campaign: context.campaign,
        referrer: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: referralLinkId,
        affiliate_id: affiliateId,
        slug: referral,
        source: context.source,
        medium: context.medium,
        campaign: context.campaign,
        referrer_url: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: referralLinkId,
        affiliate_id: affiliateId,
        slug: referral,
        landing_path: context.landingPath,
        referrer_url: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: referralLinkId,
        affiliate_id: affiliateId,
        slug: referral,
        metadata: metadata,
      },
      {
        affiliate_id: affiliateId,
        slug: referral,
        metadata: metadata,
      },
    ];
  }

  async function insertAffiliateClick(payload) {
    var response = await fetch(SUPABASE_URL + "/rest/v1/affiliate_clicks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      var responseText = "";
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = String(error);
      }

      log("affiliate_clicks insert error", {
        status: response.status,
        payload: payload,
        response: responseText,
      });
      return false;
    }

    log("affiliate_clicks insert result", {
      status: response.status,
      payload: payload,
    });
    return true;
  }

  async function trackAffiliateClick(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) {
      log("affiliate_clicks insert skipped: empty referral");
      return false;
    }

    var match = await resolveAffiliateRecord(normalizedReferral);
    if (!match) {
      log("no valid affiliate match", {
        referral: normalizedReferral,
      });
      return false;
    }

    storeReferral(normalizedReferral);
    updateStoreLinks(normalizedReferral);

    var payloads = buildClickPayloads(match, normalizedReferral, getCampaignContext());

    for (var index = 0; index < payloads.length; index += 1) {
      if (await insertAffiliateClick(payloads[index])) {
        return true;
      }
    }

    return false;
  }

  function runAffiliateCapture() {
    log("script loaded");
    log("current URL", window.location.href);

    var detectedReferral = detectReferralFromQuery();
    log("detected ref value", detectedReferral || null);

    if (detectedReferral) {
      void trackAffiliateClick(detectedReferral);
      return;
    }

    var storedReferral = normalizeReferral(getStoredReferral());
    log("stored ref value", storedReferral || null);
    if (storedReferral) {
      updateStoreLinks(storedReferral);
    }
  }

  window.LiveWithMSAffiliate = {
    getStoredReferral: getStoredReferral,
    storeReferral: storeReferral,
    trackAffiliateClick: trackAffiliateClick,
    appendReferralToUrl: appendReferralToUrl,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAffiliateCapture);
  } else {
    runAffiliateCapture();
  }
})();
