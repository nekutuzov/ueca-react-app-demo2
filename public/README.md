# Public Assets

This folder contains static assets served by Vite.

## Mock Service Worker

After running `npm install`, initialize MSW:

```bash
npx msw init public --save
```

This will create `mockServiceWorker.js` in this folder, which is required for API mocking during development.

## Adding Assets

Place your static assets here:
- Images: `logo.png`, `icon.svg`, etc.
- Fonts: `fonts/`
- Favicon: `favicon.ico`
- Other static files

These files will be copied to the root of the build output.

## Access in Code

Reference assets from the public folder using absolute paths:

```tsx
<img src="/myapp/logo.png" alt="Logo" />
```

Note: Include the base path (`/myapp/`) as configured in `vite.config.ts`.
