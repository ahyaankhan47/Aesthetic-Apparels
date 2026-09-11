# Website update — 10 September 2026

Approved accessibility, privacy, inquiry and performance changes. Production pages replace the experimental labels and restore submission through the existing Web3Forms connection. No real inquiry was sent during automated validation.

## Included

- Clearer contrast, placeholders, focus and field labels; decorative/meaningful alt text; reduced-motion support.
- Minimal inquiry payload, explicit privacy acknowledgement, optional project fields, detailed error/success feedback and duplicate-click/short cooldown handling.
- hCaptcha loads only after Enable verification; an equally visible Email instead option is available. Turn off verification & reload stops the loaded page service and clears the form.
- Privacy and cookies notices reflecting the live code. Confirmed legal name: Aesthetic Apparels; worldwide service. All website contact links use contactus.aestheticapparels@gmail.com.
- Compressed reusable image assets, compact local fonts/licenses, favicon, unique page metadata, sitemap and a genuine GitHub Pages 404 page. Legacy home URL redirects to the homepage.
- CSP and no-referrer metadata; no inline executable scripts, automatic advertising/analytics scripts, campaign submission fields or browser storage added.
- Publishing action versions pinned to verified official commits, public advisory inventory reviewed, weekly Dependabot checks for GitHub Actions, and a deploy allowlist that excludes these notes and tests from the website.

## Account and business checks

The existing Web3Forms submission key is public by design and was preserved. Its destination inbox cannot be verified from source. Confirm in Web3Forms that it delivers to contactus.aestheticapparels@gmail.com and that hCaptcha is enabled as the mandatory Block Spam option. Frontend checks do not replace provider enforcement. Provider-side quotas, field validation, mailbox access and retention require account verification.

The owner has not supplied a postal address/jurisdiction or business retention/deletion schedule. Policy pages use confirmed contact facts and describe provider retention without inventing those business details. These notices are not a worldwide legal compliance certification. Add the missing business disclosures after confirming applicable obligations.

This is a static site: it has no application database, passwords, protected records or first-party login sessions. Database keys, RLS, record permissions, SQL queries, password hashing and session-cookie controls are not applicable to the current architecture. No real privileged secret was found by the bounded local-history/source review, and no history rewrite was performed.

GitHub Pages does not support arbitrary custom HTTP response headers. Full HTTP anti-framing, Permissions-Policy and other host-dependent headers from the local experiment cannot be enabled by these static files alone. A supporting host/proxy is needed for those controls. HTTPS remains supplied by GitHub Pages.

## Validation

Source structure/local references, JavaScript parsing and form behavior are checked in tests. Submission and CAPTCHA paths use test doubles; no real email is sent. These checks do not verify a real CAPTCHA challenge, provider inbox delivery, account configuration or a full rendered-page accessibility audit.
