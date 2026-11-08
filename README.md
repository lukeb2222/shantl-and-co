# Shantl & Co Barber Shop — Website

A one-page, animated website for **Shantl & Co Barber Shop**, 133 E 84th St (between Park and Lex), New York, NY 10028.

- **Book online:** https://shantlbarbershop.resurva.com/book
- **Phone:** (212) 837-2410

All copy, prices, reviews and photos come from the shop's current website, barbershopny.com.

## Features
- Animated preloader with a barber pole, a letter-by-letter hero reveal, and a slow zoom on the hero image
- Scroll-triggered reveals, image mask wipes, parallax and a barber-stripe scroll progress bar
- Service menu with prices and category filters
- Auto-rotating client reviews
- Press section (New York Times and Michelin Guide)
- A 45-photo gallery with a lightbox (keyboard and swipe)
- Hours with a live "Open now" indicator in New York time, a map, and contact details
- "Book Now" buttons throughout (nav, hero, services, contact, a floating button on mobile) that link to the Resurva booking page
- Responsive, with support for `prefers-reduced-motion`

## Structure
```
index.html    page markup
styles.css    styles & animations
script.js     interactions (no dependencies)
netlify.toml  Netlify config (publish root, image caching)
images/       site, services, press and gallery photos
```

## Run locally
Open `index.html` in a browser, or start a local server:

```bash
python3 -m http.server 8000
```

## Deploy (Netlify)
In Netlify, choose **Add new site → Import an existing project → GitHub → `shantl-and-co`**. `netlify.toml` already sets the publish directory to the repo root, with no build command, so you can accept the defaults and click **Deploy**. Every push to `main` redeploys the site.
