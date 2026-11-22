import { APP_URL, SYNC_INTERVAL } from './config';
import type { SyncAccess, SyncPackage } from './sync';

/**
 * Everything incnet sends to a MikroTik router is RouterOS script text.
 *
 * The router always calls out to incnet (never the other way round), so it works behind
 * ISP NAT with no VPN, no port forwarding and no public IP at the venue.
 */

/** Quotes a value for RouterOS script: escapes \ " $ and new lines. */
export function ros(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/\r?\n/g, '\\r\\n')}"`;
}

const appHost = () => new URL(APP_URL).hostname;
const isHttps = () => APP_URL.startsWith('https://');
const certArg = () => (isHttps() ? ' check-certificate=yes' : '');

export const hotspotNet = (subnet: number) => `10.5.${subnet}`;

export function parsePorts(value: string) {
  return value.split(/[\s,]+/).map((p) => p.trim()).filter((p) => /^[A-Za-z0-9._-]{2,32}$/.test(p)).slice(0, 16);
}

/** The sync script that runs on the router every few seconds. */
function syncSource(siteId: string, token: string) {
  return [
    ':global incnetCursor',
    ':global incnetBusy',
    ':if ([:typeof $incnetCursor] != "str") do={ :set incnetCursor "0" }',
    ':if ($incnetBusy != true) do={',
    '  :set incnetBusy true',
    '  :do {',
    '    :local v [/system resource get version]',
    '    :if ([:find $v " "] > 0) do={ :set v [:pick $v 0 [:find $v " "]] }',
    `    :local res [/tool fetch url=(${ros(`${APP_URL}/api/router/${siteId}/sync?c=`)} . $incnetCursor . "&v=" . $v) http-header-field=${ros(`Authorization: Bearer ${token}`)} output=user idle-timeout=15s${certArg()} as-value]`,
    '    :if (($res->"status") = "finished") do={ :local run [:parse ($res->"data")]; $run }',
    '  } on-error={}',
    '  :set incnetBusy false',
    '}',
  ].join('\n');
}

/** One paste into the MikroTik terminal. Safe to run again: every step checks before it adds. */
export function setupScript(site: { id: string; name: string; ports: string; subnet: number }, token: string) {
  const net = hotspotNet(site.subnet);
  const ports = parsePorts(site.ports);
  const host = appHost();
  const auth = `http-header-field=${ros(`Authorization: Bearer ${token}`)}`;
  return `# incnet setup for ${site.name.replace(/[\r\n]/g, ' ')}
# Paste everything into WinBox > New Terminal (or SSH). Safe to run again.
{
:put "incnet: setting up the hotspot..."
:local bridge "incnet-bridge"
:local net ${ros(net)}

# Hotspot must be allowed by device-mode (RouterOS 7.17+ on some models).
:local dm true
:do { :set dm [/system device-mode get hotspot] } on-error={}
:if ($dm = false) do={
  :put "incnet: Hotspot is turned off in device-mode. Run this, then press the reset button (or power-cycle) when asked, and paste the script again:"
  :put "  /system device-mode update hotspot=yes"
  :error "incnet: enable hotspot in device-mode first"
}

# 1. A bridge for the Wi-Fi access point ports
/interface bridge
:if ([:len [find name=$bridge]] = 0) do={ add name=$bridge comment="incnet hotspot" }
:foreach p in={${ports.map(ros).join(';')}} do={
  /interface bridge port remove [find interface=$p]
  /interface bridge port add bridge=$bridge interface=$p comment="incnet"
}
:do { /interface list member add list=LAN interface=$bridge } on-error={}

# 2. Addresses and DHCP for hotspot customers
/ip address
:if ([:len [find interface=$bridge]] = 0) do={ add address=($net . ".1/24") interface=$bridge comment="incnet" }
/ip pool
:if ([:len [find name="incnet-pool"]] = 0) do={ add name="incnet-pool" ranges=($net . ".10-" . $net . ".250") }
/ip dhcp-server
:if ([:len [find name="incnet-dhcp"]] = 0) do={ add name="incnet-dhcp" interface=$bridge address-pool="incnet-pool" lease-time=1h disabled=no }
/ip dhcp-server network
:if ([:len [find address=($net . ".0/24")]] = 0) do={ add address=($net . ".0/24") gateway=($net . ".1") dns-server=($net . ".1") comment="incnet" }
/ip dns set allow-remote-requests=yes
/ip firewall nat
:if ([:len [find action=masquerade]] = 0) do={ add chain=srcnat src-address=($net . ".0/24") action=masquerade comment="incnet" }

# 3. The hotspot itself
:local dir "hotspot"
:if ([:len [/file find name="flash"]] > 0) do={ :set dir "flash/hotspot" }
/ip hotspot profile
:if ([:len [find name="incnet"]] = 0) do={ add name="incnet" }
set [find name="incnet"] hotspot-address=($net . ".1") dns-name="" html-directory=$dir login-by=http-pap,cookie http-cookie-lifetime=1d
/ip hotspot
:if ([:len [find name="incnet"]] = 0) do={ add name="incnet" interface=$bridge address-pool="incnet-pool" profile="incnet" disabled=no }

# 4. Let phones reach the payment page before they log in
/ip hotspot walled-garden
:if ([:len [find comment="incnet app"]] = 0) do={ add dst-host=${ros(host)} action=allow comment="incnet app" }
/ip hotspot walled-garden ip
:if ([:len [find comment="incnet app"]] = 0) do={ add dst-host=${ros(host)} action=accept comment="incnet app" }

# 5. Trust public HTTPS certificates, then fetch the incnet login page
:do { /certificate settings set builtin-trust-anchors=trusted } on-error={}
:delay 2s
/tool fetch url=${ros(`${APP_URL}/api/router/${site.id}/login`)} ${auth} dst-path=($dir . "/login.html")${certArg()}

# 6. Keep the router in sync with incnet every ${SYNC_INTERVAL}s
/system script
:if ([:len [find name="incnet-sync"]] = 0) do={ add name="incnet-sync" }
set [find name="incnet-sync"] policy=ftp,read,write,policy,test,sensitive dont-require-permissions=yes source=${ros(syncSource(site.id, token))}
/system scheduler
:if ([:len [find name="incnet-sync"]] = 0) do={ add name="incnet-sync" }
set [find name="incnet-sync"] start-time=startup interval=${SYNC_INTERVAL}s policy=ftp,read,write,policy,test,sensitive on-event="/system script run incnet-sync" disabled=no
:global incnetCursor "0"
/system script run incnet-sync

:put "incnet: done. Your dashboard will show this router as online in a few seconds."
}
`;
}

