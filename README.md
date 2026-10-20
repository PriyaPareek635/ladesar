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

- **Where they appear:** every build fills them into the header menu, contact section, footer, WhatsApp buttons and search-engine details.
- **To change one:** edit `site.json`, run `python release.py N` again, and re-upload `dist/`.
- **Format:** write numbers with the country code; spaces are fine.
- **Checks:** the build stops with a message if a number is too short, the country code is missing, or the email address looks wrong.

## Phased release

`index.html` contains every section of the full site. Build the version for a phase, then upload the contents of `dist/`:

```
python release.py 1   # Coming Soon: hero, story, register interest, contact   (Fri 2 Oct 2026)
python release.py 2   # adds booking bar, Rooms & Suites, Dining               (Mon 12 Oct 2026)
python release.py 3   # adds Experiences, Gallery, Weddings, Reviews           (Fri 16 Oct 2026)
```

Sections are marked in `index.html` with `<!--phase:N-->…<!--/phase:N-->` (included from phase N onwards) and `<!--only:N-->…<!--/only:N-->` (phase N only). The build removes later sections from the page completely, so unreleased placeholder content never reaches the live site. In phase 1, every "Book" link goes to the register-interest form.

## Publishing on Netlify

The site is connected to Netlify through GitHub. Netlify reads `netlify.toml`, runs `release.py` for the phase named there, and publishes only `dist/`.

- **To publish a change:** commit and push to GitHub. Netlify rebuilds within a couple of minutes.
- **To change phase:** edit the number in `command = "python3 release.py 3"` in `netlify.toml`, then push.
- **To check first:** run `python release.py 3 --preview` and open http://localhost:8000. The command also prints an address for a phone on the same Wi-Fi.

## Forms

Every form (room booking, table, events, contact, and register interest in Phase 1) sends the guest's details to the hotel on WhatsApp:

- **Validation:** the form checks the guest's details in the browser. The mobile number needs the right length for the chosen country code.
- **WhatsApp:** pressing the button opens WhatsApp with the details typed out, addressed to the `whatsapp` number in `site.json`. The guest presses Send.
- **No other copy:** nothing is stored or emailed anywhere else. If a guest closes WhatsApp without sending, the hotel doesn't receive that enquiry.

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
