# blogposts

Technical notes blog built with React 19 + Vite 6 + Tailwind CSS v4.

**Live site:** https://haleygan.github.io/blogposts/

## Design

The UI is intentionally minimal — modelled after Medium's reading experience. The home page shows a card grid where each post surfaces its title, date, category tag, and an auto-generated thumbnail. Clicking a card opens the post in a clean single-column reader: wide margins, generous line height, a readable font size, and no sidebars or distractions. The header stays fixed for navigation back to the list.

## Deployment

Pushes to `main` trigger a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Installs dependencies with `npm ci`
2. Builds the site with `npm run build` — output goes to `dist/`
3. Copies `dist/index.html` to `dist/404.html` so direct URL loads fall back to the React app instead of a GitHub 404 page
4. Uploads `dist/` as a Pages artifact and deploys it via the official `actions/deploy-pages` action

Vite is configured with `base: '/blogposts/'` in production so all asset paths are correct under the GitHub Pages sub-path.

## Run locally

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Open `http://localhost:3000`.

## Adding a post

1. Create a markdown file in `_posts/` (filename format: `YYYY-MM-DD-slug.md`).
2. Import it as raw text in `src/data/defaultPosts.ts` and add an entry to `DEFAULT_POSTS`.
3. Add a `category` field to get an auto-generated thumbnail on the home page.

## Interactive diagrams

Diagrams are React components in `src/components/diagrams/`. To embed one in a post, add a tag:

```
<Diagram id="your-diagram-id" />
```

Then register the component in `src/components/diagrams/index.ts`.

## Lint

```
npm run lint
```
