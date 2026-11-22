'use client';

import { Cloud, Container, Cpu, Server, Triangle } from 'lucide-react';
import { useState } from 'react';
import { CopyButton } from '@/components/CopyButton';

type Tab = { id: string; icon: typeof Cloud; label: string; title: string; steps: string[]; code?: string; cta?: { href: string; label: string }; note: string };

/** Every way to run incnet, side by side on the landing page. */
export function HostTabs({ deployUrl, releasesUrl, docsUrl }: { deployUrl: string; releasesUrl: string; docsUrl: string }) {
  const tabs: Tab[] = [
    { id: 'cloud', icon: Cloud, label: 'incnet Cloud', title: 'Nothing to install', steps: ['Create an account', 'Add your router and paste the script', 'Start selling'], cta: { href: '/signup', label: 'Start free' }, note: 'We run the servers, backups and updates.' },
    { id: 'vercel', icon: Triangle, label: 'Vercel', title: 'One click, free to start', steps: ['Click Deploy and enter a random APP_SECRET', 'Storage → Create Database → Neon (free)', 'Redeploy: the tables are created for you'], cta: { href: deployUrl, label: 'Deploy with Vercel' }, note: 'incnet works out its own address on Vercel. Use Pro for a paying business.' },
    { id: 'vps', icon: Cpu, label: 'VPS or Raspberry Pi', title: 'One command, automatic HTTPS', steps: ['Point your domain at the machine', 'Run the command below', 'Open your domain and create the owner account'], code: 'curl -fsSL https://raw.githubusercontent.com/depriver-tech/incnet/main/scripts/install.sh | sudo DOMAIN=wifi.example.com bash', note: 'Installs Docker, Postgres and Caddy (Let’s Encrypt). Run again to update.' },
    { id: 'shared', icon: Server, label: 'Shared hosting', title: 'cPanel, Plesk, Hostinger, DirectAdmin', steps: ['Download incnet-node.zip and unzip it in your account', 'Setup Node.js App → startup file: app.js', 'Add DATABASE_URL, APP_URL and APP_SECRET, then start'], cta: { href: releasesUrl, label: 'Download incnet-node.zip' }, note: 'Needs Node.js 20+ and a Postgres database (a free Supabase or Neon one works). Tables are created on first start.' },
    { id: 'docker', icon: Container, label: 'Docker', title: 'Your own setup', steps: ['Clone the repository', 'Copy .env.example to .env and fill it in', 'Start it'], code: 'git clone https://github.com/depriver-tech/incnet && cd incnet && cp .env.example .env && docker compose --profile https up -d', note: 'Leave out --profile https if you already run nginx or Traefik.' },
  ];
  const [active, setActive] = useState('vercel');
  const t = tabs.find((x) => x.id === active)!;
  return (
    <div className="ht">
      <div className="ht-tabs" role="tablist">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button key={id} role="tab" aria-selected={active === id} className={`ht-tab${active === id ? ' on' : ''}`} onClick={() => setActive(id)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      <div className="ht-panel card" role="tabpanel">
        <h3>{t.title}</h3>
        <ol className="ht-steps">{t.steps.map((s, i) => <li key={s}><span>{i + 1}</span>{s}</li>)}</ol>
        {t.code && <div className="ht-code"><code>{t.code}</code><CopyButton text={t.code} className="btn btn-sm" /></div>}
        <p className="muted small">{t.note}</p>
        <div className="row">
          {t.cta && <a className="btn" href={t.cta.href} target={t.cta.href.startsWith('/') ? undefined : '_blank'} rel="noreferrer">{t.cta.label}</a>}
          <a className="btn btn-ghost" href={docsUrl} target="_blank" rel="noreferrer">Full guide</a>
        </div>
      </div>
    </div>
  );
}
