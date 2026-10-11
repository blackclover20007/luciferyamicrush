// lang: JavaScript, file: commands/antiread.js
// Toggle anti-read receipts — read messages without sending blue ticks

import { CONFIG } from '../config.js';
import { reply } from '../lib/utils.js';

let antiReadActive = CONFIG.ANTI_READ;

export function isAntiReadActive() {
  return antiReadActive;
}

export async function handleAntiRead(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on' || (!sub && !antiReadActive)) {
    antiReadActive = true;
    // Patch: set readReceiptsEnabled to false via presence
    await sock.updateAccountSettings({ readReceipts: 0 });
    await reply(sock, msg, '📵 Anti-read ON — blue ticks suppressed');
  } else if (sub === 'off' || (!sub && antiReadActive)) {
    antiReadActive = false;
    await sock.updateAccountSettings({ readReceipts: 1 });
    await reply(sock, msg, '✅ Anti-read OFF — blue ticks enabled');
  } else {
    await reply(sock, msg, `Anti-read is: ${antiReadActive ? 'ON' : 'OFF'}\nUsage: .antiread on/off`);
  }
}
