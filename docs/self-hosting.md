# Self-hosting the incnet server

The incnet server runs the dashboard, the Wi-Fi pages and the router check-ins. You can use incnet Cloud, or run your own server on any of these:

- **A Raspberry Pi** (4 or 5, 64-bit OS) at home or in the shop, with a domain pointing at it
- **A VPS** from any provider, with 1 GB RAM or more
- **Shared hosting** with Node.js support (cPanel or similar), using a hosted Postgres database

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

## Shared hosting (cPanel "Setup Node.js App")

Shared hosts usually offer MySQL only. incnet needs **PostgreSQL**, so create a free Postgres database at Supabase or Neon and copy its connection string.

1. Build incnet on your computer. You need Node 22 or newer.

   ```bash
   git clone https://github.com/depriver-tech/incnet.git && cd incnet
   npm install
   DATABASE_URL="<your postgres url>" npx prisma db push
   npm run build
   ```

2. Upload these to a folder on the host, for example `~/incnet`:
   - The contents of `.next/standalone/`
   - `.next/static`, uploaded to `.next/static` in that folder
   - The `public/` folder

3. In cPanel → **Setup Node.js App**, create an app:
   - Node 20 or newer
   - Application root: `incnet`
   - Startup file: `server.js`

4. Add the environment variables:
   - `DATABASE_URL`
   - `APP_URL` (your https address)
   - `APP_SECRET` (`openssl rand -base64 48`)

   Then click **Restart**.

5. Make sure the domain has SSL. Most hosts offer free AutoSSL.

Routers check in every few seconds. On busy shared hosting, raise `ROUTER_SYNC_SECONDS` to 8–10 to stay within your host's limits.

## Manual setup

```bash
cp .env.example .env    # set DOMAIN, APP_URL, APP_SECRET
docker compose --profile https up -d
```

If you already run nginx or Traefik in front of port 3000, start it without Caddy:

```bash
docker compose up -d
```
