# Family Photos

A private shared photo gallery for the Chickadee Bandit hub.

## Features

- Upload photos via button or drag & drop (any household member)
- Create named albums — birthdays, trips, milestones (adults only)
- Delete photos and albums (adults only)
- Full-screen lightbox with keyboard and swipe navigation
- Lazy-loaded image grid with shimmer placeholders
- All Photos view across all albums

## Permissions

| Action         | Everyone | Adults |
|---------------|----------|--------|
| Browse photos | ✓        | ✓      |
| Upload photos | ✓        | ✓      |
| Create albums | —        | ✓      |
| Delete photos | —        | ✓      |
| Delete albums | —        | ✓      |

## Development

```bash
npm install
npm run dev     # http://localhost:3001
npm test        # run vitest
npm run build   # generate dist/bundle.json
```

After cloning, wire up the git hook:

```bash
git config core.hooksPath .githooks
```

## Storage

- `storage: "db"` — albums and photo metadata in SQLite
- `__FILES_URL` — actual image files via hub file storage (up to 5 GB)

## Release

Push to `main` → GitHub Actions builds `dist/bundle.json`, creates a release, and outputs the SHA-256 hash for `catalog.json`.
