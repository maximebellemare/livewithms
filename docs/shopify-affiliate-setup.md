# Shopify Affiliate Tracking Setup

This repo does not contain a Shopify theme, `theme.liquid`, theme app extension, or a Shopify deployment pipeline for `www.livewithms.com`.

That means the React app in this repository is not what renders the live Shopify homepage. To make affiliate tracking run on the real homepage, the script needs to be injected into Shopify itself.

## Recommended MVP

Use:

`https://www.livewithms.com/?ref=sarah`

This is the safe affiliate URL for Shopify because the homepage already exists and can load a script from the theme.

## Shopify asset file

Use this file from the repo:

- [affiliate.js](/Users/maximebellemare/Documents/Codex/2026-04-27/i-have-an-existing-lovable-web/affiliate.js)

Upload it into the Shopify theme as an asset named `affiliate.js`.

This asset:

1. Reads `?ref=sarah`
2. Stores `livewithms_affiliate_ref` in `localStorage`
3. Stores `livewithms_affiliate_ref` in a cookie
4. Looks up the affiliate in Supabase
5. Inserts a row into `affiliate_clicks`
6. Appends `ref` to App Store and Google Play links on the page

## Exactly where to upload it

1. Shopify Admin
2. Online Store
3. Themes
4. On the active theme, click `...`
5. Click `Edit code`
6. Open `Assets`
7. Click `Add a new asset`
8. Upload [affiliate.js](/Users/maximebellemare/Documents/Codex/2026-04-27/i-have-an-existing-lovable-web/affiliate.js)

## Single line to add to `layout/theme.liquid`

Add this immediately before `</body>`:

```liquid
{{ 'affiliate.js' | asset_url | script_tag }}
```

## App Store / Google Play buttons

The asset automatically updates links that already point to:

- `apps.apple.com`
- `play.google.com`
- `market://`

If your Shopify theme uses buttons without those URLs until click time, add these attributes:

```html
<a data-livewithms-app-store href="https://apps.apple.com/your-app-link">App Store</a>
<a data-livewithms-google-play href="https://play.google.com/store/apps/details?id=com.livewithms.app">Google Play</a>
```

## How to test

1. Open `https://www.livewithms.com/?ref=sarah`
2. In browser devtools, confirm:
   - `localStorage.getItem("livewithms_affiliate_ref") === "sarah"`
   - cookie `livewithms_affiliate_ref=sarah`
3. Confirm a row is inserted into `affiliate_clicks`
4. Confirm App Store / Google Play links now include `?ref=sarah`

## Important note

Because Shopify owns routing for `www.livewithms.com`, clean paths like `/sarah` are not the MVP here.

For now, use:

`https://www.livewithms.com/?ref=sarah`
