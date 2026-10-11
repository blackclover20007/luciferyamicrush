// lang: JavaScript, file: commands/presencespy.js
// Watch when specific contacts go online/offline

import { reply, numToJid } from '../lib/utils.js';
import { PresenceTracker } from '../lib/presence.js';

export async function handlePresenceSpy(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'watch') {
    if (!args[1]) return reply(sock, msg, 'Usage: .spy watch [number]');
    const target = numToJid(args[1].replace(/\D/g, ''));
    PresenceTracker.watch(target);
    await sock.presenceSubscribe(target);
    return reply(sock, msg, `👁️ Watching ${target} — online/offline activity will be logged`);
  }

  if (sub === 'unwatch') {
    if (!args[1]) return reply(sock, msg, 'Usage: .spy unwatch [number]');
    const target = numToJid(args[1].replace(/\D/g, ''));
    PresenceTracker.unwatch(target);
    return reply(sock, msg, `🛑 Stopped watching ${target}`);
  }

  if (sub === 'log') {
    if (!args[1]) return reply(sock, msg, 'Usage: .spy log [number]');
    const target = numToJid(args[1].replace(/\D/g, ''));
    const log = PresenceTracker.formatLog(target);
    return reply(sock, msg, `📊 *Activity Log — ${args[1]}:*\n${log}`);
  }

  if (sub === 'list') {
    const watching = PresenceTracker.watching();
    if (!watching.length) return reply(sock, msg, 'Not watching anyone.');
    return reply(sock, msg, `*Watching:*\n${watching.map(j => j.replace('@s.whatsapp.net','')).join('\n')}`);
  }

  await reply(sock, msg,
    '*Presence Spy:*\n' +
    '.spy watch [number]\n' +
    '.spy unwatch [number]\n' +
    '.spy log [number]\n' +
    '.spy list'
  );
}
