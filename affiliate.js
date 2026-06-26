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
  var BANNER_ID = "livewithms-affiliate-banner";

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

  function normalizeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function toTitleCase(value) {
    var normalized = normalizeText(value);
    if (!normalized) {
      return "";
    }

    return normalized
      .split(/\s+/)
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
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

    return (
      rows.find(function (row) {
        if (!row || typeof row !== "object") return false;

        return REFERRAL_MATCH_KEYS.some(function (key) {
          return typeof row[key] === "string" && normalizeReferral(row[key]) === normalizedReferral;
        });
      }) || null
    );
  }

  function findAffiliateById(rows, affiliateId) {
    if (!affiliateId) {
      return null;
    }

    return (
      rows.find(function (row) {
        return row && typeof row === "object" && typeof row.id === "string" && row.id === affiliateId;
      }) || null
    );
  }

  function getAffiliateId(match) {
    if (!match || typeof match !== "object") {
      return null;
    }

    if (typeof match.affiliate_id === "string" && match.affiliate_id) {
      return match.affiliate_id;
    }

    if (typeof match.id === "string" && match.id) {
      return match.id;
    }

    return null;
  }

  function getAffiliateName() {
    for (var i = 0; i < arguments.length; i += 1) {
      var record = arguments[i];
      if (!record || typeof record !== "object") {
        continue;
      }

      var candidateKeys = ["name", "display_name", "full_name", "title"];
      for (var j = 0; j < candidateKeys.length; j += 1) {
        var value = normalizeText(record[candidateKeys[j]]);
        if (value) {
          return value;
        }
      }
    }

    return "";
  }

  function getPromoCode() {
    for (var i = 0; i < arguments.length; i += 1) {
      var record = arguments[i];
      if (!record || typeof record !== "object") {
        continue;
      }

      var candidateKeys = ["promo_code", "code", "referral_code", "slug"];
      for (var j = 0; j < candidateKeys.length; j += 1) {
        var value = normalizeText(record[candidateKeys[j]]);
        if (value) {
          return value.toUpperCase();
        }
      }
    }

    return "";
  }

  async function resolveAffiliate(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) {
      return null;
    }

    try {
      var results = await Promise.all([fetchRows("referral_links"), fetchRows("affiliates")]);
      var referralLinks = Array.isArray(results[0]) ? results[0] : [];
      var affiliates = Array.isArray(results[1]) ? results[1] : [];
      var referralLinkMatch = findReferralMatch(referralLinks, normalizedReferral);
      var affiliateMatch = findReferralMatch(affiliates, normalizedReferral);
      var affiliateId = getAffiliateId(referralLinkMatch) || getAffiliateId(affiliateMatch);
      var affiliateRecord = affiliateMatch || findAffiliateById(affiliates, affiliateId);

      log("Supabase lookup result", {
        referral: normalizedReferral,
        referralLinkMatch: referralLinkMatch,
        affiliateMatch: affiliateRecord,
      });

      if (!affiliateId) {
        return null;
      }

      var name = getAffiliateName(affiliateRecord, referralLinkMatch);
      var promoCode = getPromoCode(affiliateRecord, referralLinkMatch) || normalizedReferral.toUpperCase();
      var slug =
        normalizeReferral(referralLinkMatch && referralLinkMatch.slug) ||
        normalizeReferral(affiliateRecord && affiliateRecord.slug) ||
        normalizedReferral;

      return {
        affiliateId: affiliateId,
        affiliateName: name ? toTitleCase(name) : promoCode,
        promoCode: promoCode,
        slug: slug,
        referralLinkId:
          referralLinkMatch && typeof referralLinkMatch.id === "string" ? referralLinkMatch.id : null,
      };
    } catch (error) {
      log("Supabase lookup result", {
        referral: normalizedReferral,
        error: String(error),
      });
      return null;
    }
  }

  function buildClickPayloads(affiliate, referral, context) {
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
        referral_link_id: affiliate.referralLinkId,
        affiliate_id: affiliate.affiliateId,
        slug: referral,
        source: context.source,
        medium: context.medium,
        campaign: context.campaign,
        referrer: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: affiliate.referralLinkId,
        affiliate_id: affiliate.affiliateId,
        slug: referral,
        source: context.source,
        medium: context.medium,
        campaign: context.campaign,
        referrer_url: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: affiliate.referralLinkId,
        affiliate_id: affiliate.affiliateId,
        slug: referral,
        landing_path: context.landingPath,
        referrer_url: context.referrer,
        user_agent: context.userAgent,
        metadata: metadata,
      },
      {
        referral_link_id: affiliate.referralLinkId,
        affiliate_id: affiliate.affiliateId,
        slug: referral,
        metadata: metadata,
      },
      {
        affiliate_id: affiliate.affiliateId,
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

  async function copyText(text) {
    if (!text) {
      return false;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) {
      log("clipboard api copy failed", error);
    }

    try {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.pointerEvents = "none";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      var successful = document.execCommand("copy");
      document.body.removeChild(textarea);
      return successful;
    } catch (error) {
      log("execCommand copy failed", error);
      return false;
    }
  }

  function removeExistingBanner() {
    var existing = document.getElementById(BANNER_ID);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  }

  function createBanner(affiliate) {
    if (!affiliate || !affiliate.promoCode || !affiliate.affiliateName) {
      return;
    }

    removeExistingBanner();

    var wrapper = document.createElement("div");
    wrapper.id = BANNER_ID;
    wrapper.setAttribute("role", "status");
    wrapper.setAttribute("aria-live", "polite");
    wrapper.style.position = "sticky";
    wrapper.style.top = "0";
    wrapper.style.zIndex = "2147483000";
    wrapper.style.padding = "10px 14px";
    wrapper.style.background = "linear-gradient(135deg, #fff7f0 0%, #fff2e8 52%, #ffeddc 100%)";
    wrapper.style.borderBottom = "1px solid rgba(254, 120, 26, 0.16)";
    wrapper.style.boxShadow = "0 14px 28px rgba(17, 24, 39, 0.08)";
    wrapper.style.backdropFilter = "saturate(1.05)";

    var inner = document.createElement("div");
    inner.style.maxWidth = "1120px";
    inner.style.margin = "0 auto";
    inner.style.display = "flex";
    inner.style.alignItems = "center";
    inner.style.justifyContent = "space-between";
    inner.style.gap = "16px";
    inner.style.flexWrap = "wrap";
    inner.style.position = "relative";

    var copy = document.createElement("div");
    copy.style.display = "flex";
    copy.style.flexDirection = "column";
    copy.style.gap = "4px";
    copy.style.minWidth = "0";
    copy.style.flex = "1 1 280px";

    var title = document.createElement("div");
    title.textContent = "❤️ " + affiliate.affiliateName + " recommends LiveWithMS";
    title.style.fontSize = "17px";
    title.style.lineHeight = "1.32";
    title.style.fontWeight = "800";
    title.style.letterSpacing = "-0.01em";
    title.style.color = "#8a2f08";

    var subtitle = document.createElement("div");
    subtitle.style.display = "flex";
    subtitle.style.alignItems = "center";
    subtitle.style.flexWrap = "wrap";
    subtitle.style.gap = "8px";
    subtitle.style.fontSize = "14px";
    subtitle.style.lineHeight = "1.45";
    subtitle.style.color = "#9a3412";

    var subtitlePrefix = document.createElement("span");
    subtitlePrefix.textContent = "Support " + affiliate.affiliateName + " by entering code";

    var codePill = document.createElement("span");
    codePill.textContent = affiliate.promoCode;
    codePill.style.display = "inline-flex";
    codePill.style.alignItems = "center";
    codePill.style.justifyContent = "center";
    codePill.style.padding = "6px 12px";
    codePill.style.borderRadius = "999px";
    codePill.style.background = "#ffffff";
    codePill.style.border = "1px solid rgba(254, 120, 26, 0.22)";
    codePill.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.5)";
    codePill.style.color = "#c2410c";
    codePill.style.fontSize = "13px";
    codePill.style.fontWeight = "800";
    codePill.style.letterSpacing = "0.08em";
    codePill.style.textTransform = "uppercase";

    var subtitleSuffix = document.createElement("span");
    subtitleSuffix.textContent = "during app setup.";

    subtitle.appendChild(subtitlePrefix);
    subtitle.appendChild(codePill);
    subtitle.appendChild(subtitleSuffix);

    var buttonWrap = document.createElement("div");
    buttonWrap.style.display = "flex";
    buttonWrap.style.flexDirection = "column";
    buttonWrap.style.alignItems = "stretch";
    buttonWrap.style.gap = "8px";
    buttonWrap.style.flex = "0 0 auto";

    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "Copy Code";
    button.style.border = "0";
    button.style.borderRadius = "999px";
    button.style.padding = "12px 18px";
    button.style.background = "linear-gradient(135deg, #fe781a 0%, #f97316 100%)";
    button.style.color = "#ffffff";
    button.style.fontSize = "14px";
    button.style.fontWeight = "700";
    button.style.cursor = "pointer";
    button.style.minWidth = "132px";
    button.style.transition = "transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease";
    button.style.boxShadow = "0 10px 20px rgba(254, 120, 26, 0.24)";
    button.style.flex = "0 0 auto";

    var helper = document.createElement("div");
    helper.textContent = "We'll remind you during app setup.";
    helper.style.fontSize = "12px";
    helper.style.lineHeight = "1.4";
    helper.style.fontWeight = "600";
    helper.style.color = "#b45309";
    helper.style.textAlign = "center";
    helper.style.opacity = "0";
    helper.style.transform = "translateY(-4px)";
    helper.style.transition = "opacity 180ms ease, transform 180ms ease";
    helper.style.pointerEvents = "none";

    var resetTimer = null;

    button.addEventListener("click", function () {
      button.style.transform = "scale(0.98)";
      void copyText(affiliate.promoCode).then(function (successful) {
        if (successful) {
          button.textContent = "✅ Copied!";
          button.style.background = "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)";
          button.style.boxShadow = "0 10px 20px rgba(34, 197, 94, 0.22)";
          helper.style.opacity = "1";
          helper.style.transform = "translateY(0)";

          if (resetTimer) {
            clearTimeout(resetTimer);
          }

          resetTimer = setTimeout(function () {
            button.textContent = "Copy Code";
            button.style.background = "linear-gradient(135deg, #fe781a 0%, #f97316 100%)";
            button.style.boxShadow = "0 10px 20px rgba(254, 120, 26, 0.24)";
            button.style.transform = "scale(1)";
            helper.style.opacity = "0";
            helper.style.transform = "translateY(-4px)";
          }, 3000);

          log("promo code copied", {
            promoCode: affiliate.promoCode,
          });
          return;
        }

        button.textContent = "Copy failed";
        button.style.transform = "scale(1)";
        setTimeout(function () {
          button.textContent = "Copy Code";
        }, 1800);
      });
    });

    copy.appendChild(title);
    copy.appendChild(subtitle);
    inner.appendChild(copy);
    buttonWrap.appendChild(button);
    buttonWrap.appendChild(helper);
    inner.appendChild(buttonWrap);
    wrapper.appendChild(inner);

    var style = document.createElement("style");
    style.textContent =
      "@" +
      "media (max-width: 767px) {" +
      "#" +
      BANNER_ID +
      " { padding: 10px 12px; }" +
      "#" +
      BANNER_ID +
      " [role='status'] { width: 100%; }" +
      "#" +
      BANNER_ID +
      " div { box-sizing: border-box; }" +
      "#" +
      BANNER_ID +
      " button { width: 100%; min-width: 0; }" +
      "}";
    wrapper.appendChild(style);

    document.body.insertBefore(wrapper, document.body.firstChild);
  }

  async function trackAffiliateClick(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) {
      log("affiliate_clicks insert skipped: empty referral");
      return false;
    }

    var affiliate = await resolveAffiliate(normalizedReferral);
    if (!affiliate) {
      log("no valid affiliate match", {
        referral: normalizedReferral,
      });
      return false;
    }

    storeReferral(normalizedReferral);
    updateStoreLinks(normalizedReferral);
    createBanner(affiliate);

    var payloads = buildClickPayloads(affiliate, normalizedReferral, getCampaignContext());

    for (var index = 0; index < payloads.length; index += 1) {
      if (await insertAffiliateClick(payloads[index])) {
        return true;
      }
    }

    return false;
  }

  async function hydrateStoredReferralBanner(referral) {
    var normalizedReferral = normalizeReferral(referral);
    if (!normalizedReferral) {
      return;
    }

    updateStoreLinks(normalizedReferral);

    var affiliate = await resolveAffiliate(normalizedReferral);
    if (!affiliate) {
      log("no valid affiliate match", {
        referral: normalizedReferral,
      });
      return;
    }

    createBanner(affiliate);
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
      void hydrateStoredReferralBanner(storedReferral);
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
