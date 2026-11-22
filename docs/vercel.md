# Deploy incnet on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet&project-name=incnet&repository-name=incnet&env=APP_SECRET&envDescription=A%20long%20random%20string%20%2832%2B%20characters%29%20that%20signs%20sign-ins%20and%20encrypts%20payment%20keys&envLink=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet%2Fblob%2Fmain%2Fdocs%2Fvercel.md)

1. Click **Deploy with Vercel**. Vercel copies incnet into your GitHub account and asks for one value:
   **`APP_SECRET`**, a long random string. Generate one with `openssl rand -base64 48` or any password generator, 32 or more characters.
2. Add a database. In the new project, open **Storage → Create Database → Neon** (free tier) and connect it to the project.
   Neon and Prisma Postgres set `DATABASE_URL` for you. You can also paste any Postgres URL as `DATABASE_URL` (Supabase works).
3. Redeploy: **Deployments → … → Redeploy**. The build creates incnet's tables automatically.
4. Open the site and create the first account. It becomes the owner.

That's all. On Vercel, incnet works out its own address. When you add your own domain, also set `APP_URL=https://your.domain`.

## Good to know

| Topic | Details |
|---|---|
| Router check-ins | Each router calls incnet every 4 seconds, and each call is a function invocation. On the **Hobby** plan, set `ROUTER_SYNC_SECONDS=8` (about 325,000 calls per router per month). For several routers, use **Pro** or a VPS. |
| Commercial use | Vercel's Hobby plan is for non-commercial projects. Use Pro for a paying business. |
| Shared database | To keep incnet in a Postgres database that other apps also use, set `DATABASE_SCHEMA=incnet`. Its tables then stay in their own schema. |
| Pooled connections | With a pooled URL, such as Supabase on port 6543, also set `DIRECT_URL` to the direct URL, which is used for table changes. Neon's `DATABASE_URL_UNPOOLED` is picked up automatically. |
| Hosted mode | To run incnet as a service for other businesses, set `INCNET_CLOUD=true`. This turns on plans, open sign-up and the live demo. |
