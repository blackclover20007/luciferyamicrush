// lang: JavaScript, file: commands/statusdl.js
// Download contact statuses silently (auto-view all + manual save)

import { reply, numToJid, getMentions } from '../lib/utils.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

// Store status messages as they come in (keyed by sender)
const statusCache = new Map();

export function cacheStatus(msg) {
  if (msg.key.remoteJid !== 'status@broadcast') return;
  const sender = msg.key.participant || msg.key.remoteJid;
  const existing = statusCache.get(sender) || [];
  existing.unshift({ msg, ts: Date.now() });
  if (existing.length > 30) existing.pop();
  statusCache.set(sender, existing);
}

export async function handleStatusDL(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'list') {
    if (!statusCache.size) return reply(sock, msg, 'No statuses cached yet. Wait for contacts to post.');
    const lines = [...statusCache.entries()].map(([s, items]) =>
      `${s.replace('@s.whatsapp.net','')} — ${items.length} status(es)`
    ).join('\n');
    return reply(sock, msg, `*Cached Statuses:*\n${lines}`);
  }

  // .statusdl [number] — send their latest status to you
  const mentions = getMentions(msg);
  let target;
  if (mentions.length > 0) {
    target = mentions[0];
  } else if (args[0]) {
    target = numToJid(args[0].replace(/\D/g,''));
  } else {
    return reply(sock, msg,
      'Usage:\n.statusdl list\n.statusdl [number] or @mention'
    );
  }

  const statuses = statusCache.get(target);
  if (!statuses || !statuses.length) {
    return reply(sock, msg, `No cached statuses for ${target.replace('@s.whatsapp.net','')}.`);
  }

  for (const { msg: statusMsg } of statuses.slice(0, 5)) {
    try {
      const msgType = Object.keys(statusMsg.message || {})[0];

      if (msgType === 'imageMessage') {
        const buf = await downloadMediaMessage(statusMsg, 'buffer', {}, { logger: { info: ()=>{}, warn: ()=>{}, error: ()=>{} } });
        await sock.sendMessage(jid, { image: buf, caption: `📊 Status from ${target.replace('@s.whatsapp.net','')}` });
      } else if (msgType === 'videoMessage') {
        const buf = await downloadMediaMessage(statusMsg, 'buffer', {}, { logger: { info: ()=>{}, warn: ()=>{}, error: ()=>{} } });
        await sock.sendMessage(jid, { video: buf, caption: `📊 Status from ${target.replace('@s.whatsapp.net','')}` });
      } else if (msgType === 'conversation' || msgType === 'extendedTextMessage') {
        const text = statusMsg.message.conversation || statusMsg.message.extendedTextMessage?.text;
        await sock.sendMessage(jid, { text: `📊 Text status from ${target.replace('@s.whatsapp.net','')}: ${text}` });
      }
    } catch {}
  }
}
