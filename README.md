# Premium Store (Prototype)

Prototype ultra-premium responsive e-commerce demo built with Node.js, Express, MongoDB (optional), and Cloudinary for image uploads.

Quick start:

1. Copy `.env.example` to `.env` and fill values (MongoDB URI and Cloudinary credentials).
2. Install dependencies:

```bash
npm install
```

3. Run server:

```bash
npm run dev
```

4. Open browser: http://localhost:3000

Notes:
- Admin endpoints accept header `x-admin-key: admin-secret` for demo admin actions.
- If MongoDB is not available, the server falls back to demo in-memory products.
