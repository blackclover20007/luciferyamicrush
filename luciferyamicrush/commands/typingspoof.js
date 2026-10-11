// lang: JavaScript, file: commands/typingspoof.js
// Fake typing or recording indicator to a chat

import { reply, numToJid, getMentions, sleep } from '../lib/utils.js';

export async function handleTypingSpoof(sock, msg, args, jid) {
  // .typingspoof [typing|recording] [duration_sec?] [@target?]
  const mentions = getMentions(msg);
  const type     = args[0]?.toLowerCase() === 'recording' ? 'recording' : 'composing';
  const duration = parseInt(args[1]) || 10;
  const target   = mentions.length > 0
    ? mentions[0]
    : args[2]
      ? numToJid(args[2].replace(/\D/g,''))
      : jid;

  await sock.sendPresenceUpdate(type, target);
  await reply(sock, msg, `✏️ Faking "${type}" in ${target} for ${duration}s`);

  await sleep(duration * 1000);
  await sock.sendPresenceUpdate('paused', target);
}
