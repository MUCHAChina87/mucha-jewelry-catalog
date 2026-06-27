# MUCHA Stripe Checkout Setup

This catalogue can run as a static GitHub Pages site for browsing, but Stripe checkout needs a small backend so the secret key stays private.

## 1. Deploy on Vercel

1. Go to <https://vercel.com/new>.
2. Import `MUCHAChina87/mucha-jewelry-catalog`.
3. Keep the default settings and deploy.

## 2. Add Environment Variables

In Vercel, open the project settings and add:

- `STRIPE_SECRET_KEY`: your Stripe secret key, starting with `sk_test_` for testing or `sk_live_` for live payments.
- `SITE_URL`: the public Vercel URL, for example `https://your-project.vercel.app`.

Redeploy after adding the variables.

## 3. Current Checkout Rules

- UK delivery only.
- Delivery is `£2.99`.
- Free delivery over `£40` after discounts.
- Sitewide discount: 10% off.
- Dragon Boat / zongzi products `C040`, `C041`, `C042`: 20% off.
- Unpriced products cannot be checked out.

## 4. Test Payment

Use Stripe test mode first. Stripe's standard successful test card is:

`4242 4242 4242 4242`

Use any future expiry date and any CVC.

## 5. Fulfilment Note

Do not ship only because someone reached the success page. Fulfil orders after the successful payment appears in Stripe, or after a webhook is added.
