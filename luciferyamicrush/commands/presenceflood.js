// lang: JavaScript, file: commands/presenceflood.js
// Spam presence updates (typing/online/offline) to a target

import { reply, numToJid, getMentions, sleep } from '../lib/utils.js';
import { CONFIG } from '../config.js';

export async function handlePresenceFlood(sock, msg, args, jid) {
  const mentions = getMentions(msg);

  let target = jid;
  let count  = 20;
  let delay  = 300;
  let idx    = 0;

  if (mentions.length > 0) {
    target = mentions[0]; idx++;
  } else if (args[idx] && /^\d+$/.test(args[idx])) {
    target = numToJid(args[idx++]);
  }

  if (args[idx] && !isNaN(args[idx])) count = Math.min(parseInt(args[idx++]), 100);
  if (args[idx] && !isNaN(args[idx])) delay = Math.max(parseInt(args[idx++]), 100);

  const states = ['composing', 'recording', 'available', 'unavailable'];

  await reply(sock, msg, `⚡ Presence flooding ${target} × ${count}`);

  for (let i = 0; i < count; i++) {
    const state = states[i % states.length];
    try {
      await sock.sendPresenceUpdate(state, target);
    } catch {}
    await sleep(delay);
  }
}