/** The hotspot login page. It hands the phone to the incnet portal with what the router knows about it. */
export function loginPage(slug: string) {
  const base = `${APP_URL}/p/${slug}?mac=$(mac-esc)&ip=$(ip)&login=$(link-login-only)&dst=$(link-orig-esc)`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Wi-Fi</title>
<meta http-equiv="refresh" content="2; url=${base}">
<script>location.replace("${base}"+"&err="+encodeURIComponent("$(error)"));</script></head>
<body style="font-family:system-ui;text-align:center;padding:40px">Opening Wi-Fi login&hellip;</body></html>
`;
}


export const profileName = (packageId: string) => `incnet-${packageId.slice(-10)}`;

/** The script returned to the router on each sync: package profiles, users to add or remove, and the next cursor. */
export function syncScript(input: { full: boolean; packages: SyncPackage[]; accesses: SyncAccess[]; cursor: bigint; loginSize: number; loginUrl: string; token: string }) {
  const lines: string[] = [':global incnetCursor'];

  // Put the login page back if something (a hotspot reset, an upgrade) replaced it.
  lines.push(
    ':local lp "hotspot/login.html"',
    ':if ([:len [/file find name="flash"]] > 0) do={ :set lp "flash/hotspot/login.html" }',
    ':local ok false',
    `:do { :if ([/file get [find name=$lp] size] = ${input.loginSize}) do={ :set ok true } } on-error={}`,
    `:if ($ok = false) do={ :do { /tool fetch url=${ros(input.loginUrl)} http-header-field=${ros(`Authorization: Bearer ${input.token}`)} dst-path=$lp${certArg()} } on-error={} }`,
  );

  if (input.packages.length) {
    lines.push('/ip hotspot user profile');
    for (const p of input.packages) {
      const name = ros(profileName(p.id));
      lines.push(`:if ([:len [find name=${name}]] = 0) do={ add name=${name} }`);
      lines.push(`set [find name=${name}] rate-limit="${p.upKbps}k/${p.downKbps}k" shared-users=${p.devices} keepalive-timeout=2m`);
    }
  }

  lines.push('/ip hotspot user');
  if (input.full) lines.push('remove [find comment="incnet"]');
  const now = Date.now();
  const gone: string[] = [];
  for (const a of input.accesses) {
    const name = ros(a.code);
    const remaining = a.expiresAt ? Math.floor((a.expiresAt.getTime() - now) / 1000) : 0;
    if (a.status !== 'active' || remaining <= 0) {
      if (!input.full) { lines.push(`remove [find name=${name}]`); gone.push(name); }
      continue;
    }
    const limits = `profile=${ros(profileName(a.packageId))} limit-uptime=${remaining}s limit-bytes-total=${a.dataLimitMb ? a.dataLimitMb * 1024 * 1024 : 0}`;
    lines.push(`:if ([:len [find name=${name}]] = 0) do={ add name=${name} password=${name} server=all comment="incnet" ${limits} } else={ set [find name=${name}] ${limits} }`);
  }
  // Disconnect anyone whose time ran out or whose code was cancelled.
  for (const name of gone) {
    lines.push(`/ip hotspot active remove [find user=${name}]`, `/ip hotspot cookie remove [find user=${name}]`);
  }
  lines.push(`:set incnetCursor "${input.cursor}"`);
  return lines.join('\n') + '\n';
}
