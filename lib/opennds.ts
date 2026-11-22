import { APP_URL, SYNC_INTERVAL } from './config';
import { hotspotNet } from './routeros';
import type { SyncData } from './sync';

/**
 * Raspberry Pi and OpenWrt gateways run openNDS (the open-source captive portal) plus a small
 * incnet agent. Like MikroTik, the gateway always calls out to incnet, so it works behind any ISP.
 *
 * openNDS sends new phones to the incnet portal (its "FAS"). When a code is paid or redeemed,
 * the agent picks it up on its next check-in and runs `ndsctl auth <phone ip> ...` with the
 * package's time, speed and data limits.
 */

/** Single-quotes a value for POSIX sh. */
export const sh = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

/** One instruction per line, read by the agent: FULL, AUTH, DEAUTH, CURSOR. */
export function openndsLines(data: SyncData) {
  const pkgs = new Map(data.packages.map((p) => [p.id, p]));
  const out: string[] = [];
  if (data.full) out.push('FULL');
  const now = Date.now();
  for (const a of data.accesses) {
    if (!a.ip || !/^[0-9a-fA-F:.]{3,45}$/.test(a.ip)) continue;
    const minutes = a.expiresAt ? Math.floor((a.expiresAt.getTime() - now) / 60_000) : 0;
    if (a.status !== 'active' || minutes <= 0) {
      if (!data.full) out.push(`DEAUTH ${a.ip} ${a.code}`);
      continue;
    }
    const p = pkgs.get(a.packageId);
    out.push(`AUTH ${a.ip} ${minutes} ${p?.upKbps ?? 0} ${p?.downKbps ?? 0} ${a.dataLimitMb ? a.dataLimitMb * 1024 : 0} ${a.code}`);
  }
  out.push(`CURSOR ${data.cursor}`);
  return out.join('\n') + '\n';
}

/** The agent: a POSIX sh loop that works on OpenWrt (busybox) and Raspberry Pi OS alike. */
function agentScript() {
  return `#!/bin/sh
# incnet agent: keeps openNDS in step with incnet. Config: /etc/incnet.conf
. /etc/incnet.conf
CURSOR=0
TMP=/tmp/incnet-sync.txt
while true; do
  if curl -fsS --max-time 20 -H "Authorization: Bearer $INCNET_TOKEN" "$INCNET_URL/api/router/$INCNET_SITE/sync?c=$CURSOR&v=opennds" -o "$TMP" 2>/dev/null; then
    while read -r CMD A B C D E F; do
      case "$CMD" in
        AUTH) ndsctl auth "$A" "$B" "$C" "$D" 0 "$E" "incnet-$F" >/dev/null 2>&1 ;;
        DEAUTH) ndsctl deauth "$A" >/dev/null 2>&1 ;;
        CURSOR) CURSOR="$A" ;;
      esac
    done < "$TMP"
  fi
  sleep "\${INCNET_INTERVAL:-${SYNC_INTERVAL}}"
done
`;
}

