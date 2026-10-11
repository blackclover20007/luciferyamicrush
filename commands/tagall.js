// lang: JavaScript, file: commands/tagall.js
// Tag every member in a group — works even without admin

import { reply } from '../lib/utils.js';

export async function handleTagAll(sock, msg, args, jid) {
  if (!jid.endsWith('@g.us')) {
    return reply(sock, msg, 'Must be used in a group.');
  }

  const meta    = await sock.groupMetadata(jid);
  const members = meta.participants.map(p => p.id);
  const message = args.join(' ') || '📢 Attention everyone!';

  // Build mention text: @number for each member
  const mentions = members;
  const text = message + '\n' + members.map(m => `@${m.replace('@s.whatsapp.net', '')}`).join(' ');

  await sock.sendMessage(jid, {
    text,
    mentions,
  });
}
