# blogposts

Technical notes blog with a custom React UI based on the design you supplied.

## Run locally

1. Install dependencies with `npm install`.
2. Start the dev server with `npm run dev`.
3. Open `http://localhost:3000`.

## Content

- The main WIF article lives in [`_posts/2026-06-16-workload-identity-federation-in-gcp.md`](./_posts/2026-06-16-workload-identity-federation-in-gcp.md).
- The React app imports that file as raw markdown and renders it in the reader.
- D2 source diagrams live in [`assets/editable_diagrams/`](./assets/editable_diagrams) and can be rendered with `npm run render:diagrams`.

## Notes

- The current UI comes from the zip you provided, then I trimmed it toward a blog-first layout.
- Screenshot placeholders are still in the post so you can drop in your own images later.
