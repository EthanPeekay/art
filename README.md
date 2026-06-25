# Medawa Showroom

A dual-sided showroom and exhibition platform for African sculpture and painting — artists exhibit and sell directly, collectors browse, follow, bid, and buy.

Built with Next.js 14 (App Router, TypeScript), Supabase (Postgres + Auth + Storage + Realtime), and Tailwind CSS.

## What's included

- **Audience side**: showroom catalog with filters (medium, region, price, sale type), artwork detail pages, artist profiles, a following-based feed with likes/comments, live bidding, checkout flow, and order history.
- **Artist side** (`/dashboard`): CRUD for artworks (with image/video upload to Supabase Storage), profile management, feed post composer, order tracking, and a subscription billing UI (Monthly / Quarterly / Yearly).
- **RBAC**: middleware-enforced role checks (`/dashboard` requires an `artist` role), backed by Postgres Row Level Security so the database itself enforces who can read/write what — not just the UI.
- **Bidding**: a `place_bid` Postgres function handles concurrent bids atomically (row-locks the auction, validates the increment, applies the bid) so two people bidding at the same instant can't corrupt the auction state. Supabase Realtime pushes the updated high bid to every viewer instantly.
- **Payments**: intentionally **not** wired to a live gateway (Paystack/Flutterwave require business verification I can't do on your behalf). Checkout and subscription "payment" steps are clearly marked stubs that mark records as paid/active directly — see the `PAYMENT INTEGRATION POINT` comments in `src/components/audience/CheckoutForm.tsx` and `src/components/artist-dashboard/SubscribeButton.tsx`.

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and grab your project URL + anon key from **Settings → API**.

### 2. Run the database migrations

In the Supabase dashboard, open the **SQL Editor** and run, in order:

1. `supabase/migrations/0001_init_schema.sql` — tables, enums, RLS policies, triggers, and the `place_bid` function
2. `supabase/migrations/0002_storage_buckets.sql` — storage buckets for artwork media and avatars

(Or use the Supabase CLI: `supabase db push` if you've linked the project.)

### 3. Configure auth

In **Authentication → Providers**, email/password is enabled by default. For faster local testing, you can disable "Confirm email" under **Authentication → Settings** so signups work immediately without checking an inbox — re-enable it before going live.

### 4. Enable Realtime on the auctions table

In **Database → Replication**, make sure the `auctions` table has Realtime enabled (it should be by default for new projects, but worth checking) — this is what makes the live bid ticker update instantly for every viewer.

### 5. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PLATFORM_FEE_RATE=0.10
```

### 6. Install and run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### 7. (Optional) Seed sample data

Sign up as an artist through the app's `/signup` page first (choose the "Artist" role), then run `supabase/seed.sql` in the SQL Editor to attach a couple of sample artworks, an active auction, and a feed post to that artist.

## Connecting real payments

When you're ready to charge real money:

1. **Checkout** (`src/components/audience/CheckoutForm.tsx`): replace the direct `orders` update with a redirect to Paystack/Flutterwave's checkout, passing `order.amount` and `order.currency`. Mark the order `paid` only from a server-side webhook handler that verifies the gateway's signature — never trust a client-side redirect alone to confirm payment.
2. **Subscriptions** (`src/components/artist-dashboard/SubscribeButton.tsx`): same pattern — initiate the charge with the gateway, and only insert the `artist_subscriptions` row (and flip `artist_profiles.subscription_status` to `active`) once the webhook confirms success.
3. You'll want a `/api/webhooks/paystack` (or `/flutterwave`) route handler using the Supabase **service role key** (not the anon key) to write these confirmed states, since webhook requests won't carry a logged-in user's session.

For Zimbabwe-based payouts specifically, also look at EcoCash's merchant API alongside Paystack/Flutterwave, since mobile money coverage varies by gateway — see the `payouts` table, which is already structured to record `payout_method` per artist.

## Project structure

```
src/
  app/                    routes (App Router)
    (marketing pages live at root: /, /showroom, /artwork/[id], /artists, /feed)
    dashboard/            artist-only routes, RBAC-gated by middleware
    account/              audience account + order history
    checkout/[orderId]/   checkout flow
  components/
    ui/                   Button, Badge — shared primitives
    showroom/             ArtworkCard, BidTicker, BidPanel, filters
    artist-dashboard/     CRUD forms, billing, post composer
    audience/             FollowButton, PostCard, CheckoutForm
    shared/                SiteHeader, auth forms
  lib/
    supabase/             browser/server/middleware Supabase clients
    data/                 server-side data access functions
    types/                TypeScript types mirroring the DB schema
supabase/
  migrations/             SQL migrations — run these in order
  seed.sql                optional sample data
```

## Design notes

The visual identity (charcoal/parchment/sienna/gold palette, Fraunces + Inter + IBM Plex Mono type system, museum-label artwork cards, and the kiln-gauge bid ticker) is documented inline in `src/app/globals.css`. Fonts load via a Google Fonts `@import` in `globals.css` rather than `next/font/google`, since some sandboxed build environments can't reach `fonts.googleapis.com` at build time — this is a non-issue for normal local dev or Vercel deploys, but worth knowing if you ever see fonts fall back to system serif/sans in a locked-down CI environment.
