# 🏴‍☠️ Yami Userbot

WhatsApp technical limit breaker — full userbot on Baileys multi-device.

## Setup

```bash
npm install
node index.js
```

Scan the QR code with your WhatsApp. Session saves to `./session/`.

## Config

Edit `config.js` before running:

```js
OWNER_NUMBER: '263784970429',  // your number, no +
PREFIX: '.',
GHOST_MODE: false,
ANTI_READ: true,
```

## Commands

Type `.help` or `.menu` in any chat after connecting.

## Data files

- `./data/bulk_targets.txt` — one number per line for `.bulk` and `.massadd`
- `./data/autoreply.json` — auto-reply rules (auto-created)
- `./data/autoreact.json` — auto-react rules (auto-created)
- `./data/autoblock_triggers.json` — auto-block triggers (auto-created)

## Feature list

| Category | Commands |
|---|---|
| Crash | `.bugcrush` — unicode renderer bomb, 4 intensity levels, spam mode |
| Privacy | `.ghost`, `.antiread`, `.lastseen` |
| Capture | `.viewonce`, `.statusdl`, `.pfp` |
| Automation | `.autoreply`, `.autoreact`, `.schedule`, `.forward` |
| Broadcast | `.bulk`, `.tagall`, `.fakereply` |
| Recon | `.spy`, `.checknum`, `.scrape` |
| Media | `.sticker`, `.spoof` |
| Group | `.massadd`, `.masskick`, `.clone` |
| Tricks | `.presenceflood`, `.typingspoof` |
| Defense | `.autoblock`, `.flooddetect` |

## Requires

- Node.js 18+
- ffmpeg (via ffmpeg-static, auto-installed)
