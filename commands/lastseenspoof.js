// lang: JavaScript, file: commands/lastseenspoof.js
// Control last seen visibility — hide/freeze it

import { reply } from '../lib/utils.js';

export async function handleLastSeenSpoof(sock, msg, args, jid) {
  const sub = args[0]?.toLowerCase();

  // WA privacy settings: 'all' | 'contacts' | 'contact_blacklist' | 'none'
  const map = {
    'hide':     'none',
    'contacts': 'contacts',
    'all':      'all',
    'none':     'none',
  };

  if (!sub || !map[sub]) {
    return reply(sock, msg,
      '*Last Seen Control:*\n' +
      '.lastseen hide — nobody sees your last seen\n' +
      '.lastseen contacts — only contacts see it\n' +
      '.lastseen all — everyone sees it'
    );
  }

  try {
    await sock.updateLastSeenPrivacy(map[sub]);
    await reply(sock, msg, `✅ Last seen set to: ${sub}`);
  } catch (err) {
    await reply(sock, msg, `Failed: ${err.message}`);
  }
}
