# Raspberry Pi or OpenWrt as the hotspot

Don't have a MikroTik? A Raspberry Pi (3B+, 4 or 5) or any router running OpenWrt can be the hotspot instead. incnet uses [openNDS](https://opennds.readthedocs.io), the open-source captive portal, plus a small incnet agent.

This is different from [self-hosting the incnet server](self-hosting.md). The gateway is the box at the venue that phones connect to. The server is where the dashboard runs. A gateway works with incnet Cloud or with your own server.

## 1. Add the router in incnet

Go to **Routers → Add router → Raspberry Pi or OpenWrt**. For the hotspot interface:

| Setup | Interface |
|---|---|
| Pi's own Wi-Fi is the hotspot; Ethernet goes to your internet router | `wlan0` |
| A USB network adapter goes to a separate access point | `eth1` |
| OpenWrt router | `br-lan` (set automatically) |

## 2. Run one command on the device

The router page shows a command like the one below. It already contains this gateway's secret token, so copy it from the dashboard:

```bash
curl -fsSL -H "Authorization: Bearer inr_…" https://incnet.incpritech.com/api/router/<id>/install | sudo sh
```

To name the Wi-Fi network (Pi with `wlan0` only), put the name right after `sudo`:

```bash
… | sudo SSID="Mlimani Café Wi-Fi" sh
```

The command sets up the device for the type it detects.

**On a Raspberry Pi (Raspberry Pi OS Bookworm or newer):**

1. Installs the build tools and builds openNDS from source. The first time takes a few minutes.
2. Uses NetworkManager to create the hotspot network `10.5.50.0/24`, with DHCP and internet sharing. For `wlan0` it starts an open Wi-Fi access point.
3. Points openNDS at your incnet Wi-Fi page.
4. Installs the `incnet` agent as a systemd service, so it starts on boot.

**On OpenWrt:**

1. Installs `opennds` with `opkg`.
2. Points openNDS at your Wi-Fi page.
3. Installs the agent as a procd service.

After about 10 seconds, the router page in incnet shows the gateway as online.

## How it works

1. A phone joins the Wi-Fi. openNDS sends it to `https://<incnet>/p/<venue>?clientip=…`.
2. The customer pays or enters a voucher. incnet marks the code active for that phone's IP address.
3. The agent checks in every few seconds. It then runs `ndsctl auth <ip> <minutes> <upload> <download> …` with the package's time, speed and data cap.
4. When time runs out or you cancel the code, the agent runs `ndsctl deauth`.

## Undo

On a Pi:

```bash
sudo systemctl disable --now incnet opennds && sudo nmcli con delete incnet-hotspot
```

On OpenWrt:

```bash
/etc/init.d/incnet disable; /etc/init.d/incnet stop; /etc/init.d/opennds stop
```

## Status

Raspberry Pi and OpenWrt support is **beta**. It follows openNDS's documented FAS and `ndsctl` interfaces, but hasn't yet been tested on every Pi model and OpenWrt release. Please report what works and what doesn't.
