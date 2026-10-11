// lang: JavaScript, file: lib/antidelete.js
// Stores messages and re-sends them when deleted or edited

import { CONFIG } from '../config.js';
import { getSender } from './utils.js';

const cache = new Map(); // key.id → { msg, sender, jid, timestamp }

export const AntiDelete = {
  store(msg) {
    if (!msg.key?.id) return;
    cache.set(msg.key.id, {
      msg,
      sender:    getSender(msg),
      jid:       msg.key.remoteJid,
      timestamp: Date.now(),
    });

    // Clean cache entries older than 30 minutes
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [id, entry] of cache.entries()) {
      if (entry.timestamp < cutoff) cache.delete(id);
    }
  },

  async onDelete(sock, key) {
    if (!CONFIG.ANTI_DELETE) return;
    const entry = cache.get(key.id);
    if (!entry) return;

    const { msg, sender, jid } = entry;
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '[media/non-text message]';

    const notification =
      `🚨 *Anti-Delete*\n` +
      `From: ${sender.replace('@s.whatsapp.net', '')}\n` +
      `Chat: ${jid}\n\n` +
      `*Deleted message:*\n${body}`;

    // Send to owner private chat
    const ownerJid = `${CONFIG.OWNER_NUMBER}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, { text: notification });
  },

  async onEdit(sock, update) {
    if (!CONFIG.ANTI_REVOKE) return;
    const { key, update: upd } = update;
    if (!upd?.message) return;

    const entry = cache.get(key.id);
    if (!entry) return;

    const oldBody =
      entry.msg.message?.conversation ||
      entry.msg.message?.extendedTextMessage?.text ||
      '[media]';

    const newBody =
      upd.message?.editedMessage?.message?.protocolMessage?.editedMessage?.conversation ||
      upd.message?.conversation ||
      '[media]';

    if (oldBody === newBody) return;

    const notification =
      `✏️ *Anti-Revoke (Edit Caught)*\n` +
      `From: ${entry.sender.replace('@s.whatsapp.net', '')}\n\n` +
      `*Before:*\n${oldBody}\n\n` +
      `*After:*\n${newBody}`;

    const ownerJid = `${CONFIG.OWNER_NUMBER}@s.whatsapp.net`;
    await sock.sendMessage(ownerJid, { text: notification });

    // Update cache with new message
    entry.msg.message = upd.message;
  },
};
