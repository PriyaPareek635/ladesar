# Ladesar website

A static, single-page site: `index.html`, `css/styles.css` and `js/main.js`. `release.py` builds the version to publish into `dist/`. To preview, run `python release.py 3` and open `dist/index.html`. Opening `index.html` directly shows `{{placeholders}}` instead of the contact details.

## Contact details: `site.json`

The phone number, WhatsApp number, email and site address live in `site.json`, not in the page:

```json
{
  "phone": "+91 1564 000000",
  "whatsapp": "+91 86396 74378",
  "email": "priyapareek635@gmail.com",
  "site_url": "https://www.ladesar.com"
}
```

- **Where they appear:** every build fills them into the header menu, contact section, footer, WhatsApp buttons, form messages and search-engine details.
- **To change one:** edit `site.json`, run `python release.py N` again, and re-upload `dist/`.
- **Format:** write numbers with the country code; spaces are fine.
- **Checks:** the build stops with a message if a number is too short, the country code is missing, or the email address looks wrong.

The email address that *receives* form submissions is set in Netlify (see below), not in `site.json`.

## Phased release

`index.html` contains every section of the full site. Build the version for a phase, then upload the contents of `dist/`:

```
python release.py 1   # Coming Soon: hero, story, register interest, contact   (Fri 2 Oct 2026)
python release.py 2   # adds booking bar, Rooms & Suites, Dining               (Mon 12 Oct 2026)
python release.py 3   # adds Experiences, Gallery, Weddings, Reviews           (Fri 16 Oct 2026)
```

Sections are marked in `index.html` with `<!--phase:N-->…<!--/phase:N-->` (included from phase N onwards) and `<!--only:N-->…<!--/only:N-->` (phase N only). The build removes later sections from the page completely, so unreleased placeholder content never reaches the live site. In phase 1, every "Book" link goes to the register-interest form.

## Publishing on Netlify

First release (Phase 1):

1. Run `python release.py 1`.
2. Go to <https://app.netlify.com/drop>, sign in, and drag the `dist` folder onto the page. The site goes live at a `*.netlify.app` address.
3. In **Site configuration → General → Site details → Change site name**, set the name, e.g. `ladesar` → `ladesar.netlify.app`.
4. In **Forms**, click **Enable form detection**, then open **Deploys** and drag the `dist` folder in again so Netlify picks up the forms.
5. In **Forms → Form notifications → Add notification → Email notification**, enter the email address that should receive submissions.

Each later phase: run `python release.py 2` (or `3`), then drag `dist` onto **Deploys** for the same site. Netlify detects any new forms in that phase automatically.

**What happens when a guest submits a form:**
- **Email:** Netlify stores the submission and emails it to you.
- **WhatsApp:** WhatsApp opens on the guest's device with their details typed out, addressed to the `whatsapp` number in `site.json`. The guest presses Send.

Emails only work on the live site. When `index.html` is opened from disk, only WhatsApp opens.

## Before launch: replace these placeholders

| What | Where |
|---|---|
| Phone, WhatsApp, email, site address | `site.json` |
| Street address | `index.html`: contact section, footer, JSON-LD block in `<head>` |
| Map location | `index.html`: the `<iframe>` in `#contact` (change the `q=` value) |
| Opening date for the countdown (now 21 Oct 2026) | `data-launch` on `#launch` (ISO date with timezone). The banner hides itself after the date passes. |
| Room rate (₹1,500) | the price in `#rooms` **and** `data-rate` on `#booking-form` (used for the estimate) |
| Menu items and prices | `#menu` tab panels |
| Guest reviews | `#reviews`. **The current reviews are samples. Replace them with genuine reviews.** |
| Social media URLs | footer `.social` list |
| Share image for link previews | add `assets/og-image.jpg` (1200 × 630) |

## Photography

Every image slot is a styled `.art` placeholder with a descriptive `aria-label`. To use a real photo, replace the inner `<svg>` with an `<img>` (the frame shape is kept):

```html
<div class="art art--arch"><img src="images/heritage-room.jpg" alt="Heritage Room with carved wooden doors" loading="lazy" width="800" height="680"></div>
```

## Forms

The booking, table, event and contact forms validate in the browser and show a confirmation message, but **they don't send data anywhere yet**. To send submissions, add `data-endpoint="https://…"` to a form (e.g. a Formspree, Netlify Forms or CRM webhook URL). The form then POSTs JSON to that address. Each form has a hidden honeypot field to catch spam bots.
