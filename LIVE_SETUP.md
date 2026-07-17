# Harmonia Website — Live Services Setup

This build is ready for:

1. Cloudflare Web Analytics
2. Formspree contact-form submissions
3. Stripe-hosted payments

The site still works before these services are activated. To connect them, edit `config.js`.

---

## 1. Formspree contact inbox

Create a Formspree account and a new form. Formspree will provide an endpoint similar to:

`https://formspree.io/f/abcdwxyz`

Paste that entire endpoint into:

```js
formspreeEndpoint: "https://formspree.io/f/abcdwxyz"
```

Also enter the public email visitors should use if the form is temporarily unavailable:

```js
contactEmail: "hello@theharmoniaproject.org"
```

After activation:

- submissions appear in the Formspree dashboard,
- notification emails can be enabled,
- names, emails, phone numbers, interests, and messages are included,
- the form no longer stores private information in the visitor's browser.

---

## 2. Cloudflare Web Analytics

Add the website to Cloudflare Web Analytics. Cloudflare will provide a beacon token.

Paste only the token into:

```js
cloudflareAnalyticsToken: "YOUR_TOKEN"
```

The site will then load Cloudflare's analytics beacon automatically. The Cloudflare dashboard will show anonymous traffic information such as visits, page views, traffic sources, devices, and geography.

Cloudflare analytics does not identify individual visitors. People are identified only when they voluntarily submit the contact form, register, or make a payment.

---

## 3. Stripe payments

In Stripe, create a Payment Link for the correct purpose:

- donation or general support,
- gala or event tickets,
- sponsorship,
- merchandise.

Paste the complete Stripe Payment Link into:

```js
stripePaymentLink: "https://buy.stripe.com/..."
```

The **Support the Project** button will open Stripe's secure hosted checkout. Card details are handled by Stripe and are never stored on the Harmonia website.

Do not describe payments as tax-deductible unless Harmonia or its fiscal sponsor is legally permitted to do so.

---

## Recommended launch flow

1. Create the three accounts or service entries.
2. Paste the Formspree endpoint, Stripe link, Cloudflare token, and public contact email into `config.js`.
3. Test the form and payment button.
4. Deploy the folder through Cloudflare Pages.
5. Connect `TheHarmoniaProject.org`.
6. Review privacy wording before public launch.

---

## Important limitation

This package cannot create or access your private Cloudflare, Formspree, or Stripe accounts. Those services require you to sign in, accept their terms, and—in Stripe's case—complete identity and banking verification. Once the four configuration values are supplied, no redesign is required.