/** One command for a Raspberry Pi (Raspberry Pi OS / Debian) or an OpenWrt router. Safe to run again. */
export function installScript(site: { id: string; name: string; slug: string; ports: string; subnet: number }, token: string) {
  const host = new URL(APP_URL).hostname;
  const port = APP_URL.startsWith('https://') ? '443' : new URL(APP_URL).port || '80';
  const iface = (site.ports.split(',')[0] || '').trim() || 'wlan0';
  const net = hotspotNet(site.subnet);
  const gatewayName = site.name.replace(/[^\w .-]/g, '').slice(0, 40) || 'incnet';
  return `#!/bin/sh
# incnet gateway installer for ${gatewayName}
# Raspberry Pi OS (Bookworm or newer) or OpenWrt. Run as root. Safe to run again.
#   Optional: SSID="My Cafe Wi-Fi" IFACE=wlan0 before "sh" to override the defaults.
set -e
INCNET_URL=${sh(APP_URL)}
INCNET_SITE=${sh(site.id)}
INCNET_TOKEN=${sh(token)}
IFACE="\${IFACE:-${iface}}"
SSID="\${SSID:-${gatewayName} Wi-Fi}"
say() { printf '\\033[1;36mincnet:\\033[0m %s\\n' "$1"; }
[ "$(id -u)" = 0 ] || { echo "Run as root (sudo)."; exit 1; }

cat > /etc/incnet.conf <<EOF
INCNET_URL=$INCNET_URL
INCNET_SITE=$INCNET_SITE
INCNET_TOKEN=$INCNET_TOKEN
INCNET_INTERVAL=${SYNC_INTERVAL}
EOF
chmod 600 /etc/incnet.conf

if [ -f /etc/openwrt_release ]; then
  # ── OpenWrt ─────────────────────────────────────────────────────
  say "OpenWrt detected. Installing openNDS..."
  opkg update >/dev/null
  opkg install opennds curl ca-bundle >/dev/null
  [ "$IFACE" = "wlan0" ] && IFACE=br-lan
  uci -q batch <<EOF
set opennds.@opennds[0].enabled='1'
set opennds.@opennds[0].gatewayinterface='$IFACE'
set opennds.@opennds[0].gatewayname=${sh(gatewayName)}
set opennds.@opennds[0].fasport='${port}'
set opennds.@opennds[0].fasremotefqdn='${host}'
set opennds.@opennds[0].faspath='/p/${site.slug}'
set opennds.@opennds[0].fas_secure_enabled='0'
commit opennds
EOF
  cat > /usr/sbin/incnet-agent <<'AGENT'
${agentScript()}AGENT
  chmod 755 /usr/sbin/incnet-agent
  cat > /etc/init.d/incnet <<'INIT'
#!/bin/sh /etc/rc.common
START=99
USE_PROCD=1
start_service() {
  procd_open_instance
  procd_set_param command /usr/sbin/incnet-agent
  procd_set_param respawn
  procd_close_instance
}
INIT
  chmod 755 /etc/init.d/incnet
  /etc/init.d/opennds enable; /etc/init.d/opennds restart
  /etc/init.d/incnet enable; /etc/init.d/incnet restart
else
  # ── Raspberry Pi OS / Debian ────────────────────────────────────
  say "Installing packages (this takes a few minutes on a Pi)..."
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git build-essential libmicrohttpd-dev nftables curl ca-certificates network-manager >/dev/null

  if ! command -v opennds >/dev/null 2>&1; then
    say "Building openNDS..."
    rm -rf /usr/local/src/openNDS
    git clone -q --depth 1 https://github.com/openNDS/openNDS.git /usr/local/src/openNDS
    make -s -C /usr/local/src/openNDS
    make -s -C /usr/local/src/openNDS install
  fi

  say "Setting up the hotspot network on $IFACE (${net}.0/24)..."
  nmcli -t con delete incnet-hotspot >/dev/null 2>&1 || true
  case "$IFACE" in
    wl*) nmcli con add type wifi ifname "$IFACE" con-name incnet-hotspot autoconnect yes ssid "$SSID" 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared ipv4.addresses ${net}.1/24 ipv6.method disabled >/dev/null ;;
    *)   nmcli con add type ethernet ifname "$IFACE" con-name incnet-hotspot autoconnect yes ipv4.method shared ipv4.addresses ${net}.1/24 ipv6.method disabled >/dev/null ;;
  esac
  nmcli con up incnet-hotspot >/dev/null

  mkdir -p /etc/config
  cat > /etc/config/opennds <<EOF
config opennds
	option enabled '1'
	option gatewayinterface '$IFACE'
	option gatewayname ${sh(gatewayName)}
	option fasport '${port}'
	option fasremotefqdn '${host}'
	option faspath '/p/${site.slug}'
	option fas_secure_enabled '0'
EOF
  cat > /usr/local/sbin/incnet-agent <<'AGENT'
${agentScript()}AGENT
  chmod 755 /usr/local/sbin/incnet-agent
  OPENNDS_BIN=$(command -v opennds)
  cat > /etc/systemd/system/opennds.service <<EOF
[Unit]
Description=openNDS captive portal
After=network-online.target NetworkManager.service
Wants=network-online.target
[Service]
ExecStart=$OPENNDS_BIN -f
Restart=always
[Install]
WantedBy=multi-user.target
EOF
  cat > /etc/systemd/system/incnet.service <<EOF
[Unit]
Description=incnet agent
After=opennds.service
[Service]
ExecStart=/usr/local/sbin/incnet-agent
Restart=always
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now opennds incnet >/dev/null 2>&1
  systemctl restart opennds incnet
fi

say "Done. ${gatewayName} should show as online in your incnet dashboard within a few seconds."
`;
}
