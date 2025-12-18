# Hill Peak Holdings, LLC — Broker-Friendly Buyer Profile (Static Site)

Single-page landing site for **Hill Peak Holdings, LLC** where business brokers can submit acquisition opportunities.

## Files

- `index.html`: page content + broker submission modal
- `styles.css`: shared visual system (container, sections, cards, buttons, modal, etc.)
- `script.js`: accessible modal behavior + Formspree form submission
- `buyer-profile.pdf`: downloadable one-page buyer profile (generated from `buyer-profile.html`)
- `buyer-profile.html`: print-friendly buyer profile page (you can “Print to PDF”)
- `logo.svg`: simple brand mark used in the header

## Local preview

Open `index.html` in a browser.

If you want a local static server:

```bash
npx --yes serve .
```

## Form submissions (Formspree)

The broker form posts via `fetch()` to the Formspree endpoint defined on the form:

- In `index.html`, the form includes:
  - `data-formspree-endpoint="https://formspree.io/f/xbdrjdwn"`

### Where submissions go

- Log into Formspree and open your form `xbdrjdwn` to view submissions.
- If you change the endpoint in the future, update the `data-formspree-endpoint` attribute.

### Anti-spam

- The form includes a hidden honeypot field named `_gotcha`.
- If `_gotcha` is filled, the script treats it as a success and does not send the request.

## Deploy to Cloudflare Pages (static)

### 1) Create a GitHub repo

1. Create a new repo on GitHub (e.g. `hill-peak-holdings-buyer-profile`).
2. In your project folder, initialize git and commit:

```bash
git init
git add index.html styles.css script.js README.md
git commit -m "Initial static site"
```

3. Add your GitHub remote and push:

```bash
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

### 2) Create the Cloudflare Pages project

1. In Cloudflare Dashboard, go to **Pages** → **Create a project**.
2. Connect your GitHub repo.

### 3) Build settings (static)

- **Framework preset**: None
- **Build command**: *(leave empty)*
- **Build output directory**: `/` (root)

Deploy.

### 4) Optional: Custom domain

In Cloudflare Pages:

- **Custom domains** → add your domain
- Follow Cloudflare’s DNS instructions

## Buyer profile PDF

The page links to `./buyer-profile.pdf` and the repo includes a generated PDF.

- To replace it with your own PDF: overwrite `buyer-profile.pdf`, commit, and push.

## Optional: Generate a PDF from the included buyer profile page

`buyer-profile.html` is designed to be print-friendly.

- Open `buyer-profile.html` in your browser
- Use the browser’s **Print** dialog
- Choose **Save as PDF**

### Regenerate `buyer-profile.pdf` (headless Chrome)

If you have Google Chrome installed, you can regenerate the PDF from the HTML:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --print-to-pdf="buyer-profile.pdf" "file:///ABSOLUTE_PATH_TO/buyer-profile.html"
```

## Optional: Use a different POST endpoint (instead of Formspree)

If you want to post to your own API, there’s a clearly commented fallback in `script.js`:

- Add a new `data-post-endpoint="https://your-api.example.com/submit"` to the form
- Update the `fetch()` call as described in the comment block


