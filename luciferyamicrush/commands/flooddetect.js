// lang: JavaScript, file: commands/flooddetect.js
// Detect if someone is spamming you — auto-mute or block on threshold

import { reply } from '../lib/utils.js';

const counters  = new Map(); // sender → { count, lastReset }
const WINDOW_MS = 10000;    // 10 second window
let threshold   = 8;        // messages per window before action
let action      = 'mute';   // 'mute' or 'block'
let active      = false;

function reset(sender) {
  counters.set(sender, { count: 0, lastReset: Date.now() });
}

export const FloodDetect = {
  check(sock, msg, sender, jid) {
    if (!active) return;
    if (!counters.has(sender)) reset(sender);

    const entry = counters.get(sender);
    const now   = Date.now();

    if (now - entry.lastReset > WINDOW_MS) {
      reset(sender);
      return;
    }

    entry.count++;

    if (entry.count >= threshold) {
      reset(sender);
      if (action === 'block') {
        sock.updateBlockStatus(sender, 'block').catch(() => {});
      } else {
        // Mute for 8 hours
        sock.chatModify({
          mute: 8 * 60 * 60 * 1000,
        }, jid).catch(() => {});
      }
    }
  },
};

export async function handleFloodDetect(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on')  { active = true;  return reply(sock, msg, `✅ Flood detect ON (threshold: ${threshold}, action: ${action})`); }
  if (sub === 'off') { active = false; return reply(sock, msg, '❌ Flood detect OFF'); }

  if (sub === 'threshold') {
    const val = parseInt(args[1]);
    if (isNaN(val)) return reply(sock, msg, 'Usage: .flooddetect threshold [number]');
    threshold = val;
    return reply(sock, msg, `✅ Threshold set to ${threshold} msgs/10s`);
  }

  if (sub === 'action') {
    const val = args[1]?.toLowerCase();
    if (!['mute','block'].includes(val)) return reply(sock, msg, 'Action must be: mute or block');
    action = val;
    return reply(sock, msg, `✅ Action set to: ${action}`);
  }

  await reply(sock, msg,
    `*Flood Detect:* ${active ? 'ON' : 'OFF'}\n` +
    `Threshold: ${threshold} msgs/10s\nAction: ${action}\n\n` +
    '.flooddetect on/off\n' +
    '.flooddetect threshold [n]\n' +
    '.flooddetect action [mute|block]'
  );
}
