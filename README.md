# Ladesar website

A static, single-page site: `index.html`, `css/styles.css` and `js/main.js`, with no build step. Open `index.html` in a browser, or upload the folder to any static host.

## Phased release

`index.html` contains every section of the full site. Build the version for a phase, then upload the contents of `dist/`:

```
python release.py 1   # Coming Soon: hero, story, register interest, contact   (Fri 2 Oct 2026)
python release.py 2   # adds booking bar, Rooms & Suites, Dining               (Mon 12 Oct 2026)
python release.py 3   # adds Experiences, Gallery, Weddings, Reviews           (Fri 16 Oct 2026)
```

Sections are marked in `index.html` with `<!--phase:N-->…<!--/phase:N-->` (included from phase N onwards) and `<!--only:N-->…<!--/only:N-->` (phase N only). The build removes later sections from the page completely, so unreleased placeholder content never reaches the live site. In phase 1, every "Book" link goes to the register-interest form.

## Before launch: replace these placeholders

| What | Where |
|---|---|
| Address, phone, email, WhatsApp number | `index.html`: contact section, footer, header menu, `wa.me/…` links, JSON-LD block in `<head>` |
| Map location | `index.html`: the `<iframe>` in `#contact` (change the `q=` value) |
| Opening date for the countdown (now 21 Oct 2026) | `data-launch` on `#launch` (ISO date with timezone). The banner hides itself after the date passes. |
| Room rate (₹1,500) | the price in `#rooms` **and** `data-rate` on `#booking-form` (used for the estimate) |
| Menu items and prices | `#menu` tab panels |
| Guest reviews | `#reviews`. **The current reviews are samples. Replace them with genuine reviews.** |
| Social media URLs | footer `.social` list |
| Domain and share image | `canonical`, `og:url`, `og:image` in `<head>` |

## Photography

Every image slot is a styled `.art` placeholder with a descriptive `aria-label`. To use a real photo, replace the inner `<svg>` with an `<img>` (the frame shape is kept):

```html
<div class="art art--arch"><img src="images/heritage-room.jpg" alt="Heritage Room with carved wooden doors" loading="lazy" width="800" height="680"></div>
```

## Forms

The booking, table, event and contact forms validate in the browser and show a confirmation message, but **they don't send data anywhere yet**. To send submissions, add `data-endpoint="https://…"` to a form (e.g. a Formspree, Netlify Forms or CRM webhook URL). The form then POSTs JSON to that address. Each form has a hidden honeypot field to catch spam bots.
