# Self-hosting the incnet server

The incnet server runs the dashboard, the Wi-Fi pages and the router check-ins. You can use incnet Cloud, or run your own server on any of these:

- **A Raspberry Pi** (4 or 5, 64-bit OS) at home or in the shop, with a domain pointing at it
- **A VPS** from any provider, with 1 GB RAM or more
- **Shared hosting** with Node.js support (cPanel, Plesk, Hostinger, DirectAdmin), using a hosted Postgres database
- **Vercel**, in one click with a free Neon database

Routers and payment providers must be able to reach your server over **HTTPS with a public certificate**.

## One command (Raspberry Pi or VPS)

First point your domain's DNS (an A record) at the machine. Then run:

```bash
curl -fsSL https://raw.githubusercontent.com/depriver-tech/incnet/main/scripts/install.sh | sudo DOMAIN=wifi.example.com bash
```

The command:

- Installs Docker if it's missing
- Downloads incnet to `/opt/incnet`
- Writes `.env` with new random secrets
- Starts incnet, Postgres and Caddy, which gets a Let's Encrypt certificate automatically

Then open `https://wifi.example.com` and create the first account. It becomes the owner, and sign-up closes after it.

Run the same command again to update. To read the logs:

```bash
cd /opt/incnet && docker compose logs -f app
```

**Behind a home router?** Forward ports 80 and 443 to the Pi. If your ISP doesn't give you a public IP, use a VPS or incnet Cloud instead.

## Shared hosting (cPanel, Plesk, Hostinger, DirectAdmin)

Any shared host with **Node.js 20+** works. Look for "Setup Node.js App", "Node.js" or "Application manager" in your control panel. PHP-only hosting can't run incnet.

1. **Get a PostgreSQL database.** Most shared hosts offer only MySQL. Create a free Postgres database at Supabase or Neon and copy its connection string.
2. **Download `incnet-node.zip`** from the [latest release](https://github.com/depriver-tech/incnet/releases/latest/download/incnet-node.zip). Or build it yourself with `bash scripts/package-node.sh`.
3. **Upload and unzip it** in your hosting account, for example to `~/incnet`, using the File Manager.
4. **Create the Node.js app** with these settings:
   - Node 20 or newer
   - Application root: `incnet`
   - Application URL: your domain
   - **Startup file: `app.js`**
5. **Add the settings** as environment variables in the same screen. You can also copy `.env.example` to `.env` and fill it in.
   - `DATABASE_URL`: your Postgres connection string
   - `APP_URL`: your https address
   - `APP_SECRET`: a random string of 32 or more characters
6. **Start the app**, then open your domain and create the first account.

On first start, `app.js` creates the tables itself from `schema.sql`, so you don't need to run any commands. Make sure the domain has SSL; most hosts offer free AutoSSL.

**To update:** upload the new zip over the old files and restart the app. If a release changes the database, its notes say so. In that case, run `DATABASE_URL=… npx prisma db push` once from a computer with Node installed.

On busy shared servers, set `ROUTER_SYNC_SECONDS=8` to stay within your host's limits.

## Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet&project-name=incnet&repository-name=incnet&env=APP_SECRET&envDescription=A%20long%20random%20string%20%2832%2B%20characters%29%20that%20signs%20sign-ins%20and%20encrypts%20payment%20keys&envLink=https%3A%2F%2Fgithub.com%2Fdepriver-tech%2Fincnet%2Fblob%2Fmain%2Fdocs%2Fvercel.md)

See [vercel.md](vercel.md). It's one click plus a free Neon database.

## Manual setup

```bash
cp .env.example .env    # set DOMAIN, APP_URL, APP_SECRET
docker compose --profile https up -d
```

If you already run nginx or Traefik in front of port 3000, start it without Caddy:

```bash
docker compose up -d
```
