// lang: JavaScript, file: commands/forward.js
// Auto-forward messages from a source JID to a destination JID

import { reply, numToJid } from '../lib/utils.js';

const rules = new Map(); // source → destination

export async function handleForward(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  if (sub === 'add') {
    // .forward add [source number/jid] [dest number/jid]
    if (args.length < 3) {
      return reply(sock, msg, 'Usage: .forward add [source] [destination]');
    }
    const src  = args[1].includes('@') ? args[1] : numToJid(args[1].replace(/\D/g,''));
    const dest = args[2].includes('@') ? args[2] : numToJid(args[2].replace(/\D/g,''));
    rules.set(src, dest);
    return reply(sock, msg, `✅ Forwarding ${src} → ${dest}`);
  }

  if (sub === 'remove') {
    const src = args[1].includes('@') ? args[1] : numToJid(args[1].replace(/\D/g,''));
    rules.delete(src);
    return reply(sock, msg, `✅ Removed forward rule for ${src}`);
  }

  if (sub === 'list') {
    if (!rules.size) return reply(sock, msg, 'No forward rules.');
    const list = [...rules.entries()].map(([s, d]) => `${s} → ${d}`).join('\n');
    return reply(sock, msg, `*Forward Rules:*\n${list}`);
  }

  await reply(sock, msg,
    '.forward add [source] [dest]\n' +
    '.forward remove [source]\n' +
    '.forward list'
  );
}

// Called from router for every incoming message
export function checkForward(sock, msg) {
  const src = msg.key.remoteJid;
  const dest = rules.get(src);
  if (!dest) return;

  sock.sendMessage(dest, {
    forward: msg,
  }).catch(() => {});
}
