// lang: JavaScript, file: commands/groupscrape.js
// Scrape all member numbers from a group you're in

import { reply } from '../lib/utils.js';
import { writeFileSync } from 'fs';
import { CONFIG } from '../config.js';

export async function handleGroupScrape(sock, msg, args, jid) {
  if (!jid.endsWith('@g.us')) {
    return reply(sock, msg, 'Must be used in a group.');
  }

  const meta    = await sock.groupMetadata(jid);
  const members = meta.participants.map(p => p.id.replace('@s.whatsapp.net', ''));
  const admins  = meta.participants.filter(p => p.admin).map(p => p.id.replace('@s.whatsapp.net', ''));

  const output = members.join('\n');
  const outFile = `${CONFIG.DATA_DIR}/scraped_${Date.now()}.txt`;
  writeFileSync(outFile, output);

  await reply(sock, msg,
    `📋 *Group Scraped: ${meta.subject}*\n` +
    `Total members: ${members.length}\n` +
    `Admins: ${admins.length}\n` +
    `Saved to: ${outFile}\n\n` +
    `*Numbers:*\n${members.join('\n')}`
  );
}
