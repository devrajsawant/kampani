# Kampani Capital

A component-based static website using the supplied section designs. No build or package installation is required.

## Preview

From this directory, run:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. Use an HTTP server rather than opening `index.html` directly: the page fetches its HTML components and uses JavaScript modules.

## Components

- `components/navbar.html`: logo, desktop navigation, and mobile menu.
- `components/hero.html`: background image, headline, and expertise link.
- `components/about.html`: company introduction.
- `components/offerings.html`: expertise cards.
- `components/network.html`: locations carousel and network information.

- `components/people.html`: management and advisory teams.
- `components/perspectives.html`: CEO insights carousel.
- `components/events.html`: events carousel.
- `components/careers.html`: current job openings.
- `components/contact.html`: contact form.
- `components/footer.html`: footer navigation and contact information.

Each HTML component retains its supplied scoped styles. `css/style.css` contains page-wide defaults. `js/main.js` loads the components; the modules in `js/components/` initialize their interactions after loading.

Images and Google Fonts use the original external URLs and require internet access. Events, perspectives, careers, and contact use the Google Apps Script endpoint supplied with the snippets. Contact submissions occur only when a visitor submits the form. Application submissions occur only when a visitor submits the job application form.

## Detail pages

- `blogs/index.html` (`/blogs/?id=…`): loads the selected CEO’s Desk article.
- `disclaimer/index.html` (`/disclaimer/`): supplied disclaimer content.
- `job-details/index.html` (`/job-details/?id=…`): loads the selected job and its application form, including PDF/DOC/DOCX resume validation (maximum 2 MB).

These pages reuse the navbar and footer via `js/page.js`, with page markup in `components/` and behavior in `js/components/`. Directory routes work with the static preview server without rewrite rules. Article and job IDs are passed through query parameters to the supplied Google Apps Script service. Missing IDs, unavailable records, network errors, and loading timeouts have visible messages.
