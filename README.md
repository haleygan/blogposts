# blogposts

Technical notes blog built with React 19 + Vite 6 + Tailwind CSS v4.

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
