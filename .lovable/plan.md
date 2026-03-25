

## Tracked Affiliate Landing Pages with Lead Capture

### Overview
Create a system where each affiliate gets a unique tracked URL. When someone visits that URL, they see a landing page (similar to the homepage) with a lead capture form right after the hero banner. On submission, the lead is saved linked to the affiliate, and a configurable redirect URL opens in a new tab.

### Database Changes

**1. Add `redirect_url` column to `affiliates` table**
- New nullable text column to store where leads should be redirected after form submission
- Admins/affiliates can configure this URL

**2. Create `affiliate_leads` table**
- `id` (uuid, PK)
- `affiliate_id` (uuid, references affiliates)
- `name` (text, required)
- `phone` (text, required)
- `company_name` (text, required)
- `referral_code` (text) -- for tracking
- `created_at` (timestamptz)
- RLS: public INSERT (anon), SELECT for admin + owning affiliate

### Frontend Changes

**3. New page: `src/pages/AffiliateLanding.tsx`**
- Route: `/i/:referralCode`
- On mount, fetch affiliate info by `referral_code` to validate the link and get the `redirect_url`
- Renders: HeroSection (reused) + Lead capture form (name, phone, company) + remaining landing sections (Features, Benefits, FAQ, etc.)
- The lead form appears right below the hero banner in a highlighted card
- On submit: inserts into `affiliate_leads`, then opens `redirect_url` in new tab via `window.open()`

**4. Update Affiliate Dashboard**
- In `AffiliateOverview`, update the referral link to point to `/i/{referralCode}` instead of `/checkout?ref=`
- Add a "Leads" count card to the overview stats
- Add a new "Leads" tab in the sidebar to list captured leads

**5. Add redirect URL config**
- In the affiliate dashboard, add a settings section or inline edit for the `redirect_url`

### Route Registration
- Add `/i/:referralCode` route in `App.tsx` with lazy-loaded `AffiliateLanding`

### Technical Details
- The lead form uses no authentication (public/anon insert)
- The `referral_code` lookup validates the affiliate exists and is approved
- If no `redirect_url` is configured, fallback to the homepage or WhatsApp link
- Form validation: name required, phone required (Brazilian format), company name required

