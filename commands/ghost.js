// lang: JavaScript, file: commands/ghost.js
// Toggle ghost mode — appear offline while still connected

import { CONFIG } from '../config.js';
import { reply } from '../lib/utils.js';

let ghostActive = CONFIG.GHOST_MODE;

export async function handleGhost(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'on' || (!sub && !ghostActive)) {
    ghostActive = true;
    await sock.sendPresenceUpdate('unavailable');
    await reply(sock, msg, '👻 Ghost mode ON — you appear offline');
  } else if (sub === 'off' || (!sub && ghostActive)) {
    ghostActive = false;
    await sock.sendPresenceUpdate('available');
    await reply(sock, msg, '👁️ Ghost mode OFF — you appear online');
  } else {
    await reply(sock, msg, `Ghost mode is currently: ${ghostActive ? 'ON' : 'OFF'}\nUsage: .ghost on/off`);
  }
}
