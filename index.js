// lang: JavaScript, file: index.js, target: Node.js 18+, Baileys multi-device
// Entry point — connects to WA, routes all commands

import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  jidDecode,
  getContentType,
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { CONFIG } from './config.js';
import { Store } from './lib/store.js';
import { handleMessage } from './lib/router.js';
import { AntiDelete } from './lib/antidelete.js';
import { PresenceTracker } from './lib/presence.js';

// ── setup ─────────────────────────────────────────────────────────────────────

if (!existsSync(CONFIG.SESSION_DIR)) mkdirSync(CONFIG.SESSION_DIR, { recursive: true });
if (!existsSync(CONFIG.DATA_DIR))    mkdirSync(CONFIG.DATA_DIR,    { recursive: true });

const logger = pino({ level: 'silent' });

// ── connect ───────────────────────────────────────────────────────────────────

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(CONFIG.SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: true,
    browser: ['Yami', 'Chrome', '120.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: !CONFIG.GHOST_MODE,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => Store.getMessage(key),
  });

  Store.bind(sock.ev);

  // ── connection state ───────────────────────────────────────────────────────

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\n[Yami] Scan QR code above with WhatsApp\n');
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`[Yami] Disconnected (${code}). Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) setTimeout(connect, 3000);
    }

    if (connection === 'open') {
      console.log(`[Yami] Connected as ${sock.user.id}`);
      if (CONFIG.GHOST_MODE) {
        await sock.sendPresenceUpdate('unavailable');
        console.log('[Yami] Ghost mode active');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ── messages ───────────────────────────────────────────────────────────────

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        // Anti-delete: store every incoming message
        if (CONFIG.ANTI_DELETE) AntiDelete.store(msg);

        // Auto status view
        if (CONFIG.AUTO_STATUS_VIEW && msg.key.remoteJid === 'status@broadcast') {
          await sock.readMessages([msg.key]);
          continue;
        }

        await handleMessage(sock, msg);
      } catch (err) {
        console.error('[Yami] Message handler error:', err.message);
      }
    }
  });

  // ── message deletions ──────────────────────────────────────────────────────

  sock.ev.on('messages.delete', async (item) => {
    if (!CONFIG.ANTI_DELETE) return;
    if ('keys' in item) {
      for (const key of item.keys) {
        AntiDelete.onDelete(sock, key);
      }
    }
  });

  // ── message updates (edits) ────────────────────────────────────────────────

  sock.ev.on('messages.update', async (updates) => {
    if (!CONFIG.ANTI_REVOKE) return;
    for (const update of updates) {
      AntiDelete.onEdit(sock, update);
    }
  });

  // ── presence updates ───────────────────────────────────────────────────────

  sock.ev.on('presence.update', ({ id, presences }) => {
    PresenceTracker.update(id, presences);
  });

  return sock;
}

connect();
