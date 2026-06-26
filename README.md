# Quizexa

AI-powered quiz app built with Next.js, Neon Postgres, NextAuth, and Google Gemini.

## Local development

1. Create a database at [Neon](https://console.neon.tech).
2. Copy `.env.example` to `.env` and fill in your credentials.
3. Sync the schema and start the app:

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### 1. Push to GitHub

Make sure your latest code is on GitHub. Do not commit `.env`.

### 2. Import into Vercel

- Go to [vercel.com](https://vercel.com) → **Add New Project**
- Import your GitHub repo
- Framework preset: **Next.js**
- Build command: `npm run build`
- Install command: `npm install`

### 3. Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for **Production**, **Preview**, and **Development**:

| Variable | Local example | Production example |
|----------|---------------|-------------------|
| `DATABASE_URL` | Neon pooled URL | Same Neon pooled URL |
| `DATABASE_URL_UNPOOLED` | Neon direct URL | Same Neon direct URL |
| `NEXTAUTH_SECRET` | random string | same or new secret |
| `NEXTAUTH_URL` | `http://localhost:3000` | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | from Google Cloud | same client ID |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud | same secret |
| `GEMINI_API_KEY` | from Google AI Studio | same key |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` | `gemini-2.5-flash-lite` |

### 4. Sync database tables

Run once locally (using your Neon URLs in `.env`):

```bash
npx prisma db push
```

This creates `User`, `Account`, `Game`, `Question`, and related tables on Neon.

### 5. Configure Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

**Authorized JavaScript origins**
```
https://your-app.vercel.app
http://localhost:3000
```

**Authorized redirect URIs**
```
https://your-app.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### 6. Deploy

Click **Deploy** or push a new commit. After changing env vars, always **Redeploy**.

### 7. Test production

1. Open your Vercel URL
2. Sign in with Google
3. Create a quiz from the dashboard
4. Play an MCQ or open-ended game

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Server error on homepage | Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL` |
| Google sign-in fails | Update OAuth redirect URI to production URL |
| Quiz creation fails | Check `GEMINI_API_KEY` in Vercel |
| Database errors | Verify `DATABASE_URL` / `DATABASE_URL_UNPOOLED` and run `npx prisma db push` |
| Build fails on `maxDuration` | Hobby plan max is 300s (already configured in `api/questions`) |

Check **Vercel → Deployments → Logs** for runtime errors.
