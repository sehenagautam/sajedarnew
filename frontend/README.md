# Sajedar AI News Frontend

React and Vite frontend for Sajedar AI News.

## Local Development

```bash
npm install
npm run dev
```

The local Vite server proxies `/api` and `/uploads` to `http://localhost:5050`.

## Vercel Deployment

Use these settings in Vercel:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Add this environment variable for Production and Preview:

```text
VITE_API_BASE_URL=https://your-backend-domain.example
```

Replace the value with the deployed backend URL. The frontend calls
`/api/posts`, `/api/categories`, and newsroom endpoints through that backend.

The `vercel.json` file keeps direct links such as `/news/story-slug` and
`/category/AI` working on Vercel.
